import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FormType, Sex } from "@prisma/client";
import JSZip from "jszip";

export type ChemExportInput = {
  sex: Sex;
  unit: "conv" | "si";
  formType: FormType;
  data: Record<string, unknown>;
};

export type ChemExportResult = {
  buffer: Buffer;
  filename: string;
};

export async function generateChemXlsmBuffer(
  input: ChemExportInput,
): Promise<ChemExportResult> {
  const { sex, unit, data } = input;
  const templateFilename = getTemplateFilename(sex, unit);
  const templatePath = path.join(
    process.cwd(),
    "src",
    "templates",
    "FORM_TEMPLATES.xlsm",
  );

  const templateBuffer = await readFile(templatePath);

  const sheetName = getSheetName(sex, unit);
  const zip = await JSZip.loadAsync(templateBuffer);

  let workbookXml = await readZipText(zip, "xl/workbook.xml");
  const workbookRelsXml = await readZipText(zip, "xl/_rels/workbook.xml.rels");
  const workbookSheets = parseWorkbookSheets(workbookXml);
  const targetSheet = workbookSheets.find((sheet) => sheet.name === sheetName);
  if (!targetSheet) {
    throw new Error(`Worksheet not found: ${sheetName}`);
  }

  const workbookRels = parseRelationships(workbookRelsXml);
  const worksheetRels = workbookRels.filter((rel) =>
    rel.type.includes("/worksheet"),
  );
  const targetRel = worksheetRels.find((rel) => rel.id === targetSheet.rId);
  if (!targetRel) {
    throw new Error(`Worksheet relationship not found: ${sheetName}`);
  }

  const sheetPath = normalizeZipPath(`xl/${targetRel.target}`);

  let sheetXml = await readZipText(zip, sheetPath);
  let sharedStringsXml = await readZipText(zip, "xl/sharedStrings.xml");
  const sharedStrings = parseSharedStrings(sharedStringsXml);

  const cellUpdates = new Map<string, CellValue>();
  cellUpdates.set("B6", sex === "MALE" ? "M" : "F");

  const dataCol = unit === "si" ? "H" : "D";
  const v = (x: unknown): CellValue => x as CellValue;
  const val = (cuKey: string, suKey: string) =>
    v(unit === "si" ? data[suKey] : data[cuKey]);

  cellUpdates.set("A12", v(data["chem.labIdNum"]));
  cellUpdates.set("D12", v(data["patient.patientIdNum"]));
  cellUpdates.set("G12", v(data["chem.dateOfReq"]));
  cellUpdates.set("J12", v(data["chem.timeOfReq"]));
  cellUpdates.set("A14", v(data["patient.lastName"]));
  cellUpdates.set("E14", v(data["patient.firstName"]));
  cellUpdates.set("I14", v(data["patient.middleName"]));
  cellUpdates.set("A18", v(data["patient.dateOfBirth"]));
  cellUpdates.set("D18", v(data["patient.age"]));
  cellUpdates.set(
    "F18",
    v(data["patient.sex"] ?? (sex === "MALE" ? "MALE" : "FEMALE")),
  );
  cellUpdates.set("H18", v(data["patient.requestingPhysician"]));
  cellUpdates.set("A20", v(data["chem.datePerf"]));
  cellUpdates.set("D20", v(data["chem.timePerf"]));
  cellUpdates.set("F20", v(data["chem.dateRel"]));
  cellUpdates.set("H20", v(data["chem.timeRel"]));
  cellUpdates.set("J20", v(data["chem.location"]));

  cellUpdates.set(`${dataCol}27`, val("chem.fbs_CU_val", "chem.fbs_SU_val"));
  cellUpdates.set(`${dataCol}28`, val("chem.rbs_CU_val", "chem.rbs_SU_val"));
  cellUpdates.set(`${dataCol}30`, val("chem.tc_CU_val", "chem.tc_SU_val"));
  cellUpdates.set(`${dataCol}31`, val("chem.hdl_CU_val", "chem.hdl_SU_val"));
  cellUpdates.set(`${dataCol}32`, val("chem._ldl_CU_val", "chem.ldl_SU_val"));
  cellUpdates.set(`${dataCol}33`, val("chem.vldl_CU_val", "chem.vldl_SU_val"));
  cellUpdates.set(`${dataCol}34`, val("chem.tri_val", "chem.tri_SU_val"));
  cellUpdates.set(`${dataCol}35`, val("chem.crea_CU_val", "chem.crea_SU_val"));
  cellUpdates.set(`${dataCol}36`, val("chem.bun_CU_val", "chem.bun_SU_val"));
  cellUpdates.set(`${dataCol}37`, val("chem.bua_CU_val", "chem.bua_SU_val"));
  cellUpdates.set(`${dataCol}38`, val("chem.sgpt_CU_val", "chem.sgpt_SU_val"));
  cellUpdates.set(`${dataCol}39`, val("chem.sgot_CU_val", "chem.sgot_SU_val"));
  cellUpdates.set(`${dataCol}40`, val("chem.tb_CU_val", "chem.tb_SU_val"));
  cellUpdates.set(`${dataCol}41`, val("chem.db_CU_val", "chem.db_SU_val"));
  cellUpdates.set(`${dataCol}42`, val("chem.ib_CU_val", "chem.ib_SU_val"));
  cellUpdates.set(`${dataCol}43`, val("chem.ggt_CU_val", "chem.ggt_SU_val"));
  cellUpdates.set(`${dataCol}44`, val("chem.alp_CU_val", "chem.alp_SU_val"));
  cellUpdates.set(
    `${dataCol}45`,
    val("chem.hba1c_CU_val", "chem.hba1c_SU_val"),
  );
  cellUpdates.set("C47", v(data["chem.remarks"]));
  cellUpdates.set("A51", v(data["chem.perfByName"]));

  for (const [cellRef, cellValue] of cellUpdates) {
    const normalized = normalizeCellValue(cellValue, sharedStrings);
    sheetXml = setCellValue(sheetXml, cellRef, normalized);
  }

  if (sharedStrings.pending.length > 0) {
    sharedStringsXml = appendSharedStrings(sharedStringsXml, sharedStrings);
  }

  workbookXml = updateWorkbookXml(workbookXml, targetSheet);
  const updatedWorkbookRelsXml = filterWorkbookRelationships(
    workbookRelsXml,
    targetSheet.rId,
  );
  const removedSheetParts = worksheetRels
    .filter((rel) => rel.id !== targetSheet.rId)
    .map((rel) => normalizeZipPath(`xl/${rel.target}`));
  const removedPartSet = new Set<string>(
    removedSheetParts.map((part) => `/${part}`),
  );
  removedPartSet.add("/xl/calcChain.xml");

  const contentTypesXml = await readZipText(zip, "[Content_Types].xml");
  const updatedContentTypesXml = filterContentTypes(
    contentTypesXml,
    removedPartSet,
  );

  for (const removed of removedSheetParts) {
    zip.remove(removed);
    const relsPath = `xl/worksheets/_rels/${path.basename(removed)}.rels`;
    zip.remove(relsPath);
  }
  zip.remove("xl/calcChain.xml");

  zip.file(sheetPath, sheetXml);
  zip.file("xl/sharedStrings.xml", sharedStringsXml);
  zip.file("xl/workbook.xml", workbookXml);
  zip.file("xl/_rels/workbook.xml.rels", updatedWorkbookRelsXml);
  zip.file(
    "[Content_Types].xml",
    normalizeContentTypesForXlsx(updatedContentTypesXml),
  );

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return { buffer, filename: templateFilename };
}

