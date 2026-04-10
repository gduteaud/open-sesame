import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_SESSION_COOKIE } from "@/lib/constants";

function getSecretKey() {
  const secret =
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "dev-only-open-sesame-secret-min-32-chars!!"
      : undefined);
  if (!secret) {
    return null;
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout"
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const key = getSecretKey();
    if (!key) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    try {
      const { payload } = await jwtVerify(token, key);
      if (payload.sub !== "admin") {
        throw new Error("invalid subject");
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname.startsWith("/api/admin") && pathname !== "/api/admin/login") {
    const key = getSecretKey();
    if (!key) {
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 },
      );
    }
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { payload } = await jwtVerify(token, key);
      if (payload.sub !== "admin") {
        throw new Error("invalid subject");
      }
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
