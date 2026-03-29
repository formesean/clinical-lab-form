import { NextResponse } from "next/server";
import z from "zod";
import { ensureProfileForUser } from "@/lib/auth";
import { errorJson, zodError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { supabaseAuth } from "@/lib/supabase";
import type { LoginRequest, LoginResponse } from "@/types/api/auth";

const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 10;

const Body = z.object({
  userIdNum: z.string().trim().min(3).max(64),
  password: z.string().min(8).max(72),
});

/**
 * POST /api/auth/login
 *
 * Logs in using userIdNum and password by mapping userIdNum -> Profile.email,
 * then calling Supabase Auth sign-in. Returns session tokens.
 *
 * Body (JSON):
 * - userIdNum: string (required)
 * - password: string (required)
 *
 * Returns (JSON):
 * - { access_token, refresh_token, token_type, profile }
 *
 * Status codes:
 * - 200 OK
 * - 401 Unauthorized (invalid credentials)
 * - 422 Unprocessable Entity (validation error)
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return zodError(parsed.error);

  const { userIdNum, password }: LoginRequest = parsed.data;

  const profile = await prisma.profile.findUnique({
    where: { userIdNum },
    select: { id: true, email: true },
  });

  if (!profile) {
    return errorJson(401, "INVALID_CREDENTIALS", "Invalid credentials");
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  if (error || !data.session) {
    return errorJson(401, "INVALID_CREDENTIALS", "Invalid credentials");
  }

  const ensuredProfile = await ensureProfileForUser({
    id: profile.id,
    email: profile.email,
  });

  const ensuredProfileDto = {
    ...ensuredProfile,
    updatedAt: ensuredProfile.updatedAt.toISOString(),
  };

  const response: LoginResponse = {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    token_type: (data.session.token_type ?? "bearer") as "bearer",
    profile: ensuredProfileDto,
  };

  const res = NextResponse.json(response, { status: 200 });

  const secure = process.env.NODE_ENV === "production";

  res.headers.append(
    "Set-Cookie",
    `sb_access_token=${data.session.access_token}; Path=/; HttpOnly; SameSite=Lax; ${secure ? "Secure;" : ""} Max-Age=${SESSION_COOKIE_MAX_AGE_SECONDS}`,
  );

  res.headers.append(
    "Set-Cookie",
    `sb_refresh_token=${data.session.refresh_token}; Path=/; HttpOnly; SameSite=Lax; ${secure ? "Secure;" : ""} Max-Age=${SESSION_COOKIE_MAX_AGE_SECONDS}`,
  );

  res.headers.set("Cache-Control", "no-store");

  return res;
}
