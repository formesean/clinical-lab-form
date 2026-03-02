import { getAuthedUser, getProfile, handleRouteError, requireAdmin, requireApproved } from "@/lib/auth";
import { json, errorJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  licenseNum: z.string().min(1).max(50).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthedUser(req);
    const me = requireApproved(await getProfile(user.id));
    requireAdmin(me);

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const existing = await prisma.medTech.findUnique({ where: { id } });
    if (!existing) {
      return errorJson(404, "NOT_FOUND", "MedTech not found");
    }

    if (parsed.licenseNum && parsed.licenseNum !== existing.licenseNum) {
      const dup = await prisma.medTech.findUnique({
        where: { licenseNum: parsed.licenseNum },
      });
      if (dup) {
        return json(
          { error: { code: "DUPLICATE_LICENSE", message: "A medtech with this license number already exists" } },
          { status: 409 },
        );
      }
    }

    const medtech = await prisma.medTech.update({
      where: { id },
      data: parsed,
    });

    return json({ medtech });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthedUser(req);
    const me = requireApproved(await getProfile(user.id));
    requireAdmin(me);

    const { id } = await params;

    const existing = await prisma.medTech.findUnique({ where: { id } });
    if (!existing) {
      return errorJson(404, "NOT_FOUND", "MedTech not found");
    }

    await prisma.medTech.delete({ where: { id } });

    return json({ success: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
