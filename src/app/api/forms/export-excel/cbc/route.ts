import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import path from "path";
import { FormType, Sex } from "@prisma/client";

function getTemplateFilename(ageInYears: number, sex: Sex): string {
  if (ageInYears >= 18) {
    return sex === "FEMALE"
      ? "CBC F (18y and up).xlsx"
      : "CBC M (18y and up).xlsx";
  }
  if (ageInYears >= 12) return "CBC MF (12y-17y).xlsx";
  if (ageInYears >= 6) return "CBC MF (6y-11y).xlsx";
  if (ageInYears >= 2) return "CBC MF (2y-5y).xlsx";
  if (ageInYears >= 0.5) return "CBC MF (6m-1y).xlsx";
  if (ageInYears >= 2 / 12) return "CBC MF (2m-6m).xlsx";
  if (ageInYears >= 1 / 12) return "CBC MF (1m-2m).xlsx";
  if (ageInYears >= 1 / 52) return "CMC MF (1w-1m).xlsx";
  return "CBC MF (1w and below).xlsx";
}

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
  const formType = raw.formType as string | undefined;
  const age = raw.age as number | undefined;
  const sex = raw.sex as string | undefined;

  if (formType !== "CBC") {
    return NextResponse.json(
      { error: "This route is for CBC form type only." },
      { status: 400 }
    );
  }
  if (age == null || typeof age !== "number" || age < 0) {
    return NextResponse.json(
      { error: "Missing or invalid 'age'. Must be a non-negative number (age in years)." },
      { status: 400 }
    );
  }
  const sexVal: Sex = sex === "FEMALE" ? "FEMALE" : "MALE";

  const templateFilename = getTemplateFilename(age, sexVal);
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
  if (formType === "CBC") {
    sheet.getCell(`D26`).value = v(raw.wbc);
    sheet.getCell(`D27`).value = v(raw.rbc);
    sheet.getCell(`D28`).value = v(raw.hemoglobin);
    sheet.getCell(`D29`).value = v(raw.hemotocrit);
    sheet.getCell(`D30`).value = v(raw.mcv);
    sheet.getCell(`D31`).value = v(raw.mch);
    sheet.getCell(`D32`).value = v(raw.mchc);
    sheet.getCell(`D33`).value = v(raw.rdw);
    sheet.getCell(`D36`).value = v(raw.pc);
    sheet.getCell(`D37`).value = v(raw.mpv);
    sheet.getCell(`D42`).value = v(raw.neutrophil_rel);
    sheet.getCell(`H42`).value = v(raw.neutrophil_abs);
    sheet.getCell(`D43`).value = v(raw.lymphocyte_rel);
    sheet.getCell(`H43`).value = v(raw.lymphocyte_abs);
    sheet.getCell(`D44`).value = v(raw.monocyte_rel);
    sheet.getCell(`H44`).value = v(raw.monocyte_abs);
    sheet.getCell(`D45`).value = v(raw.eosinophil_rel);
    sheet.getCell(`H45`).value = v(raw.eosinophil_abs);
    sheet.getCell(`D46`).value = v(raw.basophil_rel);
    sheet.getCell(`H46`).value = v(raw.basophil_abs);
    sheet.getCell(`D47`).value = v(raw.ig_rel);
    sheet.getCell(`H47`).value = v(raw.ig_abs);
    sheet.getCell("C49").value = v(raw.remarks);
    sheet.getCell("A53").value = v(raw.performed);
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
