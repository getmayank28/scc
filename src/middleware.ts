import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PUBLIC_ROUTES, ROUTES } from "./lib/constants/routes";

// Signed in means having a session — login is a verified WhatsApp number, so
// there is no separate verification or onboarding step to gate on. Profile
// details are asked for where they're needed (the AI Advisor) instead.
export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXT_AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });
  const url = request.nextUrl;

  if (url.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Public sale landing pages — viewable without signing in.
  if (url.pathname.startsWith("/sale")) {
    return NextResponse.next();
  }

  if (token && url.pathname.startsWith(ROUTES.SIGN_IN)) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  if (token && url.pathname === ROUTES.HOME) {
    return NextResponse.redirect(new URL(ROUTES.LOGGED_IN_HOME, request.url));
  }

  if (!token && !PUBLIC_ROUTES.includes(url.pathname)) {
    const signIn = new URL(ROUTES.SIGN_IN, request.url);
    signIn.searchParams.set("callbackUrl", url.pathname);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/sign-in",
    "/",
    "/chat",
    "/home",
    "/profile",
    "/choose-card",
    "/spend-optimizer",
    "/insights",
    "/apply-card",
  ],
};
