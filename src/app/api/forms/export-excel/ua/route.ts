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
  if (formType === "UA") {
    sheet.getCell(`D26`).value = v(raw.color_id);
    sheet.getCell(`F26`).value = v(raw.color_result);
    sheet.getCell(`D27`).value = v(raw.clarity_id);
    sheet.getCell(`F27`).value = v(raw.clarity_result);
    sheet.getCell(`D29`).value = v(raw.leukocytes_id);
    sheet.getCell(`F29`).value = v(raw.leukocytes_result);
    sheet.getCell(`D30`).value = v(raw.nitrite_id);
    sheet.getCell(`F30`).value = v(raw.nitrite_result);
    sheet.getCell(`D31`).value = v(raw.urobilinogen_id);
    sheet.getCell(`F31`).value = v(raw.urobilinogen_result);
    sheet.getCell(`D32`).value = v(raw.protein_id);
    sheet.getCell(`F32`).value = v(raw.protein_result);
    sheet.getCell(`D33`).value = v(raw.ph_id);
    sheet.getCell(`F33`).value = v(raw.ph_result);
    sheet.getCell(`D34`).value = v(raw.blood_id);
    sheet.getCell(`F34`).value = v(raw.blood_result);
    sheet.getCell(`D35`).value = v(raw.spec_grav_id);
    sheet.getCell(`F35`).value = v(raw.spec_grav_result);
    sheet.getCell(`D36`).value = v(raw.ketones_id);
    sheet.getCell(`F36`).value = v(raw.ketones_result);
    sheet.getCell(`D37`).value = v(raw.bilirubin_id);
    sheet.getCell(`F37`).value = v(raw.bilirubin_result);
    sheet.getCell(`D38`).value = v(raw.glucose_id);
    sheet.getCell(`F38`).value = v(raw.glucose_result);
    sheet.getCell(`D40`).value = v(raw.wbc_ic);
    sheet.getCell(`F40`).value = v(raw.wbc_result);
    sheet.getCell(`D41`).value = v(raw.rbc_id);
    sheet.getCell(`F41`).value = v(raw.rbc_result);
    sheet.getCell(`D42`).value = v(raw.epithelial_cells_id);
    sheet.getCell(`F42`).value = v(raw.epithelial_cells_res);
    sheet.getCell(`D43`).value = v(raw.mucus_threads_id);
    sheet.getCell(`F43`).value = v(raw.mucus_threads_result);
    sheet.getCell(`D44`).value = v(raw.cast_id);
    sheet.getCell(`F44`).value = v(raw.cast_result);
    sheet.getCell(`D45`).value = v(raw.bacteria_id);
    sheet.getCell(`F45`).value = v(raw.bacteria_result);
    sheet.getCell(`D46`).value = v(raw.yeast_id);
    sheet.getCell(`F46`).value = v(raw.yeast_res);
    sheet.getCell(`D47`).value = v(raw.parasite_id);
    sheet.getCell(`F47`).value = v(raw.parasite_res);
    sheet.getCell(`C48`).value = v(raw.crystal_id1);
    sheet.getCell(`C49`).value = v(raw.crystal_id2);
    sheet.getCell(`F48`).value = v(raw.crystal_res1);
    sheet.getCell(`F49`).value = v(raw.crystal_res2);
    sheet.getCell(`D50`).value = v(raw.others_id);
    sheet.getCell(`F50`).value = v(raw.others_res);
    sheet.getCell("C52").value = v(raw.remarks);
    sheet.getCell("A56").value = v(raw.performed);
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
