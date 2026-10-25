/**
 * Map each active portal to its Cuelinks campaign (`portals.campaignId`), so
 * the daily offers refresh knows which campaigns to pull deals for.
 *
 * Matching is by domain: the portal's `websiteUrl` host against each Indian
 * campaign's `domain`. When several campaigns share a domain, the one named
 * like the portal wins ("Flipkart" over the open "Flipkart Seller Kids") even
 * if it still needs an access request, since its offers are the brand's own;
 * if none is named like the portal it's left unmapped. Rows that already have a campaignId are left
 * alone unless --remap is passed, so a hand-corrected mapping survives.
 *
 * Dry run by default. `--commit` writes; a prod database also needs
 * `--yes-prod`. Idempotent.
 *
 *   npx tsx --env-file=.env.local scripts/cuelinks-map-portals.ts
 *   npx tsx --env-file=.env.local scripts/cuelinks-map-portals.ts --commit --yes-prod
 */

import mongoose from "mongoose";
import { dbGuard, fetchIndiaCampaigns, type Campaign } from "./cuelinks-shared";

const ACCESS_RANK: Record<string, number> = { open: 0, approved: 1, pending: 2, not_applied: 3 };

const squash = (s: string | undefined) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const host = (u: string | undefined) => {
  try {
    return new URL(u ?? "").hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
};

async function main() {
  const commit = process.argv.includes("--commit");
  const remap = process.argv.includes("--remap");
  await mongoose.connect(process.env.MONGODB_URI!);
  const db = mongoose.connection.db!;
  dbGuard(db.databaseName, commit);

  const campaigns = await fetchIndiaCampaigns();
  const byDomain = new Map<string, Campaign[]>();
  for (const c of campaigns) {
    if (c.access_status === "blocked" || c.access_status === "rejected") continue;
    const d = (c.domain || host(c.url)).replace(/^www\./, "").toLowerCase();
    if (!d) continue;
    byDomain.set(d, [...(byDomain.get(d) ?? []), c]);
  }

  const portals = await db
    .collection("portals")
    .find({ status: "active" }, { projection: { slug: 1, name: 1, websiteUrl: 1, campaignId: 1 } })
    .toArray();

  const sets: { _id: unknown; slug: string; campaign: Campaign }[] = [];
  const ambiguous: string[] = [];
  let kept = 0;
  for (const p of portals) {
    const options = byDomain.get(host(p.websiteUrl)) ?? [];
    if (!options.length) continue;
    const named = options.length === 1
      ? options
      : options.filter((c) => {
          const n = squash(c.name);
          return n === squash(p.name) || n === squash(p.slug);
        });
    if (!named.length) {
      ambiguous.push(`${p.slug} (${options.map((c) => c.name).join(" / ")})`);
      continue;
    }
    const best = [...named].sort(
      (a, b) => (ACCESS_RANK[a.access_status] ?? 9) - (ACCESS_RANK[b.access_status] ?? 9),
    )[0];
    if (p.campaignId && !remap) {
      kept++;
      continue;
    }
    if (p.campaignId !== best.id) sets.push({ _id: p._id, slug: p.slug, campaign: best });
  }

  console.log(`\nActive portals: ${portals.length}; to map: ${sets.length}; already mapped (kept): ${kept}`);
  for (const s of sets) {
    console.log(
      `  ${s.slug.padEnd(32)} → ${String(s.campaign.id).padEnd(6)} ${s.campaign.name.padEnd(28)} ${s.campaign.access_status}`,
    );
  }
  if (ambiguous.length) {
    console.log(`\nLeft unmapped — several campaigns share the domain, none named like the portal:`);
    for (const a of ambiguous) console.log(`  ${a}`);
  }
  const open = sets.filter((s) => s.campaign.access_status === "open").length;
  console.log(`\n${open} of these are open (earn now); the rest need an access request first.`);

  if (!commit) {
    console.log("\nDry run — nothing written. Re-run with --commit to apply.");
  } else {
    for (const s of sets) {
      await db
        .collection("portals")
        .updateOne({ _id: s._id as mongoose.Types.ObjectId }, { $set: { campaignId: s.campaign.id } });
    }
    console.log(`\nCommitted: ${sets.length} portals mapped.`);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
