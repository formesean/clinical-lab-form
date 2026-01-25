import { ensureProfileForUser } from "@/lib/auth";
import { errorJson, json, noStore, zodError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { supabaseAuth } from "@/lib/supabase";
import { NextResponse } from "next/server";
import z from "zod";

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
 * - { access_token, refresh_token, token_type, expires_in, expires_at, profile }
 *
 * Status codes:
 * - 200 OK
 * - 401 Unauthorized (invalid credentials)
 * - 422 Unprocessable Entity (validation error)
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return zodError(parsed.error);

  const { userIdNum, password } = parsed.data;

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

  const res = NextResponse.json(
    {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      expires_at: data.session.expires_at,
      token_type: data.session.token_type,
      profile: ensuredProfile,
    },
    { status: 200 },
  );

  const secure = process.env.NODE_ENV === "production";

  res.headers.append(
    "Set-Cookie",
    `sb_access_token=${data.session.access_token}; Path=/; HttpOnly; SameSite=Lax; ${secure ? "Secure;" : ""} Max-Age=${Math.max(60, Number(data.session.expires_in) || 3600)}`
  );

  res.headers.append(
    "Set-Cookie",
    `sb_refresh_token=${data.session.refresh_token}; Path=/; HttpOnly; SameSite=Lax; ${secure ? "Secure;" : ""} Max-Age=2592000`
  );

  res.headers.set("Cache-Control", "no-store");

  return res;
}
