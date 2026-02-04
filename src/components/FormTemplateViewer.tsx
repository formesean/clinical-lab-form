"use client";

import { FieldOverlay } from "@/components/FieldOverlay";
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
};

/**
 * Loads and renders a form PDF with its fieldmap overlay for a given form type.
 * Fetches /api/templates/{formType}.pdf and /filemaps/{formType}.fieldmap.json.
 */
export function FormTemplateViewer({ formType, values, onChange }: Props) {
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
    let cancelled = false;
    (async () => {
      const [pdfRes, fieldmapRes] = await Promise.all([
        fetch(`/api/templates/${type}.pdf`),
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
  }, [formType]);

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
              />
            )}
        </div>
      </div>
    </div>
  );
}
