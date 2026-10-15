// What the app still wants from a user. Login only collects a WhatsApp number,
// so everything else is optional and gathered later: employment + income by
// the AI Advisor gate, the rest on the profile page.

type ProfileFields = {
  name?: string | null;
  email?: string | null;
  employmentType?: string | null;
  salaryRange?: string | null;
};

export type MissingProfileField = "name" | "email" | "advisorProfile";

// Employment type and income are what the advisor's eligibility filter needs.
// Students have no income bracket, so employment type alone is enough for them.
export function hasAdvisorProfile(user: ProfileFields): boolean {
  if (!user.employmentType) return false;
  if (user.employmentType === "student_unemployed") return true;
  return !!user.salaryRange;
}

export function missingProfileFields(user: ProfileFields): MissingProfileField[] {
  const missing: MissingProfileField[] = [];
  if (!user.name?.trim()) missing.push("name");
  if (!user.email?.trim()) missing.push("email");
  if (!hasAdvisorProfile(user)) missing.push("advisorProfile");
  return missing;
}
