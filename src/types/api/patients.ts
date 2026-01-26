import type { FormType } from "@prisma/client";
import type { PatientHeaderData } from "@/types/domain/forms";

export type PatientSessionDTO = {
  id: string;
  createdAt: string;
  updatedAt: string;
  patientData: PatientHeaderData;
};

export type LabFormSummaryDTO = {
  id: string;
  formType: FormType;
  updatedAt: string;
  version: number;
};

export type CreatePatientRequest = {
  patientIdNum: string;
  lastName: string;
  firstName: string;
  middleName?: string | null;
  dob: string;
  age: number;
  sex: "MALE" | "FEMALE";
  requestingPhysician: string;
  requestedForms: FormType[];
};

export type CreatePatientResponse = {
  patient: PatientSessionDTO;
  forms: LabFormSummaryDTO[];
};

export type ListPatientsResponse = {
  patients: PatientSessionDTO[];
};

export type GetPatientResponse = {
  patient: PatientSessionDTO;
};

export type PatchPatientRequest = {
  patientData: Partial<PatientHeaderData>;
};

export type PatchPatientResponse = {
  patient: PatientSessionDTO;
};
