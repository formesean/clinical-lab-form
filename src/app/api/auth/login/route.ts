import { errorJson, json, noStore, zodError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { supabaseAuth } from "@/lib/supabase";
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
 * - { access_token, refresh_token, token_type, expires_in, expires_at }
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
    select: { email: true },
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

  return noStore(
    json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token_type: data.session.token_type,
      expires_in: data.session.expires_in,
      expires_at: data.session.expires_at,
    }),
  );
}
