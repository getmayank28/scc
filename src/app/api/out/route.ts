import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import OutboundClick from "@/models/OutboundClick";
import { channelFor, resolveOutbound } from "@/lib/cuelinks/destinations";
import type { Resolution } from "@/lib/cuelinks/resolve";
import type { SubIds } from "@/lib/cuelinks/client";
import type { OutSurface, OutType } from "@/lib/cuelinks/outUrl";

/**
 * GET /api/out?type=card|portal|voucher&id=<slug>&surface=<surface>[&card=<slug>]
 *
 * Every outbound click goes through here: resolve the destination server-side,
 * monetise it through Cuelinks where possible, log the click, 302 the user on.
 *
 * Takes ids only, never a URL, so it can't be used as an open redirect. It
 * never dead-ends: anything unresolvable lands back inside the app.
 */

const TYPES: OutType[] = ["card", "portal", "voucher"];
const SURFACES: OutSurface[] = ["advisor", "card-info", "home", "optimizer"];
const SLUG_RE = /^[a-z0-9][a-z0-9._-]{0,159}$/i;

// Where an unresolvable click lands: the page the user came from.
const INTERNAL_FALLBACK: Record<OutType, string> = {
  card: "/apply-card",
  portal: "/spend-optimizer",
  voucher: "/spend-optimizer",
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
  const device = /Mobi|Android|iPhone|iPad/i.test(req.headers.get("user-agent") ?? "")
    ? "mobile"
    : "desktop";

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

  // Logged after the response so the redirect never waits on the write.
  after(async () => {
    try {
      await OutboundClick.create({
        userId,
        type,
        targetId: id,
        surface: safeSurface,
        cardSlug,
        channelId,
        step: final.step,
        destination: final.destination,
        redirectUrl: final.redirectUrl,
        affiliated: final.affiliated,
        campaignId: final.campaignId,
        device,
      });
    } catch (err) {
      console.error("[api/out] click log failed", err);
    }
  });

  return NextResponse.redirect(final.redirectUrl, 302);
}
