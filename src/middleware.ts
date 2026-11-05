import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set([
  "/login",
  "/api/auth/login",
  "/api/auth/logout"
]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow public auth pages and static assets
  if (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // 2. Extract session token from cookie
  const token = req.cookies.get("wcv_auth_session")?.value;

  if (!token) {
    // If API route, return 401 Unauthorized
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    // Redirect unauthenticated web navigation to /login
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session token present
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/:path*"
  ]
};
