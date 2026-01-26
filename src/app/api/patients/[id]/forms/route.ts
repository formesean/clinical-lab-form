import { getAuthedUser, getProfile, handleRouteError, requireApproved } from "@/lib/auth";
import { errorJson, json, noStore, zodError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import type { CreateFormResponse, LabFormDTO, ListFormsResponse } from "@/types/api/forms";
import { FormType, type LabForm } from "@prisma/client";
import z from "zod";

const Params = z.object({ id: z.string().min(1) });

const CreateBody = z.object({
  formType: z.nativeEnum(FormType),
  data: z.unknown().optional(),
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

    const patient = await prisma.patientSession.findUnique({
      where: { id: p.data.id },
      select: { id: true },
    });
    if (!patient) return errorJson(404, "NOT_FOUND", "Patient session not found");

    const forms = await prisma.labForm.findMany({
      where: { patientSessionId: p.data.id },
      orderBy: { formType: "asc" },
    });

    const response: ListFormsResponse = {
      ok: true,
      message: "Forms fetched successfully",
      forms: forms.map(toFormDTO),
    };

    return noStore(json(response, { status: 200 }));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<unknown> }) {
  try {
    const user = await getAuthedUser(req);
    requireApproved(await getProfile(user.id));

    const p = Params.safeParse(await ctx.params);
    if (!p.success) return zodError(p.error);

    const body = CreateBody.safeParse(await req.json().catch(() => null));
    if (!body.success) return zodError(body.error);

    const patient = await prisma.patientSession.findUnique({
      where: { id: p.data.id },
      select: { id: true },
    });
    if (!patient) return errorJson(404, "NOT_FOUND", "Patient session not found");

    const created = await prisma.labForm.upsert({
      where: {
        patientSessionId_formType: {
          patientSessionId: patient.id,
          formType: body.data.formType,
        },
      },
      create: {
        patientSessionId: patient.id,
        formType: body.data.formType,
        data: body.data.data ?? {},
        version: 1,
      },
      update: {
        data: body.data.data ?? {},
      },
    });

    const response: CreateFormResponse = {
      ok: true,
      message: "Form saved successfully",
      form: toFormDTO(created),
    };

    return noStore(json(response, { status: 200 }));
  } catch (err) {
    return handleRouteError(err);
  }
}
