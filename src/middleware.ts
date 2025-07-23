// // src/middleware.ts (or middleware.ts in project root)
// import { withAuth } from "next-auth/middleware";
// import { NextResponse } from "next/server";

// export default withAuth(
//   // `middleware` is called if `authorized` is true
//   // This function will only run for authenticated users on paths matched by `config.matcher`
//   function middleware(req) {
//     // Log the path and token for debugging
//     console.log("Middleware - Path:", req.nextUrl.pathname);
//     console.log("Middleware - Token (if authorized):", req.nextauth.token);

//     // Rule: Admin pages access for ADMIN role only
//     // If the path starts with /admin AND the user's role is NOT ADMIN, redirect
//     if (req.nextUrl.pathname.startsWith("/admin") && req.nextauth.token?.role !== "ADMIN") {
//       console.log("Middleware: Redirecting non-admin from /admin to login.");
//       // Redirect to login with an error message indicating unauthorized access
//       return NextResponse.redirect(new URL("/api/auth/login", req.url));
//     }

//     // For all other paths that made it past the `authorized` callback (meaning the user is authenticated),
//     // and are not specifically handled for roles, allow access.
//     return NextResponse.next();
//   },
//   {
//     // The `authorized` callback runs BEFORE the `middleware` function.
//     // It determines if the user is authorized to proceed to the `middleware` function
//     // or if they should be redirected to the `pages.signIn` route.
//     callbacks: {
//       authorized: ({ req, token }) => {
//         // Rule: Home page ("/") is accessible to everyone (authenticated or not).
//         if (req.nextUrl.pathname === "/") {
//           return true; // Allow access to the home page
//         }

//         // Rule: For all other paths, require authentication.
//         // If `token` exists, the user is authenticated.
//         // If `token` is null, NextAuth.js will redirect to `pages.signIn`.
//         return !!token;
//       },
//     },
//     // Define the custom sign-in page URL.
//     // If `authorized` returns `false`, the user is redirected here.
//     pages: {
//       signIn: "/api/auth/login",
//     },
//   }
// );

// // The `matcher` array specifies which paths the middleware should run on.
// // This regex matches all paths EXCEPT:
// // - `/api/auth` and any sub-paths (NextAuth.js internal API routes)
// // - `/signup` (your signup page)
// // - `/verify-email` (your OTP verification page)
// // - `/api/users` (the user creation/signup API route) - ADDED THIS LINE
// // - `_next/static`, `_next/image`, `favicon.ico` (Next.js internal assets)
// // The home page `/` is included in the matcher, but its public access is handled by the `authorized` callback.
// export const config = {
//   matcher: ['/((?!api/auth|signup|verify-email|api/users|api/send-otp|api/verify-otp|_next/static|_next/image|favicon.ico).*)'],
// };

// src/middleware.ts (or middleware.ts in project root)
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// --- Rate Limiting Configuration (IN-MEMORY - NOT FOR PRODUCTION) ---
// This map stores request counts per IP. It will reset when the server restarts.
// For production, use a distributed store like Redis (e.g., Upstash Redis).
const requestCounts = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_DURATION = 60 * 1000; // 60 seconds
const MAX_REQUESTS = 10; // Max 10 requests per IP in 60 seconds
// --- End Rate Limiting Configuration ---

export default withAuth(
  // `middleware` is called if `authorized` is true (or if the path is public)
  // This function will run for all paths matched by `config.matcher`
  function middleware(req) {
    // --- Rate Limiting Logic (Applies to ALL paths matched by config.matcher) ---
    // Get the IP address. In production, consider 'x-forwarded-for' header if behind a proxy like Vercel.
    const ip =  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();

    let ipData = requestCounts.get(ip);

    // If no data for IP or the rate limit duration has passed, reset count
    if (!ipData || (now - ipData.lastReset > RATE_LIMIT_DURATION)) {
      ipData = { count: 1, lastReset: now };
      requestCounts.set(ip, ipData);
    } else {
      ipData.count++;
      requestCounts.set(ip, ipData); // Update the map with incremented count
    }

    // Check if rate limit exceeded
    if (ipData.count > MAX_REQUESTS) {
      console.warn(`Rate limit exceeded for IP: ${ip} on path: ${req.nextUrl.pathname}`);
      // Immediately return a 429 response if rate limit is exceeded
      return new NextResponse("Too Many Requests", { status: 429, headers: { 'Retry-After': (RATE_LIMIT_DURATION / 1000).toString() } });
    }
    // --- End Rate Limiting Logic ---

    // --- Authorization Logic (Runs AFTER Rate Limiting) ---
    // This part runs only if the request was NOT rate-limited.
    console.log("Middleware - Path:", req.nextUrl.pathname);
    console.log("Middleware - Token (if authorized):", req.nextauth.token);

    // Rule: Admin pages access for ADMIN role only
    // This check is performed for authenticated users who passed the `authorized` callback.
    if (req.nextUrl.pathname.startsWith("/admin") && req.nextauth.token?.role !== "ADMIN") {
      console.log("Middleware: Redirecting non-admin from /admin to login.");
      // Redirect to login with an error message indicating unauthorized access
      return NextResponse.redirect(new URL("/api/auth/login?error=UnauthorizedAdminAccess", req.url));
    }

    // Allow the request to proceed if not rate-limited and not blocked by specific role checks
    return NextResponse.next();
  },
  {
    // The `authorized` callback runs BEFORE the `middleware` function (but AFTER the initial request intercept).
    // It determines if the user is authorized to proceed to the `middleware` function
    // or if they should be redirected to the `pages.signIn` route.
    callbacks: {
      authorized: ({ req, token }) => {
        // Define paths that are always public (no authentication required)
        const publicPaths = [
          "/", // Home page
          "/api/auth", // NextAuth.js internal API routes (e.g., /api/auth/signin, /api/auth/callback)
          "/signup", // Signup page
          "/verify-email", // OTP verification page
          "/api/users", // User creation/signup API route
          "/api/send-otp", // API route for sending OTP
          "/api/verify-otp", // API route for verifying OTP
        ];

        // Check if the current path starts with any of the public paths
        const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path));

        if (isPublicPath) {
          return true; // Allow access to public paths without authentication
        }

        // For all other paths not explicitly public, require authentication.
        // If `token` exists, the user is authenticated.
        // If `token` is null, NextAuth.js will redirect to `pages.signIn`.
        return !!token;
      },
    },
    // Define the custom sign-in page URL.
    // If `authorized` returns `false`, the user is redirected here.
    pages: {
      signIn: "/api/auth/login",
    },
  }
);

// The `matcher` array specifies which paths the middleware should run on.
// This regex matches all paths EXCEPT:
// - `_next/static` (Next.js static assets)
// - `_next/image` (Next.js image optimization)
// - `favicon.ico` (favicon file)
// This ensures the middleware runs for all your application-level routes.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
