import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge } from "@/lib/jwtEdge";

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
