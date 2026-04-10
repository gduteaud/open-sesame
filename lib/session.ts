import { SignJWT, jwtVerify } from "jose";
import { ADMIN_SESSION_COOKIE } from "@/lib/constants";

function getSecretKey() {
  const secret =
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "dev-only-open-sesame-secret-min-32-chars!!"
      : undefined);
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required in production");
  }
  return new TextEncoder().encode(secret);
}

export async function signAdminToken() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.sub === "admin";
  } catch {
    return false;
  }
}

export { ADMIN_SESSION_COOKIE };
