import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import path from "path";
import { toArrayBuffer } from "@/lib/to-array-buffer";
import { FormType } from "@prisma/client";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const formType = raw.formType as FormType;

  if (!formType || typeof formType !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'formType'." },
      { status: 400 },
    );
  }

  const templateFilename = "UA MF.xlsx";
  const templatePath = path.join(
    process.cwd(),
    "src",
    "templates",
    templateFilename,
  );

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(templatePath);
  } catch (err) {
    console.error("Failed to read Excel template:", err);
    return NextResponse.json(
      { error: "Template file not found", template: templateFilename },
      { status: 500 },
    );
  }

  const sheet = workbook.worksheets[0];

  type CellValue = string | number | boolean | Date | null | undefined;
  const v = (x: unknown): CellValue => x as CellValue;
  if (formType === "SE") {
    sheet.getCell(`D27`).value = v(raw.color_result);
    sheet.getCell(`F27`).value = v(raw.color_id);
    sheet.getCell(`J27`).value = v(raw.color_remarks);
    sheet.getCell(`D28`).value = v(raw.consistency_result);
    sheet.getCell(`F28`).value = v(raw.consistency_id);
    sheet.getCell(`J28`).value = v(raw.consistency_remarks);
    sheet.getCell(`D29`).value = v(raw.pm_result);
    sheet.getCell(`F29`).value = v(raw.pm_id);
    sheet.getCell(`I29`).value = v(raw.pm_remarks);
    sheet.getCell(`D35`).value = v(raw.rbc_result);
    sheet.getCell(`G35`).value = v(raw.rbc_id);
    sheet.getCell(`J35`).value = v(raw.rbc_remarks);
    sheet.getCell(`D36`).value = v(raw.wbc_result);
    sheet.getCell(`G36`).value = v(raw.wbc_id);
    sheet.getCell(`J36`).value = v(raw.wbc_remarks);
    sheet.getCell(`D37`).value = v(raw.bacteria_result);
    sheet.getCell(`G37`).value = v(raw.bacteria_id);
    sheet.getCell(`J37`).value = v(raw.bacteria_remarks);
    sheet.getCell(`D38`).value = v(raw.yeast_result);
    sheet.getCell(`F38`).value = v(raw.yeast_id);
    sheet.getCell(`I38`).value = v(raw.yeast_remarks);
    sheet.getCell(`D39`).value = v(raw.parasite_result1);
    sheet.getCell(`F39`).value = v(raw.parasite_id1);
    sheet.getCell(`I39`).value = v(raw.parasite_remarks1);
    sheet.getCell(`D40`).value = v(raw.parasite_result2);
    sheet.getCell(`F40`).value = v(raw.parasite_id2);
    sheet.getCell(`I40`).value = v(raw.parasite_remarks2);
    sheet.getCell(`D41`).value = v(raw.others_result);
    sheet.getCell(`F41`).value = v(raw.others_id);
    sheet.getCell(`I41`).value = v(raw.others_remarks);
    sheet.getCell("C47").value = v(raw.remarks);
    sheet.getCell("A50").value = v(raw.performed);
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(toArrayBuffer(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${templateFilename}"`,
    },
  });
}
