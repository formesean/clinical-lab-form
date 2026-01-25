import { AccountStatus, Role } from "@prisma/client";
import { errorJson, json, noStore, zodError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { supabaseAuth } from "@/lib/supabase";
import z from "zod";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  userIdNum: z.string().trim().min(3).max(64),
  firstName: z.string().trim().min(1).max(64),
  lastName: z.string().trim().min(1).max(64),
});

function getAdminEmails(): Set<string> {
  const single = process.env.ADMIN_EMAIL?.trim();
  const manyRaw = process.env.ADMIN_EMAILS?.trim();
  const emails = [
    ...(manyRaw ? manyRaw.split(",") : []),
    ...(single ? [single] : []),
  ]
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return new Set(emails);
}


/**
 * POST /api/auth/signup
 *
 * Creates a Supabase Auth user and a corresponding Profile row (PENDING by default).
 * Does NOT log the user in (no session tokens returned).
 *
 * Body (JSON):
 * - email: string (required)
 * - password: string (required, min 8)
 * - userIdNum: string (required, unique)
 * - firstName: string (required)
 * - lastName: string (required)
 *
 * Returns (JSON):
 * - { ok: true, message: string, profile: { id, email, userIdNum, firstName, lastName, role, status, createdAt, updatedAt } }
 *
 * Status codes:
 * - 201 Created
 * - 409 Conflict (id number/email already exists)
 * - 422 Unprocessable Entity (validation error)
 * - 400 Bad Request (signup failed)
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return zodError(parsed.error);

  const { email, password, userIdNum, firstName, lastName } = parsed.data;
  const emailNorm = email.toLowerCase();

  const existing = await prisma.profile.findFirst({
    where: { OR: [{ userIdNum }, { email: emailNorm }] },
    select: { id: true },
  });
  if (existing) {
    return errorJson(409, "CONFLICT", "Account already exists");
  }

  const { data, error } = await supabaseAuth.auth.signUp({
    email: emailNorm,
    password,
  });

  if (error || !data.user?.id) {
    return errorJson(400, "SIGNUP_FAILED", "Unable to sign up");
  }

  const isAdmin = getAdminEmails().has(emailNorm);

  const profile = await prisma.profile.create({
    data: {
      id: data.user.id,
      email: emailNorm,
      userIdNum,
      firstName,
      lastName,
      role: isAdmin ? Role.ADMIN : Role.USER,
      status: isAdmin ? AccountStatus.APPROVED : AccountStatus.PENDING,
    },
    select: {
      id: true,
      email: true,
      userIdNum: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return noStore(
    json(
      {
        ok: true,
        message: "Signed up. Please log in (and wait for approval if required).",
        profile,
      },
      { status: 201 },
    ),
  );
}
