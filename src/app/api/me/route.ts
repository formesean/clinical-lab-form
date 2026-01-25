import { getAuthedUser, handleRouteError } from "@/lib/auth";
import { errorJson, json, noStore } from "@/lib/http";
import { prisma } from "@/lib/prisma";


export async function GET(req: Request) {
  try {
    const user = await getAuthedUser(req);
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
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
      }
    });

    if (!profile) {
      return errorJson(403, "PROFILE_REQUIRED", "Profile not found. Please sign up.");
    }

    return noStore(
      json({
        user: { id: user.id, email: user.email },
        profile,
      }),
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
