import type { AccountStatus, Role } from "@prisma/client";

export type AuthzCheckResponse = {
  ok: boolean;
  user: {
    id: string;
    email: string | null;
  };
  profile: {
    id: string;
    role: Role;
    status: AccountStatus;
  };
};