function getTemplateFilename(sex: Sex, unit: "conv" | "si"): string {
  const sexLetter = sex === "MALE" ? "M" : "F";
  const unitLabel = unit === "si" ? "SI" : "Conv";
  return `CHEM_${sexLetter}_${unitLabel}.xlsx`;
}

function normalizeContentTypesForXlsx(contentTypesXml: string): string {
  return contentTypesXml.replace(
    "application/vnd.ms-excel.sheet.macroEnabled.main+xml",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml",
  );
}

function getSheetName(sex: Sex, unit: "conv" | "si"): string {
  const sexLetter = sex === "MALE" ? "M" : "F";
  const unitLabel = unit === "si" ? "SI" : "Conv.";
  return `CHEM ${sexLetter} (${unitLabel})`;
}

type CellValue = string | number | boolean | Date | null | undefined;

type SharedStringsState = {
  count: number;
  uniqueCount: number;
  indexByText: Map<string, number>;
  pending: string[];
};

type NormalizedCellValue =
  | { kind: "empty" }
  | { kind: "number"; value: number }
  | { kind: "boolean"; value: boolean }
  | { kind: "string"; value: string; sharedIndex: number };

async function readZipText(zip: JSZip, pathName: string): Promise<string> {
  const entry = zip.file(pathName);
  if (!entry) {
    throw new Error(`Missing template part: ${pathName}`);
  }
  return entry.async("string");
}

