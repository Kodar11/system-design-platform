import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
// Note: we intentionally DO NOT import Prisma-backed helpers here because
// middleware runs in the Edge runtime and importing Prisma will cause
// bundling of Node-only APIs. Instead, middleware will call an internal
// server API route to perform DB work.

// Optimized rate limiting with LRU cache (auto-cleanup old entries)
class RateLimiter {
  private cache = new Map<string, { count: number; lastReset: number }>();
  private readonly maxSize = 10000; // Prevent memory leaks
  private readonly duration = 60 * 1000; // 1 minute
  private readonly maxRequests = 100; // Reasonable limit

  check(ip: string): boolean {
    const now = Date.now();
    
    // Auto-cleanup old entries (every 100 checks)
    if (this.cache.size > this.maxSize) {
      const oldestAllowed = now - this.duration;
      for (const [key, value] of this.cache.entries()) {
        if (value.lastReset < oldestAllowed) {
          this.cache.delete(key);
        }
      }
    }

    const ipData = this.cache.get(ip);

    if (!ipData || (now - ipData.lastReset > this.duration)) {
      this.cache.set(ip, { count: 1, lastReset: now });
      return true;
    }

    ipData.count++;
    this.cache.set(ip, ipData);

    return ipData.count <= this.maxRequests;
  }
}

const rateLimiter = new RateLimiter();

// Static paths for faster lookups
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/verify-email",
  "/api/auth",
  "/api/users",
  "/api/send-otp",
  "/api/verify-otp",
]);

const isPublicPath = (pathname: string): boolean => {
  // Exact match first (fastest)
  if (PUBLIC_PATHS.has(pathname)) return true;
  
  // Prefix match for API routes
  return pathname.startsWith("/api/auth");
};

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;

    // Skip rate limiting for static files (already handled by matcher)
    if (pathname.startsWith('/_next') || pathname === '/favicon.ico') {
      return NextResponse.next();
    }

    // Rate limiting (only for non-public paths)
    if (!isPublicPath(pathname)) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                 req.headers.get('x-real-ip') || 
                 'unknown';
      
      if (!rateLimiter.check(ip)) {
        return new NextResponse("Too Many Requests", { 
          status: 429, 
          headers: { 'Retry-After': '60' } 
        });
      }
    }

    // Admin access check (optimized with early return)
    if (pathname.startsWith("/admin") && req.nextauth.token?.role !== "ADMIN") {
      return NextResponse.redirect(
        new URL("/api/auth/login?error=UnauthorizedAdminAccess", req.url)
      );
    }

    // If a user is signed-in, attempt a non-blocking reset of daily credits
    // This is fire-and-forget: we don't block the request on DB work.
  const token = req.nextauth?.token;
  // token typing from next-auth/middleware is loose; narrow to a lightweight runtime-safe shape
  const t = token as unknown as { uid?: string; sub?: string; id?: string; userId?: string; user?: { id?: string } } | undefined;
  // Support the UID field set in our next-auth JWT callback (token.uid)
  const userId = t?.uid ?? t?.sub ?? t?.id ?? t?.userId ?? t?.user?.id;
    if (userId) {
      // Fire-and-forget to an internal server route which runs in Node runtime.
      // We purposely avoid importing DB code in this file to remain Edge-compatible.
      const resetUrl = new URL('/api/credits/reset', req.nextUrl.origin);
      resetUrl.searchParams.set('userId', String(userId));
      fetch(resetUrl.toString(), { method: 'GET', credentials: 'omit' }).catch((err: unknown) => {
        // Log and continue — middleware should not fail the request for reset errors
        // tslint:disable-next-line:no-console
        console.error('Failed to call internal credit reset endpoint from middleware:', err);
      });
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Use optimized public path check
        if (isPublicPath(req.nextUrl.pathname)) {
          return true;
        }

        return !!token;
      },
    },
    pages: {
      // Use the app route for the sign-in page (avoid redirecting to NextAuth API)
      signIn: "/login",
    },
  }
);

export const config = {
  // Optimized matcher - exclude more static files
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|robots.txt|sitemap.xml|assets).*)',
  ],
};