import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("better-auth.session_token");
  const isAuthRoute = request.nextUrl.pathname.startsWith("/sign-");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  const isRootRoute = request.nextUrl.pathname === "/";

  if (!sessionCookie && !isAuthRoute && !isApiRoute && !isRootRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