type WorkbookSheet = {
  name: string;
  rId: string;
  sheetId: string;
  raw: string;
  index: number;
};

type RelationshipInfo = {
  id: string;
  type: string;
  target: string;
  raw: string;
};

function parseWorkbookSheets(workbookXml: string): WorkbookSheet[] {
  const sheetRegex = /<sheet\b[^>]*\/?>/g;
  let match: RegExpExecArray | null;
  const sheets: WorkbookSheet[] = [];
  let index = 0;
  match = sheetRegex.exec(workbookXml);
  while (match) {
    const raw = match[0];
    const attrs = parseXmlAttributes(raw);
    const name = decodeXml(attrs.get("name") ?? "");
    const rId = attrs.get("r:id") ?? "";
    const sheetId = attrs.get("sheetId") ?? "";
    sheets.push({ name, rId, sheetId, raw, index });
    index += 1;
    match = sheetRegex.exec(workbookXml);
  }
  return sheets;
}

function updateWorkbookXml(workbookXml: string, sheet: WorkbookSheet): string {
  let updated = workbookXml.replace(
    /<sheets>[\s\S]*?<\/sheets>/,
    `<sheets>${sheet.raw}</sheets>`,
  );
  updated = updated.replace(/activeTab="\\d+"/, 'activeTab="0"');
  updated = updateDefinedNames(updated, sheet);
  return updated;
}

function updateDefinedNames(workbookXml: string, sheet: WorkbookSheet): string {
  const match = workbookXml.match(/<definedNames>([\s\S]*?)<\/definedNames>/);
  if (!match) {
    return workbookXml;
  }
  const block = match[0];
  const inner = match[1];
  const defRegex = /<definedName\b[^>]*>[\s\S]*?<\/definedName>/g;
  let defMatch: RegExpExecArray | null;
  const kept: string[] = [];
  defMatch = defRegex.exec(inner);
  while (defMatch) {
    const def = defMatch[0];
    const localMatch = def.match(/localSheetId="(\d+)"/);
    if (localMatch) {
      const localId = Number.parseInt(localMatch[1], 10);
      if (localId === sheet.index) {
        kept.push(def.replace(/localSheetId="(\d+)"/, 'localSheetId="0"'));
      }
      defMatch = defRegex.exec(inner);
      continue;
    }
    if (def.includes(`'${sheet.name}'!`) || def.includes(`${sheet.name}!`)) {
      kept.push(def);
    }
    defMatch = defRegex.exec(inner);
  }
  if (kept.length === 0) {
    return workbookXml.replace(block, "");
  }
  const updatedBlock = `<definedNames>${kept.join("")}</definedNames>`;
  return workbookXml.replace(block, updatedBlock);
}

