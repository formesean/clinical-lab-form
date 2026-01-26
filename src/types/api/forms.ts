import type { FormType } from "@prisma/client";

export type LabFormDTO = {
  id: string;
  patientSessionId: string;
  formType: FormType;
  data: unknown;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateFormRequest = {
  formType: FormType;
  data?: unknown;
}

export type CreateFormResponse = {
  form: LabFormDTO;
}

export type ListFormResponse = {
  form: LabFormDTO[];
}

export type GetFormResponse = {
  form: LabFormDTO;
}

export type UpdateFormRequest = {
  lockToken: string;
  data: unknown;
  expectedVersion?: number;
}

export type UpdateFormResponse = {
  form: LabFormDTO;
}

export type AcquireLockResponse = {
  lockToken: string;
  expiresAt: string;
}

export type RenewLockResponse = {
  lockToken: string;
  expiresAt: string;
}
