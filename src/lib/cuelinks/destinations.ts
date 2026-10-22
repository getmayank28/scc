import { Types } from "mongoose";
import Card from "@/models/Card";
import Bank from "@/models/Bank";
import Portal from "@/models/Portal";
import Giftor from "@/models/Giftor";
import LiveOffer from "@/models/LiveOffer";
import { resolveLinkCandidates } from "@/lib/utils/linkResolver";
import { resolveBankForCardSlug } from "@/lib/utils/resolveCardBank";
import {
  cachedConvert,
  linkNetwork,
  normalizeUrl,
  resolveCandidates,
  type Candidate,
  type Converter,
  type Resolution,
} from "./resolve";
import type { SubIds } from "./client";
import type { OutType } from "./outUrl";

// Card applications and shopping are tracked as separate Cuelinks channels so
// the Cuelinks dashboard can split earnings by product area without our code.
export function channelFor(type: OutType): number | undefined {
  const raw =
    type === "card"
      ? process.env.CUELINKS_CHANNEL_CARD_APPLY
      : process.env.CUELINKS_CHANNEL_OPTIMIZER;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * Per-type destination lookup for `/api/out`. Callers must have connected
 * (`dbConnect`). Returns null when the id is unknown or nothing usable is on
 * file; the route then sends the user back into the app.
 */

async function resolveCard(
  slug: string,
  channelId: number | undefined,
  subids: SubIds,
  convert: Converter,
): Promise<Resolution | null> {
  const card = await Card.findOne({ slug }, "_id bankId").lean<{
    _id: Types.ObjectId;
    bankId?: Types.ObjectId | null;
  } | null>();
  if (!card) return null;

  // `bankId` is the intended join; the slug fallback covers cards it's still
  // missing on (see resolveCardBank).
  const bankId =
    card.bankId ??
    ((await resolveBankForCardSlug(slug))?._id as Types.ObjectId | undefined) ??
    null;

  const links = await resolveLinkCandidates({ cardId: card._id, bankId });
  const fromLinks = await resolveCandidates(links, channelId, subids, convert);
  if (fromLinks && fromLinks.step !== "direct") return fromLinks;

  // Nothing on file earns. A raw card-level link still beats the bank's
  // homepage, but the homepage may itself be affiliated, so try it first.
  const bank = bankId
    ? await Bank.findById(bankId, "website").lean<{ website?: string | null } | null>()
    : null;
  const site = normalizeUrl(bank?.website);
  if (site) {
    const conv = await convert(site, channelId, subids);
    if (conv?.affiliated) {
      return {
        step: "bank_site",
        destination: site,
        redirectUrl: conv.trackingUrl,
        affiliated: true,
        campaignId: conv.campaignId,
      };
    }
  }
  if (fromLinks) return fromLinks;
  if (site) {
    return {
      step: "bank_site",
      destination: site,
      redirectUrl: site,
      affiliated: false,
      campaignId: null,
    };
  }
  return null;
}

async function resolvePortal(
  slug: string,
  channelId: number | undefined,
  subids: SubIds,
  convert: Converter,
): Promise<Resolution | null> {
  const portal = await Portal.findOne({ slug }, "websiteUrl affiliateLink").lean<{
    websiteUrl?: string;
    affiliateLink?: string | null;
  } | null>();
  if (!portal) return null;
  // Website first: converting it carries our sub IDs, which a pre-made
  // `affiliateLink` can't. Whatever sits in `affiliateLink` is by definition
  // somebody's affiliate link — Amazon Associates (amzn.to), Flipkart
  // (fktr.in), Myntra (myntr.it), vCommission… — so unless it's a Cuelinks
  // wrapper it is passed through as-is ("other"), never re-converted. Treated
  // as a plain URL it would lose to the raw website and stop earning.
  const affiliate = normalizeUrl(portal.affiliateLink);
  const candidates: Candidate[] = [{ url: portal.websiteUrl ?? "" }];
  if (affiliate) {
    const network = linkNetwork({ url: affiliate });
    candidates.push({ url: affiliate, network: network === "direct" ? "other" : network });
  }
  return resolveCandidates(candidates, channelId, subids, convert);
}

async function resolveVoucher(
  slug: string,
  channelId: number | undefined,
  subids: SubIds,
  convert: Converter,
): Promise<Resolution | null> {
  const giftor = await Giftor.findOne({ slug }, "url").lean<{ url?: string } | null>();
  if (!giftor) return null;
  return resolveCandidates([{ url: giftor.url ?? "" }], channelId, subids, convert);
}

async function resolveOffer(
  id: string,
  channelId: number | undefined,
  subids: SubIds,
  convert: Converter,
): Promise<Resolution | null> {
  const offerId = Number(id);
  if (!Number.isInteger(offerId) || offerId <= 0) return null;
  const offer = await LiveOffer.findOne({ offerId }, "landingUrl portalSlugs").lean<{
    landingUrl: string | null;
    portalSlugs: string[];
  } | null>();
  if (!offer) return null;

  // The deal's own page first (converted with our sub IDs), then the
  // merchant's portal: its affiliate link passes through as-is, and its
  // website is the last resort so an odd landing URL never strands the user.
  const portal = offer.portalSlugs[0]
    ? await Portal.findOne({ slug: offer.portalSlugs[0] }, "websiteUrl affiliateLink").lean<{
        websiteUrl?: string;
        affiliateLink?: string | null;
      } | null>()
    : null;
  const candidates: Candidate[] = [{ url: offer.landingUrl ?? "" }];
  const affiliate = normalizeUrl(portal?.affiliateLink);
  if (affiliate) {
    const network = linkNetwork({ url: affiliate });
    candidates.push({ url: affiliate, network: network === "direct" ? "other" : network });
  }
  candidates.push({ url: portal?.websiteUrl ?? "" });
  const r = await resolveCandidates(candidates, channelId, subids, convert);
  return r && { ...r, merchant: offer.portalSlugs[0] ?? null };
}

export function resolveOutbound(
  type: OutType,
  id: string,
  channelId: number | undefined,
  subids: SubIds,
  convert: Converter = cachedConvert,
): Promise<Resolution | null> {
  const fn = {
    card: resolveCard,
    portal: resolvePortal,
    voucher: resolveVoucher,
    offer: resolveOffer,
  }[type];
  return fn(id, channelId, subids, convert);
}
