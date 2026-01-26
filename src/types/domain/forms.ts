import { FormType } from "@prisma/client";

export type Sex = "MALE" | "FEMALE";

export type PatientHeaderData = {
  patientIdNum: string;
  lastName: string;
  firstName: string;
  middleName?: string | null;
  dob: string;
  age: number;
  sex: Sex;
  requestingPhysician: string;
  requestedForms: FormType[];
};

export type BaseFormData = Record<string, unknown>;

export type FormDataByType = {
  [K in FormType]: BaseFormData;
};
