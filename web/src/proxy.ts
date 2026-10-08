import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromHeader } from "./lib/auth/guards";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard and /admin UI routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    const cookieHeader = request.headers.get("cookie");
    const session = getAdminSessionFromHeader(cookieHeader);

    if (!session || session.role !== "admin" || session.username !== "Cyberbee-pro") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /api/admin/* endpoints
  if (pathname.startsWith("/api/admin")) {
    const cookieHeader = request.headers.get("cookie");
    const session = getAdminSessionFromHeader(cookieHeader);

    if (!session || session.role !== "admin" || session.username !== "Cyberbee-pro") {
      return NextResponse.json(
        {
          title: "Unauthorized",
          status: 401,
          detail: "Admin session required to access administrative resources.",
        },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/api/admin/:path*"],
};
