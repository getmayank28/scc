import CardRuleModel from "@/models/CardRule";
import { ruleDocToEngineRule } from "@/lib/advisor/bulkRules";
import { validateSharedCapGroups } from "@/lib/logic/advisor/rules";

// Combined cap groups pool their members' caps, so a new/updated rule must
// agree with the card's other rules — recompute enforces this invariant and
// would throw AFTER the write, turning admin requests into opaque 500s with the
// rule already saved. Routes call this BEFORE writing; returns the conflict
// message, or null when the card validates.
export async function capGroupConflictFor(
  cardSlug: string,
  candidate: Record<string, unknown>,
  excludeRuleKey?: string,
): Promise<string | null> {
  const existing = await CardRuleModel.find({ cardSlug, is_active: true })
    .select(
      "ruleKey cardSlug category merchant reward caps shared_cap_group voucher_shared_cap_group is_active",
    )
    .lean<Record<string, unknown>[]>();
  const rules = existing
    .filter((d) => String(d.ruleKey) !== excludeRuleKey)
    .map(ruleDocToEngineRule);
  rules.push(ruleDocToEngineRule(candidate));
  try {
    validateSharedCapGroups(rules);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}
