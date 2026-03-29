import { AccountStatus, Profile, Role } from "@prisma/client";
import { supabaseAuth } from "./supabase";
import { errorJson } from "./http";
import { prisma } from '@/lib/prisma';

export type AuthedUser = { id: string, email: string | null };

function parseCookie(header: string | null) {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join("=") ?? "");
  }
  return out;
}

export async function getAuthedUser(req: Request): Promise<AuthedUser> {
  const authHeader = req.headers.get("authorization");
  let token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : null;

  if (!token) {
    const cookies = parseCookie(req.headers.get("cookie"));
    token = cookies.sb_access_token ?? null;
  }

  if (!token) {
    throw Object.assign(new Error("Missing Bearer token"), { status: 401, code: "UNAUTHENTICATED" });
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data.user) throw Object.assign(new Error("Invalid token"), { status: 401, code: "UNAUTHENTICATED" });

  return { id: data.user.id, email: data.user.email ?? null };
}

export async function getProfile(userId: string) {
  return prisma.profile.findUnique({ where: { id: userId } });
}

export function getAdminEmails(): Set<string> {
  const sources = [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL]
    .map((value) => value?.trim())
    .filter(Boolean) as string[];
  const emails = sources
    .flatMap((value) => value.split(","))
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return new Set(emails);
}

export async function ensureProfileForUser(user: AuthedUser) {
  const adminEmails = getAdminEmails();
  const userEmail = user.email?.toLowerCase() ?? null;
  const isAdmin = !!userEmail && adminEmails.has(userEmail);

  const existing = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, status: true, updatedAt: true },
  });

  if (!existing) {
    throw Object.assign(new Error("Profile not found"), { status: 403, code: "PROFILE_REQUIRED" });
  }

  if (!isAdmin) return existing;

  return prisma.profile.update({
    where: { id: user.id },
    data: { role: Role.ADMIN, status: AccountStatus.APPROVED },
    select: { id: true, role: true, status: true, updatedAt: true },
  });
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
