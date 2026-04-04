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
  bankId: Types.ObjectId;
}

const fallback =
  "https://www.linkedin.com/company/gofisense/?viewAsMember=true";

export function pickBest(links: LinkProps[]): string | null {
  if (!links.length) return fallback;

  return (
    links.sort((a, b) => {
      const typeDiff = TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type];
      if (typeDiff !== 0) return typeDiff;

      return a.priority - b.priority;
    })[0]?.url ?? fallback
  );
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

export async function resolveLink(input: ResolveInput): Promise<string | null> {
  const { cardId, bankId } = input;

  // const cacheKey = buildCacheKey(
  //   cardId?.toString(),
  //   bankId?.toString(),
  //   context.geo,
  //   context.device,
  // );

  // 1. Cache
  // const cached = await redis.get(cacheKey);
  // if (cached) {
  //   return JSON.parse(cached) as LinkProps;
  // }

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

  // 1️⃣ Card-level
  let links;
  console.log(cardId, "card link test 2");
  if (!cardId) return fallback;

  links = await Link.find({
    ...baseQuery,
    cardId,
  }).lean<LinkProps[]>();
  console.log(links, "card link test 4");
  if (links.length) {
    const best = pickBest(links);
    if (best) return best;
    // if (best) return cacheAndReturn(cacheKey, best);
  }

  // 2️⃣ Bank-level
  console.log(bankId, "card link test 5");
  if (bankId) {
    links = await Link.find({
      ...baseQuery,
      bankId: bankId,
      cardId: { $exists: false },
    }).lean<LinkProps[]>();
    console.log(links, "card link test 6");
    if (links.length) {
      const best = pickBest(links);
      if (best) return best;
      // if (best) return cacheAndReturn(cacheKey, best);
    }
  }

  links = await Link.find({
    ...baseQuery,
    cardId: { $exists: false },
    bankId: { $exists: false },
  }).lean<LinkProps[]>();

  console.log(links, "card link test 7");
  const best = pickBest(links);
  console.log(best, "card link test 8");
  // if (best) return cacheAndReturn(cacheKey, best);
  if (best) return best;

  return fallback;
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
