import Card from "@/models/Card";
import Portal from "@/models/Portal";
import Giftor from "@/models/Giftor";
import OutboundClick, { type OutboundStep } from "@/models/OutboundClick";
import LinkHealth, {
  type HealthChange,
  type HealthCheck,
  type HealthType,
  type LinkHealthProps,
  type PageStatus,
} from "@/models/LinkHealth";
import { channelFor, resolveOutbound } from "@/lib/cuelinks/destinations";
import { convertLink, type ConvertResult, type SubIds } from "@/lib/cuelinks/client";
import type { Converter } from "@/lib/cuelinks/resolve";

/**
 * Proactive link health: resolve every card, active portal and voucher partner
 * the way a real click would (same ladder as /api/out, but nothing is written
 * to the link cache), record where it lands and whether it earns, and note
 * what changed since the last check. Destination pages are fetched weekly to
 * catch removed pages.
 *
 * Runs on a time budget inside the daily cron and resumes where it stopped:
 * each row carries `dueAt`, and rows people actually click are re-checked
 * first and most often. Callers must have connected.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
// Slightly under a day / two days, so a daily cron at a fixed hour always
// finds clicked rows due and everything else due every other run.
const RECHECK_CLICKED_MS = 20 * 60 * 60 * 1000;
const RECHECK_OTHER_MS = 44 * 60 * 60 * 1000;
const PAGE_INTERVAL_MS = 7 * DAY_MS;
const CLICK_WINDOW_MS = 30 * DAY_MS;
const PAGE_TIMEOUT_MS = 10_000;
const CONCURRENCY = 6;

// Probe sub IDs; the transaction attributor treats this as "not a user".
const SUBIDS: SubIds = { subid: "health-check" };

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Only these steps send people to a real merchant/bank page. The others
// (pre-made Cuelinks, GroMo, other networks) point at an affiliate link, and
// fetching one would register a fake affiliate click — so those pages are
// never fetched.
const PAGEABLE: OutboundStep[] = ["cuelinks", "direct", "bank_site"];

const STEP_RANK: Record<OutboundStep, number> = {
  cuelinks: 5,
  cuelinks_static: 4,
  gromo: 4,
  partner: 4,
  bank_site: 2,
  direct: 1,
  internal: 0,
};

const keyOf = (type: HealthType, id: string) => `${type}:${id}`;

// ---- target registry -------------------------------------------------------

/** Make sure every live target has a row, labels are current, and gone targets are dropped. */
export async function syncTargets(): Promise<number> {
  const [cards, portals, giftors] = await Promise.all([
    Card.find({}, "slug name").lean<{ slug: string; name: string }[]>(),
    Portal.find({ status: "active" }, "slug name").lean<{ slug: string; name: string }[]>(),
    Giftor.find({}, "slug name").lean<{ slug: string; name: string }[]>(),
  ]);
  const targets: { type: HealthType; id: string; label: string }[] = [
    ...cards.filter((c) => c.slug).map((c) => ({ type: "card" as const, id: c.slug, label: c.name })),
    ...portals.filter((p) => p.slug).map((p) => ({ type: "portal" as const, id: p.slug, label: p.name })),
    ...giftors.filter((g) => g.slug).map((g) => ({ type: "voucher" as const, id: g.slug, label: g.name })),
  ];

  if (targets.length) {
    await LinkHealth.bulkWrite(
      targets.map((t) => ({
        updateOne: {
          filter: { key: keyOf(t.type, t.id) },
          update: {
            $set: { label: t.label || t.id },
            $setOnInsert: { type: t.type, targetId: t.id, dueAt: null },
          },
          upsert: true,
        },
      })),
    );
  }
  await LinkHealth.deleteMany({ key: { $nin: targets.map((t) => keyOf(t.type, t.id)) } });
  return targets.length;
}

/** Keys of targets clicked in the last 30 days, in LinkHealth key form. */
async function recentlyClicked(): Promise<Set<string>> {
  const rows = await OutboundClick.aggregate<{ _id: { type: string; id: string | null } }>([
    { $match: { createdAt: { $gte: new Date(Date.now() - CLICK_WINDOW_MS) }, type: { $in: ["card", "portal", "voucher"] } } },
    {
      $group: {
        _id: {
          type: "$type",
          id: { $cond: [{ $eq: ["$type", "card"] }, "$cardSlug", { $ifNull: ["$merchantSlug", "$targetId"] }] },
        },
      },
    },
  ]);
  return new Set(rows.filter((r) => r._id.id).map((r) => keyOf(r._id.type as HealthType, r._id.id!)));
}

// ---- page check ------------------------------------------------------------

