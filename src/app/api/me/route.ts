import { getAuthedUser, handleRouteError } from "@/lib/auth";
import { errorJson, json, noStore } from "@/lib/http";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/me
 *
 * Returns the authenticated user and their Profile.
 *
 * Headers:
 * - Authorization: Bearer <access_token> (required)
 *
 * Returns (JSON):
 * - { user: { id, email }, profile: { id, email, userIdNum, firstName, lastName, role, status, createdAt, updatedAt } }
 *
 * Status codes:
 * - 200 OK
 * - 401 Unauthorized (missing/invalid token)
 * - 403 Forbidden (PROFILE_REQUIRED if no Profile exists)
 */
export async function GET(req: Request) {
  try {
    const user = await getAuthedUser(req);
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        userIdNum: true,
        licenseNum: true,
        firstName: true,
        middleName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!profile) {
      return errorJson(403, "PROFILE_REQUIRED", "Profile not found. Please sign up.");
    }

    return noStore(
      json({
        user: { id: user.id, email: user.email },
        profile,
      }),
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
