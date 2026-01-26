import { getAuthedUser, getProfile, handleRouteError, requireApproved } from "@/lib/auth";
import { errorJson, json, noStore, zodError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { FormType } from "@prisma/client";
import z from "zod";
import type { RenewLockResponse } from "@/types/api/forms";

const Params = z.object({
  id: z.string().min(1),
  formType: z.nativeEnum(FormType),
});

const Body = z.object({
  lockToken: z.string().min(10),
});

function ttlSeconds() {
  const v = Number(process.env.LOCK_TTL_SECONDS ?? "180");
  return Number.isFinite(v) && v >= 60 && v <= 600 ? v : 180;
}

export async function POST(req: Request, ctx: { params: Promise<unknown> }) {
  try {
    const user = await getAuthedUser(req);
    const me = requireApproved(await getProfile(user.id));

    const p = Params.safeParse(await ctx.params);
    if (!p.success) return zodError(p.error);

    const body = Body.safeParse(await req.json().catch(() => null));
    if (!body.success) return zodError(body.error);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds() * 1000);

    const lock = await prisma.formEditLock.findUnique({
      where: { patientSessionId_formType: { patientSessionId: p.data.id, formType: p.data.formType } },
      select: { lockedByUserId: true, lockToken: true, expiresAt: true },
    });

    const valid =
      !!lock && lock.lockedByUserId === me.id && lock.lockToken === body.data.lockToken && lock.expiresAt > now;

    if (!valid) return errorJson(409, "LOCK_INVALID", "Lock not held by caller");

    const updated = await prisma.formEditLock.update({
      where: { patientSessionId_formType: { patientSessionId: p.data.id, formType: p.data.formType } },
      data: { expiresAt },
      select: { lockToken: true, expiresAt: true },
    });

    const response: RenewLockResponse = {
      ok: true,
      message: "Lock renewed successfully",
      lockToken: updated.lockToken,
      expiresAt: updated.expiresAt.toISOString(),
    };

    return noStore(json(response, { status: 200 }));
  } catch (err) {
    return handleRouteError(err);
  }
}
