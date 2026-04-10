import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifyAdminToken } from "@/lib/session";

export async function requireAdmin(): Promise<
  | { ok: true }
  | { ok: false; response: Response }
> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  return { ok: true };
}
