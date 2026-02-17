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
import type { RenewLockResponse } from "@/types/api/forms";

const Params = z.object({
  id: z.string().min(1),
  formType: z.nativeEnum(FormType),
});

const Body = z.object({
  lockToken: z.string().min(10),
});

/**
 * POST /api/patients/:id/forms/:formType/lock/renew
 *
 * Renews an existing edit lock held by the caller.
 *
 * Params:
 * - id: string (required) - PatientSession.id
 * - formType: FormType (required)
 *
 * Body (JSON):
 * - lockToken: string (required)
 *
 * Returns (JSON):
 * - { ok: true, message: string, lockToken: string }
 *
 * Status codes:
 * - 200 OK
 * - 401 Unauthorized
 * - 403 Forbidden
 * - 409 Conflict (lock not held by caller)
 * - 422 Unprocessable Entity (validation error)
 */
export async function POST(req: Request, ctx: { params: Promise<unknown> }) {
  try {
    const user = await getAuthedUser(req);
    const me = requireApproved(await getProfile(user.id));

    const p = Params.safeParse(await ctx.params);
    if (!p.success) return zodError(p.error);

    const body = Body.safeParse(await req.json().catch(() => null));
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

    const response: RenewLockResponse = {
      ok: true,
      message: "Lock renewed successfully",
      lockToken: lock.lockToken,
    };

    return noStore(json(response, { status: 200 }));
  } catch (err) {
    return handleRouteError(err);
  }
}
