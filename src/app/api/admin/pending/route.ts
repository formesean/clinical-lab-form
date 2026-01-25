import { getAuthedUser, getProfile, handleRouteError, requireAdmin, requireApproved } from "@/lib/auth";
import { AccountStatus } from "@prisma/client";
import { json, noStore } from "@/lib/http";
import { prisma } from "@/lib/prisma";

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
        firstName: true,
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
