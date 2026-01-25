import { AccountStatus, Profile, Role } from "./generated/prisma";
import { supabaseAuth } from "./supabase";
import { errorJson } from "./http";
import { prisma } from '@/lib/prisma';

export type AuthedUser = { id: string, email: string | null };

export async function getAuthedUser(req: Request): Promise<AuthedUser> {
  const auth = req.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/i);

  if (!match) throw Object.assign(new Error("Missing Bearer token"), { status: 401, code: "UNAUTHENTICATED" });

  const token = match[1]!;
  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data.user) throw Object.assign(new Error("Invalid token"), { status: 401, code: "UNAUTHENTICATED" });

  return { id: data.user.id, email: data.user.email ?? null };
}

export async function getProfile(userId: string) {
  return prisma.profile.findUnique({ where: { id: userId } });
}

export function requireApproved(profile: Profile | null) {
  if (!profile) throw Object.assign(new Error("Profile not found"), { status: 403, code: "PROFILE_REQUIRED" });
  if (profile.status !== AccountStatus.APPROVED) throw Object.assign(new Error("Account not approved"), { status: 403, code: "NOT_APPROVED" });

  return profile;
}

export function requireAdmin(profile: Profile) {
  if (profile.role !== Role.ADMIN) throw Object.assign(new Error("Admin only"), { status: 403, code: "FORBIDDEN" });

  return profile;
}

export function handleRouteError(err: unknown) {
  const e = err as { status?: number; code?: string; message?: string };
  const status = e.status ?? 500;
  const code = e.code ?? "INTERNAL_ERROR";
  const message = status === 500 ? "Internal error" : (e.message ?? "Request failed");
  return errorJson(status, code, message);
}