type PageResult = { status: PageStatus; httpStatus: number | null };

async function fetchStatus(url: string, timeoutMs: number): Promise<PageResult> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": BROWSER_UA, accept: "text/html" },
      cache: "no-store",
    });
    res.body?.cancel().catch(() => {});
    const s = res.status;
    if (s === 404 || s === 410) return { status: "not_found", httpStatus: s };
    if (s === 401 || s === 403 || s === 429 || s === 999) return { status: "blocked", httpStatus: s };
    if (s >= 500) return { status: "error", httpStatus: s };
    return { status: "ok", httpStatus: s };
  } catch (err) {
    const code = (err as { cause?: { code?: string } }).cause?.code;
    if (code === "ENOTFOUND" || code === "EAI_AGAIN") return { status: "error", httpStatus: null };
    // Timeouts, resets and TLS refusals: the site is there but won't talk to us.
    return { status: "blocked", httpStatus: null };
  }
}

/**
 * Fetch a destination page. Bank sites often refuse bots (403, bot walls, or
 * dropping the TLS handshake from Node), so refusals and connection resets
 * count as "blocked", never as broken. Only an unknown domain is an "error".
 *
 * A 404 alone isn't trusted either — some sites answer bots with one. It
 * counts as "not_found" only if the site's home page loads normally (the path
 * is gone, the site isn't); otherwise it's "blocked".
 */
export async function checkPage(url: string, timeoutMs = PAGE_TIMEOUT_MS): Promise<PageResult> {
  const started = Date.now();
  const page = await fetchStatus(url, timeoutMs);
  if (page.status !== "not_found") return page;

  let origin: string;
  try {
    origin = new URL(url).origin + "/";
  } catch {
    return page;
  }
  if (origin === url) return page;
  const left = timeoutMs - (Date.now() - started);
  if (left < 1_000) return { status: "blocked", httpStatus: page.httpStatus };
  const home = await fetchStatus(origin, left);
  return home.status === "ok" ? page : { status: "blocked", httpStatus: page.httpStatus };
}

// ---- one target ------------------------------------------------------------

export function changeBetween(prev: HealthCheck | null, cur: HealthCheck): HealthChange | null {
  if (!prev) return null;
  if (prev.affiliated && !cur.affiliated) return "stopped_earning";
  if (!prev.affiliated && cur.affiliated) return "started_earning";
  const d = STEP_RANK[cur.step] - STEP_RANK[prev.step];
  return d < 0 ? "downgraded" : d > 0 ? "upgraded" : null;
}

interface RunContext {
  /** Epoch ms the run must finish by; page fetches are clipped to fit. */
  deadline: number;
  convert: Converter;
  pageMemo: Map<string, Promise<PageResult>>;
  clicked: Set<string>;
  forcePage?: boolean;
}

function memoConverter(): Converter {
  const memo = new Map<string, Promise<ConvertResult | null>>();
  return (url, channelId, subids) => {
    if (!channelId) return Promise.resolve(null);
    const k = `${channelId}|${url}`;
    if (!memo.has(k)) memo.set(k, convertLink({ url, channelId, subids }));
    return memo.get(k)!;
  };
}

// Don't start a page fetch with less than this left; it stays due instead.
const MIN_PAGE_WINDOW_MS = 1_500;

const newContext = (clicked: Set<string>, deadline: number, forcePage = false): RunContext => ({
  deadline,
  convert: memoConverter(),
  pageMemo: new Map(),
  clicked,
  forcePage,
});

