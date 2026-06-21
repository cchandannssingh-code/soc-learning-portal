import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public routes (bypass password gate)
  if (
    path.startsWith("/quiz") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/login")
  ) {
    return NextResponse.next();
  }

  // Check auth cookie (we'll use a cookie for middleware check)
  const isAuthenticated = request.cookies.has("socforge_auth");

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
