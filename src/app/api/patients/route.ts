import { getAuthedUser, getProfile, handleRouteError, requireApproved } from "@/lib/auth";
import { json, noStore, zodError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import type {
  CreatePatientRequest,
  CreatePatientResponse,
  ListPatientsResponse,
  PatientDTO,
} from "@/types/api/patients";
import { FormType, Sex, type PatientSession } from "@prisma/client";
import z from "zod";

const CreateBody = z.object({
  patientIdNum: z.string().trim().min(1).max(64),
  lastName: z.string().trim().min(1).max(128),
  firstName: z.string().trim().min(1).max(128),
  middleName: z.string().trim().min(1).max(128).nullable().optional(),
  dateOfBirth: z.string().datetime(),
  age: z.number().min(0).max(150),
  sex: z.nativeEnum(Sex),
  requestingPhysician: z.string().trim().max(256).nullable().optional(),
  requestedForms: z.array(z.nativeEnum(FormType)).min(1),
});

const ListQuery = z.object({
  q: z.string().trim().max(128).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
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
    requestingPhysician: p.requestingPhysician ?? null,
    requestedForms: p.requestedForms,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

/**
 * POST /api/patients
 *
 * Creates a new patient session and ensures LabForm rows for requested forms.
 *
 * Body (JSON):
 * - patientIdNum: string (required)
 * - lastName: string (required)
 * - firstName: string (required)
 * - middleName: string | null (optional)
 * - dateOfBirth: string (ISO datetime, required)
 * - age: number (required)
 * - sex: Sex (required)
 * - requestingPhysician: string | null (optional)
 * - requestedForms: FormType[] (required, min 1)
 *
 * Returns (JSON):
 * - { ok: true, message: string, patient: PatientDTO }
 *
 * Status codes:
 * - 201 Created
 * - 401 Unauthorized
 * - 403 Forbidden
 * - 422 Unprocessable Entity (validation error)
 */

export async function POST(req: Request) {
  try {
    const user = await getAuthedUser(req);
    const me = requireApproved(await getProfile(user.id));

    const parsed = CreateBody.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);

    const body: CreatePatientRequest = parsed.data;

    const created = await prisma.$transaction(async (tx) => {
      const patient = await tx.patientSession.create({
        data: {
          createdByUserId: me.id,
          patientIdNum: body.patientIdNum,
          lastName: body.lastName,
          firstName: body.firstName,
          middleName: body.middleName ?? "",
          dateOfBirth: body.dateOfBirth,
          age: body.age,
          sex: body.sex,
          requestingPhysician: body.requestingPhysician ?? null,
          requestedForms: body.requestedForms,
        },
      });

      await tx.labForm.createMany({
        data: body.requestedForms.map((formType) => ({
          patientSessionId: patient.id,
          formType,
          data: {},
          version: 1,
        })),
        skipDuplicates: true,
      });

      return patient;
    });

    const response: CreatePatientResponse = {
      ok: true,
      message: "Patient created successfully",
      patient: toPatientDTO(created),
    };

    return noStore(json(response, { status: 201 }));
  } catch (err) {
    return handleRouteError(err);
  }
}

/**
 * GET /api/patients
 *
 * Lists patient sessions, optionally filtered by query.
 *
 * Query params:
 * - q: string (optional)
 * - limit: number (optional, default 20, max 100)
 * - cursor: string (optional)
 *
 * Returns (JSON):
 * - { ok: true, message: string, patients: PatientDTO[] }
 *
 * Status codes:
 * - 200 OK
 * - 401 Unauthorized
 * - 403 Forbidden
 * - 422 Unprocessable Entity (validation error)
 */
export async function GET(req: Request) {
  try {
    const user = await getAuthedUser(req);
    requireApproved(await getProfile(user.id));

    const url = new URL(req.url);
    const parsed = ListQuery.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) return zodError(parsed.error);

    const { q, limit, cursor } = parsed.data;

    const where =
      q && q.length > 0
        ? {
          OR: [
            { patientIdNum: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
            { firstName: { contains: q, mode: "insensitive" as const } },
          ],
        }
        : {};

    const rows = await prisma.patientSession.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const response: ListPatientsResponse = {
      ok: true,
      message: "Patients listed successfully",
      patients: rows.map(toPatientDTO),
    };

    return noStore(json(response, { status: 200 }));
  } catch (err) {
    return handleRouteError(err);
  }
}
