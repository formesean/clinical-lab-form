import { getAuthedUser, getProfile, handleRouteError, requireAdmin, requireApproved } from "@/lib/auth";
import { errorJson, json, noStore } from "@/lib/http";
import type { AuthzCheckResponse } from "@/types/api/authz";

/**
 * GET /api/authz/check
 *
 * Internal authz helper for middleware. Verifies JWT via Supabase (getAuthedUser),
 * then checks Profile approval/role using Prisma.
 *
 * Query:
 * - adminOnly: "1" (optional) - if set, requires ADMIN  APPROVED
 *
 * Headers:
 * - Authorization: Bearer <access_token> (required)
 *
 * Returns (JSON):
 * - { ok: true, user: { id, email }, profile: { id, role, status } }
 *
 * Status codes:
 * - 200 OK
 * - 401 Unauthorized (missing/invalid token)
 * - 403 Forbidden (not approved / not admin)
 */
export async function GET(req: Request) {
  try {
    const user = await getAuthedUser(req);
    const profile = await getProfile(user.id);
    if (!profile) return errorJson(403, "PROFILE_REQUIRED", "Profile not found");

    const url = new URL(req.url);
    const adminOnly = url.searchParams.get("adminOnly") === "1";

    requireApproved(profile);
    if (adminOnly) requireAdmin(profile);

    const response: AuthzCheckResponse = {
      ok: true,
      user: { id: user.id, email: user.email ?? null },
      profile: { id: profile.id, role: profile.role, status: profile.status },
    };

    return noStore(json(response));
  } catch (err) {
    return handleRouteError(err);
  }
}
