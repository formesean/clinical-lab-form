import { type FormType, Sex } from "@prisma/client";
import { NextResponse } from "next/server";
import { generateChemXlsmBuffer } from "@/lib/excel/chem-export";
import { toArrayBuffer } from "@/lib/to-array-buffer";

const UNIT = ["conv", "si"] as const;
type Unit = (typeof UNIT)[number];

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
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
    return NextResponse.json(
      { error: "Missing or invalid 'sex'. Must be MALE or FEMALE." },
      { status: 400 },
    );
  }
  if (!unit || !UNIT.includes(unit as Unit)) {
    return NextResponse.json(
      { error: "Missing or invalid 'unit'. Must be conv or si." },
      { status: 400 },
    );
  }
  if (!formType || typeof formType !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'formType'." },
      { status: 400 },
    );
  }
  if (formType !== "CHEM") {
    return NextResponse.json(
      { error: "Unsupported formType. Only CHEM is supported for now." },
      { status: 400 },
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
    console.error("Failed to generate XLSM:", err);
    return NextResponse.json(
      { error: "Failed to generate Excel file" },
      { status: 500 },
    );
  }

  return new NextResponse(toArrayBuffer(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
