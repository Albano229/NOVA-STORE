import { Session } from "next-auth";

const VENDOR_ROLES = ["VENDOR", "OWNER", "ADMIN", "MODERATOR"];

export function canAccessVendor(session: Session | null): boolean {
  if (!session?.user) return false;
  return VENDOR_ROLES.includes(session.user.role);
}
