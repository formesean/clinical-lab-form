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
  if (formType === "IMMUNO") {
    sheet.getCell(`H28`).value = v(raw.anti_hiv);
    sheet.getCell(`H31`).value = v(raw.hbsag);
    sheet.getCell(`H34`).value = v(raw.anti_hcv);
    sheet.getCell(`H37`).value = v(raw.anti_tp);
    sheet.getCell(`H40`).value = v(raw.dengue_ns1_ag);
    sheet.getCell(`H41`).value = v(raw.dengue_igm);
    sheet.getCell(`H42`).value = v(raw.dengue_igg);
    sheet.getCell(`H45`).value = v(raw.b_hcg);
    sheet.getCell("C47").value = v(raw.remarks);
    sheet.getCell("A51").value = v(raw.performed);
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
