import { getAuthedUser, handleRouteError } from "@/lib/auth";
import { AccountStatus, Role } from "@prisma/client";
import { errorJson, json, noStore } from "@/lib/http";
import { prisma } from "@/lib/prisma";

function getAdminEmails(): Set<string> {
  const single = process.env.ADMIN_EMAIL?.trim();
  const manyRaw= process.env.ADMIN_EMAIL?.trim();
  const emails = [
    ...(manyRaw ? manyRaw.split(",") : []),
    ...(single ? [single] : []),
  ].map((e) => e.trim().toLowerCase()).filter(Boolean);

  return new Set(emails);
}

export async function POST(req: Request) {
  try {
    const user = await getAuthedUser(req);
    const adminEmails = getAdminEmails();
    const userEmail = user.email?.toLowerCase() ?? null;
    const isAdmin = !!userEmail && adminEmails.has(userEmail);

    const existing = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, status: true, updatedAt: true },
    });

    if (!existing) {
      return errorJson(403, "PROFILE_REQUIRED", "Profile not found. Please sign up.");
    }

    const profile = isAdmin
      ? await prisma.profile.update({
        where: { id: user.id },
        data: { role: Role.ADMIN, status: AccountStatus.APPROVED },
        select: { id: true, role: true, status: true, updatedAt: true },
        })
      : existing;

    return noStore(
      json({
        profile: {
          id: profile.id,
          role: profile.role,
          status: profile.status,
          updatedAt: profile.updatedAt,
        }
      }),
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
