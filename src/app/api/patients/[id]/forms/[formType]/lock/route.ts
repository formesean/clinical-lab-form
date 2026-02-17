import crypto from "node:crypto";
import { FormType } from "@prisma/client";
import z from "zod";
import {
  getAuthedUser,
  getProfile,
  handleRouteError,
  requireApproved,
} from "@/lib/auth";
import { errorJson, json, noStore, zodError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import type { AcquireLockResponse } from "@/types/api/forms";

const Params = z.object({
  id: z.string().min(1),
  formType: z.nativeEnum(FormType),
});

const Body = z.object({
  lockToken: z.string().min(10).optional(),
});

/**
 * POST /api/patients/:id/forms/:formType/lock
 *
 * Acquires or refreshes an edit lock for a form.
 *
 * Params:
 * - id: string (required) - PatientSession.id
 * - formType: FormType (required)
 *
 * Body (JSON):
 * - lockToken: string (optional) - reuse existing token when refreshing
 *
 * Returns (JSON):
 * - { ok: true, message: string, lockToken: string }
 *
 * Status codes:
 * - 200 OK
 * - 401 Unauthorized
 * - 403 Forbidden
 * - 404 Not Found
 * - 409 Conflict (lock held by another user)
 * - 422 Unprocessable Entity (validation error)
 */
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
    if (!patient)
      return errorJson(404, "NOT_FOUND", "Patient session not found");

    const newToken = parsed.data.lockToken ?? crypto.randomUUID();

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.formEditLock.findUnique({
        where: {
          patientSessionId_formType: {
            patientSessionId: patient.id,
            formType: p.data.formType,
          },
        },
        select: { lockedByUserId: true },
      });

      if (!existing) {
        const created = await tx.formEditLock.create({
          data: {
            patientSessionId: patient.id,
            formType: p.data.formType,
            lockedByUserId: me.id,
            lockToken: newToken,
          },
          select: { lockToken: true },
        });
        return { ok: true as const, ...created };
      }

      if (existing.lockedByUserId === me.id) {
        const updated = await tx.formEditLock.update({
          where: {
            patientSessionId_formType: {
              patientSessionId: patient.id,
              formType: p.data.formType,
            },
          },
          data: { lockedByUserId: me.id, lockToken: newToken },
          select: { lockToken: true },
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
    };

    return noStore(json(response, { status: 200 }));
  } catch (err) {
    return handleRouteError(err);
  }
}

/**
 * DELETE /api/patients/:id/forms/:formType/lock
 *
 * Releases an edit lock held by the caller.
 *
 * Params:
 * - id: string (required) - PatientSession.id
 * - formType: FormType (required)
 *
 * Body (JSON):
 * - lockToken: string (required)
 *
 * Status codes:
 * - 204 No Content
 * - 401 Unauthorized
 * - 403 Forbidden
 * - 409 Conflict (lock not held by caller)
 * - 422 Unprocessable Entity (validation error)
 */
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

    const lock = await prisma.formEditLock.findUnique({
      where: {
        patientSessionId_formType: {
          patientSessionId: p.data.id,
          formType: p.data.formType,
        },
      },
      select: { lockedByUserId: true, lockToken: true },
    });

    const valid =
      !!lock &&
      lock.lockedByUserId === me.id &&
      lock.lockToken === body.data.lockToken;

    if (!valid)
      return errorJson(409, "LOCK_INVALID", "Lock not held by caller");

    await prisma.formEditLock.delete({
      where: {
        patientSessionId_formType: {
          patientSessionId: p.data.id,
          formType: p.data.formType,
        },
      },
    });

    return new Response(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err);
  }
}
