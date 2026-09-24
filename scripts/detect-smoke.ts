// Runs the card detector over every stored mailbox and prints the verdict table.
// Usage: npx tsx --env-file=.env.local scripts/detect-smoke.ts
import mongoose from "mongoose";
import StoredEmail from "../src/models/StoredEmail";
import { detectCards } from "../src/lib/carddetect/detect";
import { distinctive, tokenize, type CatalogCard } from "../src/lib/carddetect/resolve";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const rows = await StoredEmail.find({ issuer: { $ne: null } }).lean();
  const emails = (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.unipileId),
    issuer: (r.issuer as string) ?? null,
    subject: (r.subject as string) ?? "",
    bodyPlain: (r.bodyPlain as string) ?? "",
    fromEmail: (r.fromEmail as string) ?? "",
    date: (r.date as Date) ?? null,
    hasAttachments: Boolean(r.hasAttachments),
  }));

  // Load the catalog directly — the script cannot import the server-only loader.
  const raw = await mongoose.connection.db!
    .collection("cards")
    .find({ is_active: { $ne: false } })
    .project({ slug: 1, name: 1, bankName: 1 })
    .toArray();
  const catalog: CatalogCard[] = raw
    .filter((r) => r.slug && r.name)
    .map((r) => ({
      cardId: String(r._id),
      slug: r.slug as string,
      name: r.name as string,
      bankName: (r.bankName as string) ?? "",
      tokens: distinctive(tokenize(r.name as string)),
    }));
  console.log(`catalog=${catalog.length} active cards`);

  const out = detectCards(emails, catalog);
  console.log(`scanned=${out.emailsScanned} withCardLast4=${out.emailsWithCardContext} issuers=${out.issuersSeen.join(",")}`);
  console.log(`\n${"VERDICT".padEnd(9)} ${"ISSUER".padEnd(9)} ${"L4".padEnd(6)} ${"EXIST".padEnd(6)} ${"STRONGEST".padEnd(12)} ${"LIVE".padEnd(8)} ${"AGO".padEnd(5)} RESOLUTION`);
  for (const c of out.cards) {
    const cand = c.resolution.candidates.map((x) => x.slug).join(" | ") || "—";
    console.log(
      `${c.verdict.padEnd(9)} ${c.issuer.padEnd(9)} ${String(c.last4).padEnd(6)} ${String(c.existence.score).padEnd(6)} ${c.existence.strongest.padEnd(12)} ${c.liveness.status.padEnd(8)} ${String(c.liveness.daysAgo ?? "—").padEnd(5)} ${c.resolution.status}: ${cand}`,
    );
    console.log(`          phrase="${c.resolution.phrase ?? "—"}"  signals=[${c.existence.signals.join(",")}]`);
    console.log(`          why: ${c.reason}`);
  }
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
