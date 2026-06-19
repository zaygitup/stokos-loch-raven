import "server-only";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export type AdminAuthResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; response: NextResponse };

function getAllowedAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Defense-in-depth admin guard for `/api/admin/*` route handlers.
 *
 * The Clerk middleware in `proxy.ts` already protects admin routes, but route
 * handlers must not rely on it alone — a middleware matcher regression would
 * otherwise silently expose every admin endpoint. Call this at the top of each
 * admin handler:
 *
 *   const guard = await requireAdmin();
 *   if (!guard.ok) return guard.response;
 *
 * Behaviour mirrors `proxy.ts`: requires an authenticated Clerk user, and — when
 * ADMIN_EMAILS is configured — requires the user's primary email to be on the
 * allowlist. An empty ADMIN_EMAILS is permissive (any signed-in user), matching
 * the existing middleware; configuring ADMIN_EMAILS in every environment is
 * strongly recommended.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const allowedEmails = getAllowedAdminEmails();

  if (allowedEmails.length === 0) {
    return { ok: true, userId, email: "" };
  }

  let email = ((sessionClaims?.email as string) || "").toLowerCase();

  // Session token may omit email if Clerk session customization is not
  // configured — fall back to the Clerk API.
  if (!email) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      email = (user.primaryEmailAddress?.emailAddress || "").toLowerCase();
    } catch {
      // Unable to verify email — fall through to deny.
    }
  }

  if (!allowedEmails.includes(email)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, userId, email };
}
