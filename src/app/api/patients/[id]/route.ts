import { getAuthedUser, getProfile, handleRouteError, requireApproved } from "@/lib/auth";
import { json, noStore, zodError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import type {
  GetPatientResponse,
  PatchPatientRequest,
  PatchPatientResponse,
  PatientDTO,
} from "@/types/api/patients";
import { FormType, Sex, Status, type PatientSession } from "@prisma/client";
import z from "zod";

const Params = z.object({ id: z.string().min(1) });

const PatchBody = z.object({
  patientIdNum: z.string().trim().min(1).max(64).optional(),
  lastName: z.string().trim().min(1).max(128).optional(),
  firstName: z.string().trim().min(1).max(128).optional(),
  middleName: z.string().trim().max(128).nullable().optional(),
  dateOfBirth: z.string().datetime().optional(),
  age: z.number().int().min(0).max(150).optional(),
  sex: z.nativeEnum(Sex).optional(),
  status: z.nativeEnum(Status).optional(),
  requestingPhysician: z.string().trim().max(256).nullable().optional(),
  requestedForms: z.array(z.nativeEnum(FormType)).min(1).optional(),
});

function toPatientDTO(p: PatientSession): PatientDTO {
  return {
    id: p.id,
    patientIdNum: p.patientIdNum,
    lastName: p.lastName,
    firstName: p.firstName,
    middleName: p.middleName ?? null,
    dateOfBirth: new Date(p.dateOfBirth).toISOString(),
    age: p.age,
    sex: p.sex,
    status: p.status,
    requestingPhysician: p.requestingPhysician ?? null,
    requestedForms: p.requestedForms,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

/**
 * GET /api/patients/:id
 *
 * Fetches a patient session by ID.
 *
 * Returns (JSON):
 * - { ok: true, message: string, patient: PatientDTO }
 *
 * Status codes:
 * - 200 OK
 * - 401 Unauthorized
 * - 403 Forbidden
 * - 404 Not Found
 */

export async function GET(req: Request, ctx: { params: Promise<unknown> }) {
  try {
    const user = await getAuthedUser(req);
    requireApproved(await getProfile(user.id));

    const p = Params.safeParse(await ctx.params);
    if (!p.success) return zodError(p.error);

    const patient = await prisma.patientSession.findUnique({ where: { id: p.data.id } });
    if (!patient) return json({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 });

    const response: GetPatientResponse = {
      ok: true,
      message: "Patient fetched successfully",
      patient: toPatientDTO(patient),
    };

    return noStore(json(response, { status: 200 }));
  } catch (err) {
    return handleRouteError(err);
  }
}

/**
 * PATCH /api/patients/:id
 *
 * Updates patient session fields and optionally ensures requested LabForms exist.
 *
 * Body (JSON):
 * - patientIdNum?: string
 * - lastName?: string
 * - firstName?: string
 * - middleName?: string | null
 * - dateOfBirth?: string (ISO datetime)
 * - age?: number
 * - sex?: Sex
 * - status?: Status
 * - requestingPhysician?: string | null
 * - requestedForms?: FormType[]
 *
 * Returns (JSON):
 * - { ok: true, message: string, patient: PatientDTO }
 *
 * Status codes:
 * - 200 OK
 * - 401 Unauthorized
 * - 403 Forbidden
 * - 404 Not Found
 * - 422 Unprocessable Entity (validation error)
 */
export async function PATCH(req: Request, ctx: { params: Promise<unknown> }) {
  try {
    const user = await getAuthedUser(req);
    requireApproved(await getProfile(user.id));

    const p = Params.safeParse(await ctx.params);
    if (!p.success) return zodError(p.error);

    const body = PatchBody.safeParse(await req.json().catch(() => null));
    if (!body.success) return zodError(body.error);

    const data: PatchPatientRequest = body.data;
    const updated = await prisma.$transaction(async (tx) => {
      const patient = await tx.patientSession.update({
        where: { id: p.data.id },
        data: {
          ...(data.patientIdNum ? { patientIdNum: data.patientIdNum } : {}),
          ...(data.lastName ? { lastName: data.lastName } : {}),
          ...(data.firstName ? { firstName: data.firstName } : {}),
          ...(data.middleName !== undefined ? { middleName: data.middleName ?? "" } : {}),
          ...(data.dateOfBirth ? { dateOfBirth: data.dateOfBirth } : {}),
          ...(data.age !== undefined ? { age: data.age } : {}),
          ...(data.sex ? { sex: data.sex } : {}),
          ...(data.status ? { status: data.status } : {}),
          ...(data.requestingPhysician !== undefined ? { requestingPhysician: data.requestingPhysician } : {}),
          ...(data.requestedForms ? { requestedForms: data.requestedForms } : {}),
        },
      });

      // If requestedForms changed, ensure LabForm rows exist.
      if (data.requestedForms) {
        await tx.labForm.createMany({
          data: data.requestedForms.map((formType) => ({
            patientSessionId: patient.id,
            formType,
            data: {},
            version: 1,
          })),
          skipDuplicates: true,
        });
      }

      return patient;
    });

    const response: PatchPatientResponse = {
      ok: true,
      message: "Patient updated successfully",
      patient: toPatientDTO(updated),
    };

    return noStore(json(response, { status: 200 }));
  } catch (err) {
    return handleRouteError(err);
  }
}
