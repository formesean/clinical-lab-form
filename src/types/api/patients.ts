import type { FormType, Sex } from "@prisma/client";

export type PatientSessionDTO = {
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

export type CreatePatientRequest = {
  patientIdNum: string;
  lastName: string;
  firstName: string;
  middleName?: string | null;
  dateOfBirth: string;
  age: number;
  sex: Sex;
  requestingPhysician: string;
  requestedForms: FormType[];
};

export type CreatePatientResponse = {
  patient: PatientSessionDTO;
};

export type ListPatientsResponse = {
  patients: PatientSessionDTO[];
};

export type GetPatientResponse = {
  patient: PatientSessionDTO;
};

export type UpdatePatientRequest = Partial<Omit<CreatePatientRequest, "requestedForms">> & {
  requestedForms?: FormType;
};

export type UpdatePatientResponse = {
  patient: PatientSessionDTO;
};
