import type { AccountStatus, Role } from "@prisma/client";

export type ProfileDTO = {
  id: string;
  userIdNum: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  status: AccountStatus;
  updatedAt: string;
};

export type MeResponse = {
  user: { id: string; email?: string | null };
  profile: ProfileDTO;
};

export type SignupRequest = {
  email: string;
  password: string;
  userIdNum: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type SignupResponse = {
  profile: ProfileDTO;
};

export type LoginRequest = {
  userIdNum: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: "bearer";
};
