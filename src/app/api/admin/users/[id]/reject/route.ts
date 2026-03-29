import { getAuthedUser, getProfile, handleRouteError, requireAdmin, requireApproved } from "@/lib/auth";
import { AccountStatus } from "@prisma/client";
import { errorJson, json, noStore, zodError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import type { RejectUserResponse } from "@/types/api/admin";
import z from "zod";

const Params = z.object({ id: z.string().min(1) });

/**
 * POST /api/admin/users/:id/reject
 *
 * Admin-only. Sets Profile.status = REJECTED for the specified user id.
 *
 * Params:
 * - id: string (required) - Profile.id (Supabase user id)
 *
 * Headers:
 * - Authorization: Bearer <access_token> (required)
 *
 * Returns (JSON):
 * - { profile: { id, email, userIdNum, licenseNum, firstName, middleName, lastName, role, status, createdAt, updatedAt } }
 *
 * Status codes:
 * - 200 OK
 * - 401 Unauthorized (missing/invalid token)
 * - 403 Forbidden (not approved / not admin)
 * - 404 Not Found (profile not found)
 * - 422 Unprocessable Entity (validation error)
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const user = await getAuthedUser(req);
    const me = requireApproved(await getProfile(user.id));
    requireAdmin(me);

    const rawParams = await Promise.resolve(ctx.params);
    const p = Params.safeParse(rawParams);
    if (!p.success) return zodError(p.error);

    const updated = await prisma.profile.update({
      where: { id: p.data.id },
      data: { status: AccountStatus.REJECTED },
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
      },
    }).catch(() => null);

    if (!updated) return errorJson(404, "NOT_FOUND", "User profile not found");

    const profile = {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
    const response: RejectUserResponse = { profile };
    return noStore(json(response));
  } catch (err) {
    return handleRouteError(err);
  }
}
