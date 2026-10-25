import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import OutboundClick from "@/models/OutboundClick";
import { channelFor, resolveOutbound } from "@/lib/cuelinks/destinations";
import type { Resolution } from "@/lib/cuelinks/resolve";
import type { SubIds } from "@/lib/cuelinks/client";
import type { OutSurface, OutType } from "@/lib/cuelinks/outUrl";
import {
  ATTRIBUTION_COOKIE,
  parseAttribution,
  readCookie,
} from "@/lib/analytics/attribution";
import { clientIp, sendMetaEvent } from "@/lib/analytics/metaCapi";

/**
 * GET /api/out?type=card|portal|voucher|offer&id=<slug|offerId>&surface=<surface>[&card=<slug>]
 *
 * Every outbound click goes through here: resolve the destination server-side,
 * monetise it through Cuelinks where possible, log the click, 302 the user on.
 *
 * Takes ids only, never a URL, so it can't be used as an open redirect. It
 * never dead-ends: anything unresolvable lands back inside the app.
 */

const TYPES: OutType[] = ["card", "portal", "voucher", "offer"];
const SURFACES: OutSurface[] = ["advisor", "card-info", "home", "optimizer", "deals"];
// Ids are only ever DB lookup values, never URLs, so they don't need a strict
// charset — and real card slugs contain "/", "&", "+" and "–"
// ("hpcl-coral-visa/mastercard-…"). Rejecting those sent 27 cards' Apply
// buttons to the home page. Any non-blank id within a sane length is fine.
const SLUG_RE = /^\S{1,200}$/u;

// Where an unresolvable click lands: the page the user came from.
const INTERNAL_FALLBACK: Record<OutType, string> = {
  card: "/apply-card",
  portal: "/spend-optimizer",
  voucher: "/spend-optimizer",
  offer: "/deals",
};

function internal(type: OutType, req: NextRequest): Resolution {
  const url = new URL(INTERNAL_FALLBACK[type], req.url).toString();
  return {
    step: "internal",
    destination: url,
    redirectUrl: url,
    affiliated: false,
    campaignId: null,
  };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") as OutType | null;
  const id = sp.get("id") ?? "";
  const surface = sp.get("surface") as OutSurface | null;
  const cardParam = sp.get("card");

  if (!type || !TYPES.includes(type) || !SLUG_RE.test(id)) {
    return NextResponse.redirect(new URL("/", req.url), 302);
  }
  const safeSurface = surface && SURFACES.includes(surface) ? surface : "unknown";
  const cardSlug =
    type === "card" ? id : cardParam && SLUG_RE.test(cardParam) ? cardParam : undefined;

  const session = await getServerSession(authOptions);
  const userId = session?.user?._id ?? "anon";
  const userAgent = req.headers.get("user-agent");
  const device = /Mobi|Android|iPhone|iPad/i.test(userAgent ?? "") ? "mobile" : "desktop";
  const cookie = req.headers.get("cookie");
  const attribution = parseAttribution(readCookie(cookie, ATTRIBUTION_COOKIE));

  const subids: SubIds = {
    subid: userId,
    subid2: safeSurface,
    ...(type !== "card" ? { subid3: id } : {}),
    ...(cardSlug ? { subid4: cardSlug } : {}),
    subid5: device,
  };
  const channelId = channelFor(type);

  let resolution: Resolution | null = null;
  try {
    await dbConnect();
    resolution = await resolveOutbound(type, id, channelId, subids);
  } catch (err) {
    console.error("[api/out] resolution failed", { type, id, err });
  }
  const final = resolution ?? internal(type, req);

  const clickId = new Types.ObjectId();

  // Logged after the response so the redirect never waits on the write.
  after(async () => {
    try {
      await OutboundClick.create({
        _id: clickId,
        userId,
        type,
        targetId: id,
        surface: safeSurface,
        cardSlug,
        merchantSlug:
          type === "card" ? null : type === "offer" ? (final.merchant ?? null) : id,
        channelId,
        step: final.step,
        destination: final.destination,
        redirectUrl: final.redirectUrl,
        affiliated: final.affiliated,
        campaignId: final.campaignId,
        device,
        ...(attribution ? { attribution } : {}),
      });
    } catch (err) {
      console.error("[api/out] click log failed", err);
    }

    // Tell Meta about clicks that actually left for a card/merchant. A card
    // apply is the standard `Lead` (optimisable as an ad goal); shopping clicks
    // are a custom event. Server-only — the page is gone by now — so the click
    // id alone is the event id.
    if (final.step !== "internal") {
      await sendMetaEvent({
        eventName: type === "card" ? "Lead" : "AffiliateClick",
        eventId: `click_${clickId.toString()}`,
        eventSourceUrl: req.headers.get("referer"),
        userId,
        phoneNumber: session?.user?.phoneNumber,
        ip: clientIp(req.headers.get("x-forwarded-for")),
        userAgent,
        fbp: readCookie(cookie, "_fbp"),
        fbc: readCookie(cookie, "_fbc"),
        attribution,
        customData: {
          content_category: type,
          content_name: cardSlug ?? id,
          surface: safeSurface,
          affiliated: final.affiliated,
        },
      });
    }
  });

  return NextResponse.redirect(final.redirectUrl, 302);
}
