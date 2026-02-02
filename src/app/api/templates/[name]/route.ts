import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!name || name.includes("..") || name.includes("/")) {
    return NextResponse.json({ error: "Invalid template name" }, { status: 400 });
  }

  const templatePath = path.join(process.cwd(), "src", "templates", name);
  if (!fs.existsSync(templatePath)) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(templatePath);
  const ext = path.extname(name).toLowerCase();
  const contentType =
    ext === ".pdf"
      ? "application/pdf"
      : ext === ".json"
        ? "application/json"
        : "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${name}"`,
    },
  });
}
