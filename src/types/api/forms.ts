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
};

export type CreateFormResponse = {
  ok: boolean;
  message: string;
  form: LabFormDTO;
};

export type ListFormsResponse = {
  ok: boolean;
  message: string;
  forms: LabFormDTO[];
};

export type GetFormResponse = {
  ok: boolean;
  message: string;
  form: LabFormDTO;
};

export type UpdateFormRequest = {
  lockToken: string;
  data: unknown;
  expectedVersion?: number;
};

export type UpdateFormResponse = {
  ok: boolean;
  message: string;
  form: LabFormDTO;
};

export type AcquireLockResponse = {
  ok: boolean;
  message: string;
  lockToken: string;
  expiresAt: string;
};

export type RenewLockResponse = {
  ok: boolean;
  message: string;
  lockToken: string;
  expiresAt: string;
};
