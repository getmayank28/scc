import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES } from "./lib/constants/routes";
export { default } from "next-auth/middleware";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const url = request.nextUrl;

  if (
    token &&
    (url.pathname.startsWith(ROUTES.SIGN_IN) ||
      url.pathname.startsWith(ROUTES.SIGN_UP) ||
      url.pathname.startsWith(ROUTES.VERIFY_EMAIL))
  ) {
    return NextResponse.redirect(new URL(ROUTES.CARD, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/sign-in", "/sign-up", "/", "/verify"],
};
