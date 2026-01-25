import { getAuthedUser, getProfile, handleRouteError, requireAdmin, requireApproved } from "@/lib/auth";
import { AccountStatus } from "@/lib/generated/prisma";
import { errorJson, json, noStore, zodError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import z from "zod";

const Params = z.object({ id: z.string().min(1) });

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
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }).catch(() => null);

    if (!updated) return errorJson(404, "NOT_FOUND", "User profile not found");

    return noStore(json({ user: updated }));
  } catch (err) {
    return handleRouteError(err);
  }
}
