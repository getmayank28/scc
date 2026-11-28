import { Types } from "mongoose";
import OutboundClick from "@/models/OutboundClick";
import User from "@/models/User";
import {
  EMPLOYMENT_TYPES,
  RETIRED_INCOME_RANGES,
  SALARIED_INCOME_RANGES,
  SELF_EMPLOYED_INCOME_RANGES,
} from "@/schemas/userInfoSchema";
import type { CampaignRange, FestiveUserRow } from "@/types/rewards";
import { CAMPAIGN_SURFACE } from "./festive";
import { sinceFor } from "./report";

/**
 * Users who came through /credit-card-offers/festive: anyone who clicked Apply
 * there (sign-in on that page goes straight to Apply, so this covers festive
 * sign-ups too), plus anyone whose signup attribution landed on the page.
 * Visitors who signed in elsewhere and only browsed the page leave no DB trace.
 */

const FESTIVE_PATH = /^\/credit-card-offers\/festive/;

const EMPLOYMENT_LABEL = new Map(EMPLOYMENT_TYPES.map((o) => [o.value as string, o.label]));
const SALARY_LABEL = new Map(
  [...SALARIED_INCOME_RANGES, ...SELF_EMPLOYED_INCOME_RANGES, ...RETIRED_INCOME_RANGES].map((o) => [
    o.value as string,
    o.label,
  ]),
);

type UserLite = {
  _id: Types.ObjectId;
  phoneNumber?: string;
  name?: string;
  employmentType?: string;
  salaryRange?: string;
  signupAttribution?: { landingPath?: string };
};

export async function festiveUsers(range: CampaignRange): Promise<FestiveUserRow[]> {
  const since = sinceFor(range);

  const [clicks, signups] = await Promise.all([
    OutboundClick.aggregate<{ _id: string; first: Date }>([
      { $match: { surface: CAMPAIGN_SURFACE, userId: { $ne: "anon" }, createdAt: { $gte: since } } },
      { $group: { _id: "$userId", first: { $min: "$createdAt" } } },
    ]),
    // Users have no createdAt; the ObjectId carries the signup time.
    User.find(
      { "signupAttribution.landingPath": FESTIVE_PATH, _id: { $gte: Types.ObjectId.createFromTime(since.getTime() / 1000) } },
      "_id",
    ).lean<{ _id: Types.ObjectId }[]>(),
  ]);

  const firstSeen = new Map<string, Date>();
  for (const c of clicks) if (Types.ObjectId.isValid(c._id)) firstSeen.set(c._id, c.first);
  for (const u of signups) {
    const id = u._id.toString();
    const at = u._id.getTimestamp();
    const prev = firstSeen.get(id);
    if (!prev || at < prev) firstSeen.set(id, at);
  }

  const users = await User.find(
    { _id: { $in: [...firstSeen.keys()] } },
    "phoneNumber name employmentType salaryRange",
  ).lean<UserLite[]>();

  return users
    .map((u) => {
      const id = u._id.toString();
      return {
        id,
        phone: u.phoneNumber ?? null,
        name: u.name?.trim() || null,
        employmentType: u.employmentType ? (EMPLOYMENT_LABEL.get(u.employmentType) ?? u.employmentType) : null,
        salaryRange: u.salaryRange ? (SALARY_LABEL.get(u.salaryRange) ?? u.salaryRange) : null,
        firstSeenAt: firstSeen.get(id)!.toISOString(),
      };
    })
    .sort((a, b) => b.firstSeenAt.localeCompare(a.firstSeenAt));
}