function parseRelationships(relXml: string): RelationshipInfo[] {
  const relRegex = /<Relationship\b[^>]*\/?>/g;
  let match: RegExpExecArray | null;
  const rels: RelationshipInfo[] = [];
  match = relRegex.exec(relXml);
  while (match) {
    const raw = match[0];
    const attrs = parseXmlAttributes(raw);
    const id = attrs.get("Id") ?? "";
    const type = attrs.get("Type") ?? "";
    const target = attrs.get("Target") ?? "";
    rels.push({ id, type, target, raw });
    match = relRegex.exec(relXml);
  }
  return rels;
}

function filterWorkbookRelationships(
  relXml: string,
  keepWorksheetId: string,
): string {
  const startTagMatch = relXml.match(/<Relationships[^>]*>/);
  const startTag = startTagMatch
    ? startTagMatch[0]
    : '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
  const rels = parseRelationships(relXml);
  const kept = rels.filter((rel) => {
    if (rel.type.includes("/worksheet")) {
      return rel.id === keepWorksheetId;
    }
    if (rel.type.includes("/calcChain")) {
      return false;
    }
    return true;
  });
  return `${startTag}${kept.map((rel) => rel.raw).join("")}</Relationships>`;
}

function filterContentTypes(
  contentTypesXml: string,
  removedParts: Set<string>,
): string {
  const startTagMatch = contentTypesXml.match(/<Types[^>]*>/);
  const startTag = startTagMatch
    ? startTagMatch[0]
    : '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">';
  const overrideRegex = /<Override\b[^>]*\/?>/g;
  let match: RegExpExecArray | null;
  const overrides: string[] = [];
  match = overrideRegex.exec(contentTypesXml);
  while (match) {
    let raw = match[0];
    const attrs = parseXmlAttributes(raw);
    const partName = attrs.get("PartName") ?? "";
    if (partName && removedParts.has(partName)) {
      match = overrideRegex.exec(contentTypesXml);
      continue;
    }
    if (partName === "/xl/workbook.xml") {
      raw = raw.replace(
        "application/vnd.ms-excel.sheet.macroEnabled.main+xml",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml",
      );
    }
    overrides.push(raw);
    match = overrideRegex.exec(contentTypesXml);
  }
  const defaults = contentTypesXml.match(/<Default\b[^>]*\/?>/g) ?? [];
  return `${startTag}${defaults.join("")}${overrides.join("")}</Types>`;
}

