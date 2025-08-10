import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const requestCounts = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_DURATION = 60 * 1000000;
const MAX_REQUESTS = 1000000;

export default withAuth(
  function middleware(req) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();

    let ipData = requestCounts.get(ip);

    if (!ipData || (now - ipData.lastReset > RATE_LIMIT_DURATION)) {
      ipData = { count: 1, lastReset: now };
      requestCounts.set(ip, ipData);
    } else {
      ipData.count++;
      requestCounts.set(ip, ipData);
    }

    if (ipData.count > MAX_REQUESTS) {
      console.warn(`Rate limit exceeded for IP: ${ip} on path: ${req.nextUrl.pathname}`);
      return new NextResponse("Too Many Requests", { status: 429, headers: { 'Retry-After': (RATE_LIMIT_DURATION / 1000).toString() } });
    }


    if (req.nextUrl.pathname.startsWith("/admin") && req.nextauth.token?.role !== "ADMIN") {
      console.log("Middleware: Redirecting non-admin from /admin to login.");
      return NextResponse.redirect(new URL("/api/auth/login?error=UnauthorizedAdminAccess", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const publicPaths = [
          "/",
          "/api/auth",
          "/signup",
          "/verify-email",
          "/api/users",
          "/api/send-otp",
          "/api/verify-otp",
        ];

        const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path));

        if (isPublicPath) {
          return true;
        }

        return !!token;
      },
    },
    pages: {
      signIn: "/api/auth/login",
    },
  }
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};