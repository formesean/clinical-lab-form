import { getAuthedUser, getProfile, handleRouteError, requireApproved } from "@/lib/auth";
import { errorJson, json, noStore, zodError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { FormType } from "@prisma/client";
import z from "zod";
import type { AcquireLockResponse } from "@/types/api/forms";
import crypto from "node:crypto";

const Params = z.object({
  id: z.string().min(1),
  formType: z.nativeEnum(FormType),
});

const Body = z.object({
  lockToken: z.string().min(10).optional(),
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

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return zodError(parsed.error);

    const patient = await prisma.patientSession.findUnique({
      where: { id: p.data.id },
      select: { id: true },
    });
    if (!patient) return errorJson(404, "NOT_FOUND", "Patient session not found");

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds() * 1000);
    const newToken = parsed.data.lockToken ?? crypto.randomUUID();

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.formEditLock.findUnique({
        where: {
          patientSessionId_formType: { patientSessionId: patient.id, formType: p.data.formType },
        },
        select: { lockedByUserId: true, expiresAt: true },
      });

      if (!existing) {
        const created = await tx.formEditLock.create({
          data: {
            patientSessionId: patient.id,
            formType: p.data.formType,
            lockedByUserId: me.id,
            lockToken: newToken,
            expiresAt,
          },
          select: { lockToken: true, expiresAt: true },
        });
        return { ok: true as const, ...created };
      }

      // If expired or held by same user, take/refresh it
      if (existing.expiresAt <= now || existing.lockedByUserId === me.id) {
        const updated = await tx.formEditLock.update({
          where: {
            patientSessionId_formType: { patientSessionId: patient.id, formType: p.data.formType },
          },
          data: { lockedByUserId: me.id, lockToken: newToken, expiresAt },
          select: { lockToken: true, expiresAt: true },
        });
        return { ok: true as const, ...updated };
      }

      return { ok: false as const, lockedByUserId: existing.lockedByUserId };
    });

    if (!result.ok) {
      return errorJson(409, "LOCK_CONFLICT", "Form is locked by another user", {
        lockedByUserId: result.lockedByUserId,
      });
    }

    const response: AcquireLockResponse = {
      ok: true,
      message: "Lock acquired successfully",
      lockToken: result.lockToken,
      expiresAt: result.expiresAt.toISOString(),
    };

    return noStore(json(response, { status: 200 }));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<unknown> }) {
  try {
    const user = await getAuthedUser(req);
    const me = requireApproved(await getProfile(user.id));

    const p = Params.safeParse(await ctx.params);
    if (!p.success) return zodError(p.error);

    const body = z
      .object({ lockToken: z.string().min(10) })
      .safeParse(await req.json().catch(() => null));
    if (!body.success) return zodError(body.error);

    const now = new Date();

    const lock = await prisma.formEditLock.findUnique({
      where: { patientSessionId_formType: { patientSessionId: p.data.id, formType: p.data.formType } },
      select: { lockedByUserId: true, lockToken: true, expiresAt: true },
    });

    const valid =
      !!lock && lock.lockedByUserId === me.id && lock.lockToken === body.data.lockToken && lock.expiresAt > now;

    if (!valid) return errorJson(409, "LOCK_INVALID", "Lock not held by caller");

    await prisma.formEditLock.delete({
      where: { patientSessionId_formType: { patientSessionId: p.data.id, formType: p.data.formType } },
    });

    return new Response(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err);
  }
}
