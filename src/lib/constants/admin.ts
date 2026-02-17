const admins = process.env.ADMIN_EMAILS?.split(",") ?? [];

export function isAdmin(email?: string | null) {
  return email ? admins.includes(email) : false;
}
