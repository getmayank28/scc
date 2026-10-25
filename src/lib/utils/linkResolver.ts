import Link from "@/models/Link";
import { Types } from "mongoose";
import { LinkProps, LinkType, ResolveContext } from "@/types/link";

const TYPE_PRIORITY: Record<LinkType, number> = {
  affiliate: 1,
  bank: 2,
  fallback: 3,
};

interface ResolveInput {
  cardId: Types.ObjectId;
  bankId?: Types.ObjectId | null;
}

/** Best first: by `type` (affiliate → bank → fallback), then `priority`. */
export function rankLinks(links: LinkProps[]): LinkProps[] {
  return [...links].sort((a, b) => {
    const typeDiff = TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type];
    if (typeDiff !== 0) return typeDiff;

    return a.priority - b.priority;
  });
}

function buildCacheKey(
  cardId?: string,
  bankId?: string,
  geo?: string,
  device?: string,
) {
  const idPart = cardId
    ? `card:${cardId}`
    : bankId
      ? `bank:${bankId}`
      : "global";

  return `aff:${idPart}:${geo ?? "all"}:${device ?? "all"}`;
}

/**
 * Every live link that could serve this card, best first: card-level links,
 * then bank-level, then global. Returns them all rather than one winner because
 * `/api/out` walks the list — the top-ranked URL may not be affiliated today,
 * and a lower one (or a GroMo link) can still earn.
 *
 * Empty when nothing is on file; the caller owns the last resort (the bank's
 * website, then our own card page). This used to fall back to a LinkedIn URL.
 */
export async function resolveLinkCandidates(
  input: ResolveInput,
): Promise<LinkProps[]> {
  const { cardId, bankId } = input;
  const now = new Date();

  const baseQuery = {
    active: true,
    $and: [
      {
        $or: [{ startDate: { $exists: false } }, { startDate: { $lte: now } }],
      },
      {
        $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }],
      },
    ],
  };

  const [cardLinks, bankLinks, globalLinks] = await Promise.all([
    Link.find({ ...baseQuery, cardId }).lean<LinkProps[]>(),
    bankId
      ? Link.find({
          ...baseQuery,
          bankId,
          cardId: { $exists: false },
        }).lean<LinkProps[]>()
      : Promise.resolve([] as LinkProps[]),
    Link.find({
      ...baseQuery,
      cardId: { $exists: false },
      bankId: { $exists: false },
    }).lean<LinkProps[]>(),
  ]);

  return [
    ...rankLinks(cardLinks),
    ...rankLinks(bankLinks),
    ...rankLinks(globalLinks),
  ];
}

// 🔍 Context filter (typed)
function filterByContext(
  links: LinkProps[],
  context: ResolveContext,
): LinkProps[] {
  return links.filter((link) => {
    if (link.geo?.length && context.geo && !link.geo.includes(context.geo))
      return false;

    if (
      link.device?.length &&
      context.device &&
      !link.device.includes(context.device)
    )
      return false;

    return true;
  });
}

// ⚡ Cache helper
async function cacheAndReturn(
  key: string,
  value: LinkProps,
): Promise<LinkProps> {
  // await redis.set(key, JSON.stringify(value), "EX", 600);
  return value;
}

export async function invalidateCardCache(cardId: string) {
  // const pattern = `aff:card:${cardId}:*`;
  // const keys = await redis.keys(pattern); // OK if low scale
  // if (keys.length) {
  //   await redis.del(keys);
  // }
}

export async function invalidateBankCache(bankId: string) {
  // const pattern = `aff:bank:${bankId}:*`;
  // const keys = await redis.keys(pattern);
  // if (keys.length) {
  //   await redis.del(keys);
  // }
}
