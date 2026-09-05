import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PUBLIC_ROUTES, ROUTES } from "./lib/constants/routes";
import { encodeBase64 } from "./lib/utils/encodeDecode";

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

  if (
    token &&
    (url.pathname.startsWith(ROUTES.SIGN_IN) ||
      url.pathname.startsWith(ROUTES.VERIFY_EMAIL))
  ) {
    if (token.isVerified) {
      return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
    } else {
      if (token?.picture) {
        return NextResponse.redirect(
          new URL(`${ROUTES.DASHBOARD}`, request.url),
        );
      } else {
        const email = encodeBase64(token?.email as string);
        const targetVerifyPath = `${ROUTES.VERIFY_EMAIL}/${email}`;
        if (url.pathname === targetVerifyPath) {
          return NextResponse.next();
        }
        return NextResponse.redirect(
          new URL(targetVerifyPath, request.url),
        );
      }
    }
  }
  if (token && url.pathname === ROUTES.HOME) {
    return NextResponse.redirect(new URL(ROUTES.LOGGED_IN_HOME, request.url));
  }

  if (
    (!token || !token?.isVerified) &&
    !PUBLIC_ROUTES?.includes(url.pathname)
  ) {
    return NextResponse.redirect(new URL(ROUTES.SIGN_IN, request.url));
  }

  // Gate all app routes behind user-info completion
  if (token && token.isVerified) {
    if (!token.hasCompletedUserInfo && url.pathname !== ROUTES.USER_INFO) {
      return NextResponse.redirect(new URL(ROUTES.USER_INFO, request.url));
    }
    if (token.hasCompletedUserInfo && url.pathname === ROUTES.USER_INFO) {
      return NextResponse.redirect(new URL(ROUTES.LOGGED_IN_HOME, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/sign-in",
    "/sign-up",
    "/",
    "/chat",
    "/home",
    "/profile",
    "/home",
    "/choose-card",
    "/spend-optimizer",
    "/insights",
    "/apply-card",
    "/user-info",
    "/verify/:path*",
  ],
};