async function checkRow(row: LinkHealthProps, ctx: RunContext): Promise<HealthChange | null> {
  const now = new Date();
  const r = await resolveOutbound(row.type, row.targetId, channelFor(row.type), SUBIDS, ctx.convert);
  const cur: HealthCheck = {
    step: r?.step ?? "internal",
    affiliated: r?.affiliated ?? false,
    campaignId: r?.campaignId ?? null,
    destination: r?.destination ?? "",
    checkedAt: now,
  };

  let page = row.page;
  const pageable = PAGEABLE.includes(cur.step) && !!cur.destination;
  const pageStale =
    ctx.forcePage ||
    !page ||
    page.url !== cur.destination ||
    now.getTime() - new Date(page.checkedAt).getTime() > PAGE_INTERVAL_MS;
  if (!pageable) {
    page = { status: "skipped", httpStatus: null, url: null, checkedAt: now, consecutiveErrors: 0 };
  } else if (pageStale && ctx.deadline - Date.now() >= MIN_PAGE_WINDOW_MS) {
    if (!ctx.pageMemo.has(cur.destination)) {
      const window = Math.min(PAGE_TIMEOUT_MS, ctx.deadline - Date.now());
      ctx.pageMemo.set(cur.destination, checkPage(cur.destination, window));
    }
    const p = await ctx.pageMemo.get(cur.destination)!;
    const prevErrors = page?.url === cur.destination ? (page?.consecutiveErrors ?? 0) : 0;
    page = {
      ...p,
      url: cur.destination,
      checkedAt: now,
      consecutiveErrors: p.status === "error" ? prevErrors + 1 : 0,
    };
  }
  const broken =
    !!page && (page.status === "not_found" || (page.status === "error" && page.consecutiveErrors >= 2));

  // Earning changes matter most, then a page breaking or recovering, then a
  // shift between steps that earn the same either way.
  const earningChange = changeBetween(row.current, cur);
  const change: HealthChange | null =
    earningChange === "stopped_earning" || earningChange === "started_earning"
      ? earningChange
      : broken && !row.broken
        ? "broke"
        : !broken && row.broken
          ? "recovered"
          : earningChange;

  const interval = ctx.clicked.has(row.key) ? RECHECK_CLICKED_MS : RECHECK_OTHER_MS;
  await LinkHealth.updateOne(
    { key: row.key },
    {
      $set: {
        current: cur,
        ...(row.current ? { previous: row.current } : {}),
        page,
        broken,
        dueAt: new Date(now.getTime() + interval),
        ...(change ? { lastChange: change, lastChangeAt: now } : {}),
      },
    },
  );
  return change;
}

// ---- runs ------------------------------------------------------------------

export interface HealthRunResult {
  targets: number;
  checked: number;
  remainingDue: number;
  changes: Partial<Record<HealthChange, number>>;
  stoppedEarly: boolean;
}

/** Check due rows, most-clicked first, until `deadline`. Safe to stop anywhere: unchecked rows stay due. */
export async function runHealthCheck({ deadline }: { deadline: number }): Promise<HealthRunResult> {
  const targets = await syncTargets();
  const clicked = await recentlyClicked();
  const now = new Date();
  const due = await LinkHealth.find({ $or: [{ dueAt: null }, { dueAt: { $lte: now } }] }).lean<LinkHealthProps[]>();
  due.sort((a, b) => {
    const ca = clicked.has(a.key) ? 0 : 1;
    const cb = clicked.has(b.key) ? 0 : 1;
    if (ca !== cb) return ca - cb;
    return (a.dueAt ? new Date(a.dueAt).getTime() : 0) - (b.dueAt ? new Date(b.dueAt).getTime() : 0);
  });

  const ctx = newContext(clicked, deadline);
  const changes: HealthRunResult["changes"] = {};
  let next = 0;
  let checked = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, due.length) }, async () => {
      while (next < due.length && Date.now() < deadline) {
        const row = due[next++];
        try {
          const change = await checkRow(row, ctx);
          checked++;
          if (change) changes[change] = (changes[change] ?? 0) + 1;
        } catch (err) {
          console.error("[link health] check failed", row.key, err);
        }
      }
    }),
  );

  return {
    targets,
    checked,
    remainingDue: due.length - checked,
    changes,
    stoppedEarly: checked < due.length,
  };
}

/** Re-check one target now (admin "Check now"), including its page. */
export async function checkKey(key: string): Promise<LinkHealthProps | null> {
  const row = await LinkHealth.findOne({ key }).lean<LinkHealthProps | null>();
  if (!row) return null;
  await checkRow(row, newContext(await recentlyClicked(), Date.now() + PAGE_TIMEOUT_MS + 5_000, true));
  return LinkHealth.findOne({ key }).lean<LinkHealthProps | null>();
}

/**
 * A campaign was paused or went live: re-check the targets that route through
 * it right away (within `deadline`), and mark any it couldn't reach as due so
 * the next run takes them first. On "live", targets that weren't earning are
 * also made due — one of them may now convert.
 */
export async function recheckForCampaign(
  campaignId: number,
  event: "paused" | "live",
  deadline: number,
): Promise<number> {
  const filter =
    event === "paused"
      ? { "current.campaignId": campaignId }
      : { $or: [{ "current.campaignId": campaignId }, { "current.affiliated": false }] };
  await LinkHealth.updateMany(filter, { $set: { dueAt: null } });

  const rows = await LinkHealth.find({ "current.campaignId": campaignId }).lean<LinkHealthProps[]>();
  const ctx = newContext(new Set(), deadline);
  let done = 0;
  for (const row of rows) {
    if (Date.now() >= deadline) break;
    try {
      await checkRow(row, ctx);
      done++;
    } catch (err) {
      console.error("[link health] campaign recheck failed", row.key, err);
    }
  }
  return done;
}
