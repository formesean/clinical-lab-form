import { ensureProfileForUser, getAuthedUser, handleRouteError } from "@/lib/auth";
import { json, noStore } from "@/lib/http";

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
    const profile = await ensureProfileForUser(user);

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
