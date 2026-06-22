import { clerkMiddleware, createRouteMatcher, clerkClient as getClerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);
const isAccountRoute = createRouteMatcher(["/account(.*)", "/api/account(.*)"]);

const isPublicRoute = createRouteMatcher([
  "/",
  "/store(.*)",
  "/track(.*)",
  "/mainwebsite(.*)",
  "/api/checkout(.*)",
  "/api/store(.*)",
  "/api/orders/track(.*)",
  "/api/promo/validate(.*)",
  "/api/webhooks(.*)",
  "/admin/sign-in(.*)",
  "/admin/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Public routes first — /admin/sign-in must not require auth (was causing redirect loop)
  if (isPublicRoute(req)) return NextResponse.next();

  if (isAdminRoute(req)) {
    const { userId } = await auth();

    if (!userId) {
      const signInUrl = new URL("/admin/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    const { sessionClaims } = await auth();
    let email = ((sessionClaims?.email as string) || "").toLowerCase();

    // Fallback: session token may not include email if Clerk Dashboard
    // session customization is not configured — fetch from Clerk API instead.
    if (!email) {
      try {
        const client = await getClerkClient();
        const user = await client.users.getUser(userId);
        email = (user.primaryEmailAddress?.emailAddress || "").toLowerCase();
      } catch {
        // If we can't verify the email, deny access.
      }
    }

    const allowedEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    let isAuthorized = allowedEmails.includes(email);
    let hasAdmins = allowedEmails.length > 0;

    // If not authorized by .env list, check the database via check-admin API
    if (!isAuthorized && email) {
      try {
        const checkUrl = new URL("/api/auth/check-admin", req.url);
        checkUrl.searchParams.set("email", email);

        const checkRes = await fetch(checkUrl.toString(), {
          headers: {
            "x-internal-secret": process.env.CLERK_SECRET_KEY || "",
          },
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          isAuthorized = !!checkData.isAdmin;
          if (checkData.hasAdmins) {
            hasAdmins = true;
          }
        }
      } catch (error) {
        console.error("Middleware admin DB check error:", error);
      }
    }

    if (!isAuthorized && hasAdmins) {
      return NextResponse.redirect(new URL("/admin/sign-in?error=unauthorized", req.url));
    }

    return NextResponse.next();
  }

  if (isAccountRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL("/store/towson", req.url);
      signInUrl.searchParams.set("account", "sign-in");
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
