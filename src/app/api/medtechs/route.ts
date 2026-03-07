import { getAuthedUser, getProfile, handleRouteError, requireApproved } from "@/lib/auth";
import { json, noStore } from "@/lib/http";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/medtechs
 *
 * Returns the list of medtechs for use in form dropdowns.
 * Available to all approved users.
 */
export async function GET(req: Request) {
  try {
    const user = await getAuthedUser(req);
    requireApproved(await getProfile(user.id));

    const medtechs = await prisma.medTech.findMany({
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, licenseNum: true },
    });

    return noStore(json({ medtechs }));
  } catch (err) {
    return handleRouteError(err);
  }
}
