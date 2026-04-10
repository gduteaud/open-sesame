import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

/**
 * ADMIN_PASSWORD can be a bcrypt hash (starts with $2) or a plain string for local dev.
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const stored = process.env.ADMIN_PASSWORD;
  if (!stored) {
    return false;
  }
  if (stored.startsWith("$2")) {
    return bcrypt.compare(password, stored);
  }
  const a = Buffer.from(password, "utf8");
  const b = Buffer.from(stored, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
