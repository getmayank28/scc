import type { CampaignRef, UnearnedReason } from "@/types/affiliateReport";

/**
 * Plain-language "what's wrong / what to do" for a link that doesn't earn,
 * shared by the report's "Clicks that didn't earn" table and link health.
 * Client-safe: no server imports.
 */

export interface ReasonText {
  /** What's wrong, in one line. */
  problem: string;
  /** What to do about it. */
  fix: string;
}

export function describeReason(
  reason: UnearnedReason | "page_not_found" | null,
  campaign: CampaignRef | null,
  host: string | null,
): ReasonText | null {
  const site = host ?? "this site";
  const name = campaign?.name ?? "this store";
  switch (reason) {
    case "needs_access":
      return campaign?.status === "pending"
        ? {
            problem: `We've applied for ${name} on Cuelinks — waiting for approval`,
            fix: "Nothing to do. Clicks start earning about an hour after Cuelinks approves it.",
          }
        : {
            problem: `We're not approved for ${name} on Cuelinks yet, so these clicks can't earn`,
            fix: `Apply for campaign #${campaign?.id} in the Cuelinks dashboard. Clicks start earning about an hour after approval.`,
          };
    case "not_linked":
      // Approved, and already pointing at the campaign's own site: the link
      // itself is right, Cuelinks just didn't turn it into an earning one.
      if (campaign?.landingHost && campaign.landingHost === host) {
        return {
          problem: `We're approved for ${name} and the link goes to its site, but Cuelinks didn't make it an earning link`,
          fix: "Often temporary, or the click came before approval. If it keeps showing up, check in Cuelinks that this campaign allows deep links and is enabled for our channel.",
        };
      }
      return {
        problem: `We're approved for ${name}, but this link goes to ${site}, which that campaign doesn't cover`,
        fix: campaign?.landingHost
          ? `Point this link at ${campaign.landingHost} (the campaign's own site) — or, if that's a different business, ignore this row.`
          : "Point this link at the campaign's own landing page.",
      };
    case "no_campaign":
      return {
        problem: `Cuelinks has no campaign for ${site}`,
        fix: "It can't earn through Cuelinks. Use another affiliate network for it, or leave it as is.",
      };
    case "no_destination":
      return {
        problem: "No link on file, so the user was sent back into the app",
        fix: "Add a link for this card or store.",
      };
    case "page_not_found":
      return {
        problem: "The page this link goes to no longer exists",
        fix: "Update the link to a working page.",
      };
    default:
      return null;
  }
}

/** One line, for CSV exports. */
export const reasonLine = (t: ReasonText | null) => (t ? `${t.problem}. ${t.fix}` : null);
