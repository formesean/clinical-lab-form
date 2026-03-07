import { getAuthedUser, getProfile, handleRouteError, requireAdmin, requireApproved } from "@/lib/auth";
import { json, noStore } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(200),
  licenseNum: z.string().min(1, "License number is required").max(50),
});

export async function GET(req: Request) {
  try {
    const user = await getAuthedUser(req);
    const me = requireApproved(await getProfile(user.id));
    requireAdmin(me);

    const medtechs = await prisma.medTech.findMany({
      orderBy: { fullName: "asc" },
    });

    return noStore(json({ medtechs }));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthedUser(req);
    const me = requireApproved(await getProfile(user.id));
    requireAdmin(me);

    const body = await req.json();
    const parsed = createSchema.parse(body);

    const existing = await prisma.medTech.findUnique({
      where: { licenseNum: parsed.licenseNum },
    });
    if (existing) {
      return json(
        { error: { code: "DUPLICATE_LICENSE", message: "A medtech with this license number already exists" } },
        { status: 409 },
      );
    }

    const medtech = await prisma.medTech.create({ data: parsed });

    return json({ medtech }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
