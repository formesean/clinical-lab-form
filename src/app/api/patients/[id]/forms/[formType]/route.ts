import { getAuthedUser, getProfile, handleRouteError, requireApproved } from "@/lib/auth";
import { errorJson, json, noStore, zodError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { FormType, type LabForm } from "@prisma/client";
import z from "zod";
import type { GetFormResponse, LabFormDTO, UpdateFormResponse } from "@/types/api/forms";

const Params = z.object({
  id: z.string().min(1),
  formType: z.nativeEnum(FormType),
});

const PatchBody = z.object({
  lockToken: z.string().min(10),
  data: z.unknown(),
  expectedVersion: z.number().int().min(1).optional(),
});

function toFormDTO(f: LabForm): LabFormDTO {
  return {
    id: f.id,
    patientSessionId: f.patientSessionId,
    formType: f.formType,
    data: f.data,
    version: f.version,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

export async function GET(req: Request, ctx: { params: Promise<unknown> }) {
  try {
    const user = await getAuthedUser(req);
    requireApproved(await getProfile(user.id));

    const p = Params.safeParse(await ctx.params);
    if (!p.success) return zodError(p.error);

    const form = await prisma.labForm.findUnique({
      where: {
        patientSessionId_formType: {
          patientSessionId: p.data.id,
          formType: p.data.formType,
        },
      },
    });

    if (!form) return errorJson(404, "NOT_FOUND", "Form not found");

    const response: GetFormResponse = {
      ok: true,
      message: "Form fetched successfully",
      form: toFormDTO(form),
    };

    return noStore(json(response, { status: 200 }));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<unknown> }) {
  try {
    const user = await getAuthedUser(req);
    const me = requireApproved(await getProfile(user.id));

    const p = Params.safeParse(await ctx.params);
    if (!p.success) return zodError(p.error);

    const body = PatchBody.safeParse(await req.json().catch(() => null));
    if (!body.success) return zodError(body.error);

    const now = new Date();

    const lock = await prisma.formEditLock.findUnique({
      where: {
        patientSessionId_formType: {
          patientSessionId: p.data.id,
          formType: p.data.formType,
        },
      },
      select: { lockedByUserId: true, lockToken: true, expiresAt: true },
    });

    const valid =
      !!lock &&
      lock.lockedByUserId === me.id &&
      lock.lockToken === body.data.lockToken &&
      lock.expiresAt > now;

    if (!valid) return errorJson(409, "LOCK_REQUIRED", "Valid edit lock required");

    const existing = await prisma.labForm.findUnique({
      where: {
        patientSessionId_formType: { patientSessionId: p.data.id, formType: p.data.formType },
      },
      select: { id: true, version: true },
    });
    if (!existing) return errorJson(404, "NOT_FOUND", "Form not found");

    if (body.data.expectedVersion && body.data.expectedVersion !== existing.version) {
      return errorJson(409, "VERSION_CONFLICT", "Version conflict");
    }

    const updated = await prisma.labForm.update({
      where: {
        patientSessionId_formType: { patientSessionId: p.data.id, formType: p.data.formType },
      },
      data: {
        data: body.data.data as any,
        version: { increment: 1 },
      },
    });

    const response: UpdateFormResponse = {
      ok: true,
      message: "Form updated successfully",
      form: toFormDTO(updated),
    };

    return noStore(json(response, { status: 200 }));
  } catch (err) {
    return handleRouteError(err);
  }
}
