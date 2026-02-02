import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import path from "path";
import { FormType, Sex } from "@prisma/client";

const UNIT = ["conv", "si"] as const;
type Unit = (typeof UNIT)[number];

function getTemplateFilename(formType: FormType, sex: Sex, unit: Unit): string {
  const sexLetter = sex === "MALE" ? "M" : "F";
  const unitLabel = unit === "si" ? "SI" : "Conv.";
  return `${formType} ${sexLetter} (${unitLabel}).xlsx`;
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
  const sex = raw.sex as string | undefined;
  const unit = raw.unit as string | undefined;
  const formType = raw.formType as FormType;

  if (!sex || !Sex) {
    return NextResponse.json(
      { error: "Missing or invalid 'sex'. Must be MALE or FEMALE." },
      { status: 400 }
    );
  }
  if (!unit || !UNIT.includes(unit as Unit)) {
    return NextResponse.json(
      { error: "Missing or invalid 'unit'. Must be conv or si." },
      { status: 400 }
    );
  }
  if (!formType || typeof formType !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'formType'." },
      { status: 400 }
    );
  }

  const templateFilename = getTemplateFilename(
    formType as FormType,
    sex as Sex,
    unit as Unit
  );
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

  // Common: sex (e.g. B6)
  sheet.getCell("B6").value = sex === "MALE" ? "M" : "F";

  // CHEM: data columns depend on unit (Conv. = D, SI = H)
  const dataCol = (unit as Unit) === "si" ? "H" : "D";
  type CellValue = string | number | boolean | Date | null | undefined;
  const v = (x: unknown): CellValue => (x as CellValue);
  if (formType === "CHEM") {
    sheet.getCell(`${dataCol}27`).value = v(raw.fbs);
    sheet.getCell(`${dataCol}28`).value = v(raw.rbs);
    sheet.getCell(`${dataCol}30`).value = v(raw.tc);
    sheet.getCell(`${dataCol}31`).value = v(raw.hdl);
    sheet.getCell(`${dataCol}32`).value = v(raw.ldl);
    sheet.getCell(`${dataCol}33`).value = v(raw.vldl);
    sheet.getCell(`${dataCol}34`).value = v(raw.triglycerdes);
    sheet.getCell(`${dataCol}35`).value = v(raw.creatinine);
    sheet.getCell(`${dataCol}36`).value = v(raw.bun);
    sheet.getCell(`${dataCol}37`).value = v(raw.bua);
    sheet.getCell(`${dataCol}38`).value = v(raw.sgpt_alt);
    sheet.getCell(`${dataCol}39`).value = v(raw.sgot_ast);
    sheet.getCell(`${dataCol}40`).value = v(raw.ttl_br);
    sheet.getCell(`${dataCol}41`).value = v(raw.dir_br);
    sheet.getCell(`${dataCol}42`).value = v(raw.ind_br);
    sheet.getCell(`${dataCol}43`).value = v(raw.gtt);
    sheet.getCell(`${dataCol}44`).value = v(raw.alp);
    sheet.getCell(`${dataCol}45`).value = v(raw.hba1c);
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