function parseXmlAttributes(tag: string): Map<string, string> {
  const attrs = new Map<string, string>();
  const attrRegex = /([a-zA-Z:]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  match = attrRegex.exec(tag);
  while (match) {
    attrs.set(match[1], match[2]);
    match = attrRegex.exec(tag);
  }
  return attrs;
}

function parseSharedStrings(sharedStringsXml: string): SharedStringsState {
  const countMatch = sharedStringsXml.match(/count="(\d+)"/);
  const uniqueMatch = sharedStringsXml.match(/uniqueCount="(\d+)"/);
  const siCount = (sharedStringsXml.match(/<si>/g) ?? []).length;
  const uniqueCount = uniqueMatch
    ? Number.parseInt(uniqueMatch[1], 10)
    : siCount;
  const count = countMatch ? Number.parseInt(countMatch[1], 10) : uniqueCount;
  const indexByText = new Map<string, number>();

  const siRegex = /<si>([\s\S]*?)<\/si>/g;
  let match: RegExpExecArray | null;
  let index = 0;
  match = siRegex.exec(sharedStringsXml);
  while (match) {
    const si = match[1];
    const isRich = /<r[ >]/.test(si);
    const text = extractSharedStringText(si);
    if (!isRich && !indexByText.has(text)) {
      indexByText.set(text, index);
    }
    index += 1;
    match = siRegex.exec(sharedStringsXml);
  }

  return { count, uniqueCount, indexByText, pending: [] };
}

function extractSharedStringText(sharedStringXml: string): string {
  const tRegex = /<t(?: [^>]*)?>([\s\S]*?)<\/t>/g;
  let match: RegExpExecArray | null;
  let text = "";
  match = tRegex.exec(sharedStringXml);
  while (match) {
    text += decodeXml(match[1]);
    match = tRegex.exec(sharedStringXml);
  }
  return text;
}

function normalizeCellValue(
  value: CellValue,
  sharedStrings: SharedStringsState,
): NormalizedCellValue {
  if (value === null || value === undefined || value === "") {
    return { kind: "empty" };
  }
  if (value instanceof Date) {
    const excelSerial = dateToExcelSerial(value);
    return { kind: "number", value: excelSerial };
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return { kind: "number", value };
  }
  if (typeof value === "boolean") {
    return { kind: "boolean", value };
  }
  const text = String(value);
  const existing = sharedStrings.indexByText.get(text);
  if (existing !== undefined) {
    return { kind: "string", value: text, sharedIndex: existing };
  }
  const newIndex = sharedStrings.uniqueCount + sharedStrings.pending.length;
  sharedStrings.pending.push(text);
  sharedStrings.indexByText.set(text, newIndex);
  return { kind: "string", value: text, sharedIndex: newIndex };
}

function appendSharedStrings(
  sharedStringsXml: string,
  sharedStrings: SharedStringsState,
): string {
  const insertPos = sharedStringsXml.lastIndexOf("</sst>");
  if (insertPos === -1) {
    return sharedStringsXml;
  }
  const additions = sharedStrings.pending
    .map((text) => buildSharedStringEntry(text))
    .join("");
  const nextUnique = sharedStrings.uniqueCount + sharedStrings.pending.length;
  const nextCount = Math.max(sharedStrings.count, nextUnique);
  let updated = `${sharedStringsXml.slice(0, insertPos)}${additions}${sharedStringsXml.slice(insertPos)}`;
  if (sharedStringsXml.includes('count="')) {
    updated = updated.replace(/count="(\d+)"/, `count="${nextCount}"`);
  }
  if (sharedStringsXml.includes('uniqueCount="')) {
    updated = updated.replace(
      /uniqueCount="(\d+)"/,
      `uniqueCount="${nextUnique}"`,
    );
  }
  return updated;
}

function buildSharedStringEntry(text: string): string {
  const escaped = encodeXml(text);
  const needsPreserve =
    /^\s|\s$/.test(text) ||
    text.includes("\n") ||
    text.includes("\t") ||
    / {2,}/.test(text);
  const preserveAttr = needsPreserve ? ' xml:space="preserve"' : "";
  return `<si><t${preserveAttr}>${escaped}</t></si>`;
}

function setCellValue(
  sheetXml: string,
  cellRef: string,
  value: NormalizedCellValue,
): string {
  const cellRange = findCellRange(sheetXml, cellRef);
  const cellXml = buildCellXml(cellRange?.openTag, cellRef, value);
  if (cellRange) {
    return `${sheetXml.slice(0, cellRange.start)}${cellXml}${sheetXml.slice(cellRange.end)}`;
  }
  return insertCell(sheetXml, cellRef, cellXml);
}

function buildCellXml(
  openTag: string | null | undefined,
  cellRef: string,
  value: NormalizedCellValue,
): string {
  const attrs = parseCellAttributes(openTag);
  attrs.set("r", cellRef);
  attrs.delete("t");

  if (value.kind === "string") {
    attrs.set("t", "s");
  } else if (value.kind === "boolean") {
    attrs.set("t", "b");
  }

  const attrString = buildAttributesString(attrs);
  if (value.kind === "empty") {
    return `<c${attrString}/>`;
  }

  const v =
    value.kind === "string"
      ? String(value.sharedIndex)
      : value.kind === "boolean"
        ? value.value
          ? "1"
          : "0"
        : String(value.value);
  return `<c${attrString}><v>${v}</v></c>`;
}

function findCellRange(
  sheetXml: string,
  cellRef: string,
): { start: number; end: number; openTag: string } | null {
  const refIndex = sheetXml.indexOf(`r="${cellRef}"`);
  if (refIndex === -1) {
    return null;
  }
  const start = sheetXml.lastIndexOf("<c", refIndex);
  if (start === -1) {
    return null;
  }
  const openEnd = sheetXml.indexOf(">", start);
  if (openEnd === -1) {
    return null;
  }
  const openTag = sheetXml.slice(start, openEnd + 1);
  const selfClose = openTag.endsWith("/>");
  if (selfClose) {
    return { start, end: openEnd + 1, openTag };
  }
  const closeTag = sheetXml.indexOf("</c>", openEnd);
  if (closeTag === -1) {
    return null;
  }
  return { start, end: closeTag + 4, openTag };
}

function insertCell(
  sheetXml: string,
  cellRef: string,
  cellXml: string,
): string {
  const { row } = splitCellRef(cellRef);
  const rowRegex = new RegExp(`<row[^>]* r="${row}"[^>]*>[\\s\\S]*?</row>`);
  const rowMatch = rowRegex.exec(sheetXml);
  if (!rowMatch || rowMatch.index === undefined) {
    const sheetDataEnd = sheetXml.indexOf("</sheetData>");
    if (sheetDataEnd === -1) {
      return sheetXml;
    }
    const newRow = `<row r="${row}">${cellXml}</row>`;
    return `${sheetXml.slice(0, sheetDataEnd)}${newRow}${sheetXml.slice(sheetDataEnd)}`;
  }

  const rowXml = rowMatch[0];
  const updatedRowXml = insertCellIntoRow(rowXml, cellRef, cellXml);
  return `${sheetXml.slice(0, rowMatch.index)}${updatedRowXml}${sheetXml.slice(
    rowMatch.index + rowXml.length,
  )}`;
}

function insertCellIntoRow(
  rowXml: string,
  cellRef: string,
  cellXml: string,
): string {
  const { col } = splitCellRef(cellRef);
  const targetCol = columnToNumber(col);
  const cellRegex = /<c[^>]* r="([A-Z]+)\d+"[^>]*(?:\/>|>[\s\S]*?<\/c>)/g;
  let match: RegExpExecArray | null;
  let insertPos = rowXml.lastIndexOf("</row>");
  match = cellRegex.exec(rowXml);
  while (match) {
    const currentCol = columnToNumber(match[1]);
    if (currentCol > targetCol) {
      insertPos = match.index;
      break;
    }
    match = cellRegex.exec(rowXml);
  }
  return `${rowXml.slice(0, insertPos)}${cellXml}${rowXml.slice(insertPos)}`;
}

function parseCellAttributes(openTag?: string | null): Map<string, string> {
  if (!openTag) {
    return new Map<string, string>();
  }
  return parseXmlAttributes(openTag);
}

function buildAttributesString(attrs: Map<string, string>): string {
  if (attrs.size === 0) {
    return "";
  }
  const parts: string[] = [];
  for (const [key, value] of attrs) {
    parts.push(`${key}="${value}"`);
  }
  return ` ${parts.join(" ")}`;
}

function splitCellRef(cellRef: string): { col: string; row: number } {
  const match = /^([A-Z]+)(\d+)$/.exec(cellRef);
  if (!match) {
    return { col: cellRef, row: 0 };
  }
  return { col: match[1], row: Number.parseInt(match[2], 10) };
}

function columnToNumber(col: string): number {
  let num = 0;
  for (let i = 0; i < col.length; i += 1) {
    num = num * 26 + (col.charCodeAt(i) - 64);
  }
  return num;
}

function dateToExcelSerial(date: Date): number {
  const excelEpoch = Date.UTC(1899, 11, 30);
  return (date.getTime() - excelEpoch) / (24 * 60 * 60 * 1000);
}

function decodeXml(text: string): string {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function encodeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normalizeZipPath(pathName: string): string {
  return pathName.replace(/\\/g, "/").replace(/^\/+/, "");
}
