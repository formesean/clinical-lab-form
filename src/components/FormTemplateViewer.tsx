"use client";

import { FieldOverlay } from "@/components/FieldOverlay";
import type { Sex } from "@prisma/client";
import { useEffect, useRef, useState } from "react";

// Fixed scale - MUST match the mapper's PDF_SCALE exactly
const PDF_SCALE = 1.25;

// Matches fieldmap JSON produced by admin mapper
type Fieldmap = {
  kind: "pdf" | "image";
  meta: {
    pageCount: number;
    pages: Array<{ page: number; width: number; height: number }>;
    scale?: number;
  };
  fields: Array<{
    key: string;
    page: number;
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
    xPx?: number;
    yPx?: number;
    wPx?: number;
    hPx?: number;
    label?: string;
    inputType?: "number" | "text" | "combobox";
    comboboxItems?: string[];
  }>;
};

type Props = {
  formType: string;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  isEditable?: boolean;
  patientSex?: Sex | null;
  patientDateOfBirth?: string | null;
  patientCreatedAt?: string | null;
  patientAgeYears?: number | null;
  chemUnitMode?: "CU" | "SI";
};

type PatientContext = {
  sex?: Sex | null;
  dateOfBirth?: string | null;
  createdAt?: string | null;
  ageYears?: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getAgeParts = (dob: Date, asOf: Date) => {
  const days = Math.floor((asOf.getTime() - dob.getTime()) / DAY_MS);
  let months = (asOf.getFullYear() - dob.getFullYear()) * 12 + (asOf.getMonth() - dob.getMonth());
  if (asOf.getDate() < dob.getDate()) months -= 1;
  let years = asOf.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    asOf.getMonth() < dob.getMonth() ||
    (asOf.getMonth() === dob.getMonth() && asOf.getDate() < dob.getDate());
  if (beforeBirthday) years -= 1;
  return { days, months, years };
};

const resolveCbcTemplate = (ctx: PatientContext) => {
  const dob = parseDate(ctx.dateOfBirth);
  const asOf = parseDate(ctx.createdAt) ?? new Date();
  if (dob) {
    const { days, months, years } = getAgeParts(dob, asOf);
    if (years >= 18) {
      if (ctx.sex === "MALE") return "CBC_M_18y-equal_above";
      if (ctx.sex === "FEMALE") return "CBC_F_18y-equal_above";
      return "CBC";
    }
    if (days <= 7) return "CBC_MF_1w-equal_less";
    if (months < 1) return "CBC_MF_1w-1m";
    if (months < 2) return "CBC_MF_1m-2m";
    if (months < 6) return "CBC_MF_2m-6m";
    if (months < 12) return "CBC_MF_6m-1y";
    if (years < 2) return "CBC_MF_2y-5y";
    if (years <= 5) return "CBC_MF_2y-5y";
    if (years <= 11) return "CBC_MF_6y-11y";
    if (years <= 17) return "CBC_MF_12y-17y";
    return "CBC";
  }

  const ageYears = ctx.ageYears ?? null;
  if (ageYears === null || Number.isNaN(ageYears)) return "CBC";
  if (ageYears >= 18) {
    if (ctx.sex === "MALE") return "CBC_M_18y-equal_above";
    if (ctx.sex === "FEMALE") return "CBC_F_18y-equal_above";
    return "CBC";
  }
  if (ageYears >= 12) return "CBC_MF_12y-17y";
  if (ageYears >= 6) return "CBC_MF_6y-11y";
  if (ageYears >= 2) return "CBC_MF_2y-5y";
  if (ageYears >= 1) return "CBC_MF_6m-1y";
  return "CBC_MF_1w-1m";
};

const resolveTemplateName = (formType: string, ctx: PatientContext) => {
  const base = formType.trim().toUpperCase();
  switch (base) {
    case "CHEM":
      if (ctx.sex === "MALE") return "CHEM_M";
      if (ctx.sex === "FEMALE") return "CHEM_F";
      return "CHEM";
    case "CBC":
      return resolveCbcTemplate(ctx);
    case "OGTT":
      return "OGTT";
    case "BT":
      return "BT_MF";
    case "IMMUNO":
      return "IMMUNO_MF";
    case "MICRO":
      return "MICRO_MF";
    case "OBT":
      return "OBT_MF";
    case "SE":
      return "SE_MF";
    case "UA":
      return "UA_MF";
    case "PT":
      return "PT";
    default:
      return base;
  }
};

/**
 * Loads and renders a form PDF with its fieldmap overlay for a given form type.
 * Fetches /api/templates/{formType}.pdf and /filemaps/{formType}.fieldmap.json.
 */
export function FormTemplateViewer({
  formType,
  values,
  onChange,
  isEditable = true,
  patientSex,
  patientDateOfBirth,
  patientCreatedAt,
  patientAgeYears,
  chemUnitMode,
}: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fieldmap, setFieldmap] = useState<Fieldmap | null>(null);
  const pdfUrlRef = useRef<string | null>(null);

  const [pdfjs, setPdfjs] = useState<any>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [canvasBufferSize, setCanvasBufferSize] = useState({ w: 0, h: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load pdf.js lazily (same as mapper)
  useEffect(() => {
    let mounted = true;
    (async () => {
      // @ts-expect-error - pdfjs-dist build path has no type declarations
      const mod = await import("pdfjs-dist/build/pdf");
      mod.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      if (mounted) setPdfjs(mod);
    })().catch(console.error);
    return () => { mounted = false; };
  }, []);

  const templateName = resolveTemplateName(formType, {
    sex: patientSex,
    dateOfBirth: patientDateOfBirth,
    createdAt: patientCreatedAt,
    ageYears: patientAgeYears,
  });

  // Load PDF and fieldmap for this form type
  useEffect(() => {
    if (!formType?.trim()) {
      setPdfUrl(null);
      setFieldmap(null);
      setPdfDoc(null);
      setPageCount(0);
      setPage(1);
      setCanvasBufferSize({ w: 0, h: 0 });
      return;
    }
    const type = formType.trim().toUpperCase();
    const templateKey = templateName.trim().toUpperCase();
    let cancelled = false;
    (async () => {
      const [pdfRes, fieldmapRes] = await Promise.all([
        fetch(`/api/templates/${templateKey}.pdf`),
        fetch(`/filemaps/${type}.fieldmap.json`),
      ]);
      if (cancelled) return;
      if (pdfRes.ok) {
        const blob = await pdfRes.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        pdfUrlRef.current = url;
        setPdfUrl(url);
      }
      if (fieldmapRes.ok) {
        const data = (await fieldmapRes.json()) as Fieldmap;
        if (!cancelled) setFieldmap(data);
      }
    })();
    return () => {
      cancelled = true;
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = null;
      }
    };
  }, [formType, templateName]);

  // Load PDF document from blob URL
  useEffect(() => {
    if (!pdfjs || !pdfUrl) return;
    let cancelled = false;
    (async () => {
      const task = pdfjs.getDocument(pdfUrl);
      const doc = await task.promise;
      if (cancelled) return;
      setPdfDoc(doc);
      setPageCount(doc.numPages);
      setPage(1);
    })().catch(console.error);
    return () => { cancelled = true; };
  }, [pdfjs, pdfUrl]);

  // Render PDF page to canvas (same as mapper)
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      const p = await pdfDoc.getPage(page);
      if (cancelled) return;
      const viewport = p.getViewport({ scale: PDF_SCALE });
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = Math.floor(viewport.width);
      const h = Math.floor(viewport.height);
      canvas.width = w;
      canvas.height = h;
      if (!cancelled) setCanvasBufferSize({ w, h });
      const renderTask = p.render({ canvasContext: ctx, viewport });
      await renderTask.promise;
    })().catch(console.error);
    return () => { cancelled = true; };
  }, [pdfDoc, page]);

  if (!formType?.trim()) {
    return (
      <div className="text-muted-foreground">Select a form type.</div>
    );
  }

  if (!pdfUrl && !pdfDoc) {
    return (
      <div className="text-muted-foreground">
        Loading {formType}.pdf and fieldmap...
      </div>
    );
  }

  if (!pdfDoc) {
    return null;
  }

  return (
    <div className="p-0">
      <div className="border border-[#DDEAE3]">
        <div
          className="relative"
          style={{
            width: `${canvasBufferSize.w}px`,
            height: `${canvasBufferSize.h}px`,
          }}
        >
          <canvas
            ref={canvasRef}
            className="block align-top"
            style={{
              width: `${canvasBufferSize.w}px`,
              height: `${canvasBufferSize.h}px`,
              display: "block",
            }}
          />
          {fieldmap &&
            canvasBufferSize.w > 0 &&
            canvasBufferSize.h > 0 && (
              <FieldOverlay
                map={fieldmap}
                page={page}
                pageWidth={canvasBufferSize.w}
                pageHeight={canvasBufferSize.h}
                values={values}
                onChange={onChange}
                isEditable={isEditable}
                chemUnitMode={chemUnitMode}
              />
            )}
        </div>
      </div>
    </div>
  );
}
