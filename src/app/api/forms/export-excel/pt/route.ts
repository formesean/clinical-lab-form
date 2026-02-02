import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import path from "path";
import { FormType } from "@prisma/client";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const raw = body as Record<string, unknown>;
  const formType = raw.formType as FormType;

  if (!formType || typeof formType !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'formType'." },
      { status: 400 }
    );
  }

  const templateFilename = "UA MF.xlsx"
  const templatePath = path.join(
    process.cwd(),
    "src",
    "templates",
    templateFilename
  );

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(templatePath);
  } catch (err) {
    console.error("Failed to read Excel template:", err);
    return NextResponse.json(
      { error: "Template file not found", template: templateFilename },
      { status: 500 }
    );
  }

  const sheet = workbook.worksheets[0];

  type CellValue = string | number | boolean | Date | null | undefined;
  const v = (x: unknown): CellValue => (x as CellValue);
  if (formType === "PT") {
    sheet.getCell(`E27`).value = v(raw.color);
    sheet.getCell(`E28`).value = v(raw.clarity);
    sheet.getCell(`E30`).value = v(raw.ph);
    sheet.getCell(`E31`).value = v(raw.spec_grav);
    sheet.getCell(`E33`).value = v(raw.b_hcg);
    sheet.getCell("C44").value = v(raw.remarks);
    sheet.getCell("A50").value = v(raw.performed);
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${templateFilename}"`,
    },
  });
}
