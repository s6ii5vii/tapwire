import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const appRoutes = [
  "/login",
  "/otp",
  "/consent",
  "/sync",
  "/dashboard",
  "/history",
  "/score",
  "/eligibility",
  "/applications",
  "/profile",
  "/institution/login",
  "/institution/dashboard",
  "/institution/applications",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (appRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.rewrite(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/otp",
    "/consent",
    "/sync",
    "/dashboard",
    "/history",
    "/score",
    "/eligibility",
    "/applications/:path*",
    "/profile",
    "/institution/:path*",
  ],
};
