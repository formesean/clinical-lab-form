import { getAuthedUser, handleRouteError } from "@/lib/auth";
import { AccountStatus, Role } from "@prisma/client";
import { errorJson, json, noStore } from "@/lib/http";
import { prisma } from "@/lib/prisma";

function getAdminEmails(): Set<string> {
  const single = process.env.ADMIN_EMAIL?.trim();
  const manyRaw= process.env.ADMIN_EMAIL?.trim();
  const emails = [
    ...(manyRaw ? manyRaw.split(",") : []),
    ...(single ? [single] : []),
  ].map((e) => e.trim().toLowerCase()).filter(Boolean);

  return new Set(emails);
}

/**
 * POST /api/auth/ensure-profile
 *
 * Requires Authorization: Bearer <Supabase access_token>.
 * Ensures the authenticated user has a Profile row.
 * If the caller email is allowlisted, promotes to ADMIN + APPROVED.
 *
 * Headers:
 * - Authorization: Bearer <access_token> (required)
 *
 * Returns (JSON):
 * - { profile: { id, role, status, updatedAt } }
 *
 * Status codes:
 * - 200 OK
 * - 401 Unauthorized (missing/invalid token)
 * - 403 Forbidden (PROFILE_REQUIRED if no Profile exists)
 */
export async function POST(req: Request) {
  try {
    const user = await getAuthedUser(req);
    const adminEmails = getAdminEmails();
    const userEmail = user.email?.toLowerCase() ?? null;
    const isAdmin = !!userEmail && adminEmails.has(userEmail);

    const existing = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, status: true, updatedAt: true },
    });

    if (!existing) {
      return errorJson(403, "PROFILE_REQUIRED", "Profile not found. Please sign up.");
    }

    const profile = isAdmin
      ? await prisma.profile.update({
        where: { id: user.id },
        data: { role: Role.ADMIN, status: AccountStatus.APPROVED },
        select: { id: true, role: true, status: true, updatedAt: true },
        })
      : existing;

    return noStore(
      json({
        profile: {
          id: profile.id,
          role: profile.role,
          status: profile.status,
          updatedAt: profile.updatedAt,
        }
      }),
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
