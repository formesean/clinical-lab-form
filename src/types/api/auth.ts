import type { AccountStatus, Role } from "@prisma/client";

export type ProfileDTO = {
  id: string;
  email: string;
  userIdNum: string;
  licenseNum: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  role: Role;
  status: AccountStatus;
  createdAt: string;
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
  licenseNum: string;
  firstName: string;
  middleName: string;
  lastName: string;
};

export type SignupResponse = {
  ok: boolean;
  message: string;
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
  profile: EnsureProfileDTO;
};

export type EnsureProfileDTO = {
  id: string;
  role: Role;
  status: AccountStatus;
  updatedAt: string;
};

export type EnsureProfileResponse = {
  profile: EnsureProfileDTO;
};

export type LogoutResponse = {
  success: boolean;
};
