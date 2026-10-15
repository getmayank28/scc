import { indianPhoneRegex } from "@/schemas/userInfoSchema";

// Admins are a handful of internal WhatsApp numbers from ADMIN_PHONES
// (comma-separated, 10 digits, no +91). Login is by phone, so the allowlist is too.
function parseAdminPhones(): Set<string> {
  const raw = process.env.ADMIN_PHONES ?? "";
  return new Set(
    raw
      .split(",")
      .map((p) => p.replace(/\D/g, "").slice(-10))
      .filter((p) => indianPhoneRegex.test(p)),
  );
}

export function adminPhonesConfigured(): boolean {
  return parseAdminPhones().size > 0;
}

export function isAdmin(phoneNumber?: string | null) {
  return phoneNumber ? parseAdminPhones().has(phoneNumber) : false;
}
