import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge } from "@/lib/jwtEdge";
import { canAccessApiPath, canAccessDashboardPath } from "@/lib/rbacPolicy";

const PUBLIC_PATHS = new Set(["/login", "/api/auth/login", "/api/auth/logout"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("wcv_auth_session")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifyTokenEdge(token);
  if (!session) {
    const res = pathname.startsWith("/api/")
      ? NextResponse.json(
          { success: false, error: "Invalid or expired session" },
          { status: 401 }
        )
      : (() => {
          const loginUrl = req.nextUrl.clone();
          loginUrl.pathname = "/login";
          loginUrl.searchParams.set("next", pathname);
          return NextResponse.redirect(loginUrl);
        })();

    res.cookies.set("wcv_auth_session", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0
    });
    return res;
  }

  // Role gate — APIs
  if (pathname.startsWith("/api/")) {
    if (!canAccessApiPath(session.role, pathname, req.method)) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden — role ${session.role} cannot access ${req.method} ${pathname}`
        },
        { status: 403 }
      );
    }
  }

  // Role gate — dashboard pages
  if (pathname.startsWith("/dashboard") && !canAccessDashboardPath(session.role, pathname)) {
    const denied = req.nextUrl.clone();
    denied.pathname = "/dashboard/access-denied";
    denied.searchParams.set("from", pathname);
    return NextResponse.redirect(denied);
  }

  const headers = new Headers(req.headers);
  headers.set("x-user-id", session.userId);
  headers.set("x-user-role", session.role);
  headers.set("x-user-branch", session.branchCode);
  headers.set("x-user-name", session.name);

  return NextResponse.next({
    request: { headers }
  });
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"]
};
