import { getAuthedUser, getProfile, handleRouteError, requireAdmin, requireApproved } from "@/lib/auth";
import { AccountStatus } from "@prisma/client";
import { json, noStore } from "@/lib/http";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/pending
 *
 * Admin-only. Lists pending Profile rows (status=PENDING).
 *
 * Headers:
 * - Authorization: Bearer <access_token> (required)
 *
 * Returns (JSON):
 * - { users: Array<{ id, email, userIdNum, licenseNum, firstName, middleName, lastName, role, status, createdAt, updatedAt }> }
 *
 * Status codes:
 * - 200 OK
 * - 401 Unauthorized (missing/invalid token)
 * - 403 Forbidden (not approved / not admin)
 */
export async function GET(req: Request) {
  try {
    const user = await getAuthedUser(req);
    const me = requireApproved(await getProfile(user.id));
    requireAdmin(me);

    const users = await prisma.profile.findMany({
      where: { status: AccountStatus.PENDING },
      orderBy: { createdAt: "asc" },
      take: 20,
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

    return noStore(json({ users }));
  } catch (err) {
    return handleRouteError(err);
  }
}
