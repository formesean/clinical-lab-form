import { type FormType, Sex } from "@prisma/client";
import { generateChemXlsmBuffer } from "@/lib/excel/chem-export";
import { errorJson } from "@/lib/http";
import { convertXlsmToPdf, QuotaExhaustedException } from "@/lib/pdf-converter";
import { toArrayBuffer } from "@/lib/to-array-buffer";

export const maxDuration = 60;

const UNIT = ["conv", "si"] as const;
type Unit = (typeof UNIT)[number];

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorJson(400, "INVALID_JSON", "Invalid JSON body");
  }

  const raw = body as Record<string, unknown>;
  const sex = raw.sex as string | undefined;
  const unit = raw.unit as string | undefined;
  const formType = raw.formType as FormType | undefined;
  const data =
    raw.data && typeof raw.data === "object"
      ? (raw.data as Record<string, unknown>)
      : {};

  if (!sex || !Object.values(Sex).includes(sex as Sex)) {
    return errorJson(
      400,
      "INVALID_SEX",
      "Missing or invalid 'sex'. Must be MALE or FEMALE.",
    );
  }
  if (!unit || !UNIT.includes(unit as Unit)) {
    return errorJson(
      400,
      "INVALID_UNIT",
      "Missing or invalid 'unit'. Must be conv or si.",
    );
  }
  if (!formType || typeof formType !== "string") {
    return errorJson(
      400,
      "INVALID_FORM_TYPE",
      "Missing or invalid 'formType'.",
    );
  }
  if (formType !== "CHEM") {
    return errorJson(
      400,
      "UNSUPPORTED_FORM_TYPE",
      "Unsupported formType. Only CHEM is supported for now.",
    );
  }

  let buffer: Buffer;
  let filename: string;
  try {
    ({ buffer, filename } = await generateChemXlsmBuffer({
      sex: sex as Sex,
      unit: unit as Unit,
      formType,
      data,
    }));
  } catch (err) {
    console.error("XLSM generation failed:", err);
    return errorJson(
      500,
      "XLSM_GENERATION_FAILED",
      "Failed to generate Excel file",
    );
  }

  const pdfFilename = filename.replace(/\.(xlsx|xlsm)$/i, ".pdf");

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await convertXlsmToPdf(buffer, filename);
  } catch (err) {
    if (err instanceof QuotaExhaustedException) {
      return errorJson(
        503,
        "QUOTA_EXHAUSTED",
        "PDF conversion quota exhausted. Please try again later.",
      );
    }
    console.error("PDF conversion failed:", err);
    return errorJson(500, "PDF_CONVERSION_FAILED", "Failed to convert to PDF");
  }

  return new Response(toArrayBuffer(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFilename}"`,
    },
  });
}
