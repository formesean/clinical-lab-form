import type { FormType, Sex } from "@prisma/client";

export type PatientDTO = {
  id: string;
  patientIdNum: string;
  lastName: string;
  firstName: string;
  middleName?: string | null;
  dateOfBirth: string;
  age: number;
  sex: Sex;
  requestingPhysician: string | null;
  requestedForms: FormType[];
  createdAt: string;
  updatedAt: string;
};

export type PatientSessionDTO = PatientDTO;

export type CreatePatientRequest = {
  patientIdNum: string;
  lastName: string;
  firstName: string;
  middleName?: string | null;
  dateOfBirth: string;
  age: number;
  sex: Sex;
  requestingPhysician?: string | null;
  requestedForms: FormType[];
};

export type CreatePatientResponse = {
  ok: boolean;
  message: string;
  patient: PatientSessionDTO;
};

export type ListPatientsResponse = {
  ok: boolean;
  message: string;
  patients: PatientSessionDTO[];
};

export type GetPatientResponse = {
  ok: boolean;
  message: string;
  patient: PatientDTO;
};

export type PatchPatientRequest = Partial<CreatePatientRequest>;

export type PatchPatientResponse = {
  ok: boolean;
  message: string;
  patient: PatientDTO;
};
