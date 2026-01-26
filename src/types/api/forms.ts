import type { FormType } from "@prisma/client";
import type { BaseFormData } from "@/types/domain/forms";

export type GetFormResponse = {
  form: {
    id: string;
    formType: FormType;
    data: BaseFormData;
    version: number;
    updatedAt: string;
  };
};

export type ListFormsResponse = {
  forms: Array<{
    id: string;
    formType: FormType;
    updatedAt: string;
    version: number;
  }>;
};

export type CreateFormRequest = {
  formType: FormType;
};

export type CreateFormResponse = {
  form: {
    id: string;
    formType: FormType;
    updatedAt: string;
    version: number;
  };
};

export type UpdateFormRequest = {
  lockToken: string;
  data: BaseFormData;
};

export type UpdateFormResponse = {
  form: {
    id: string;
    formType: FormType;
    updatedAt: string;
    version: number;
  };
};
