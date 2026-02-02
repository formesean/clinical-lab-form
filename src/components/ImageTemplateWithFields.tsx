"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";
import { FieldOverlay } from "./FieldOverlay";

export type FieldMap = {
  kind: "pdf" | "image";
  filename?: string;
  meta: {
    pageCount: number;
    pages: Array<{ page: number; width: number; height: number }>;
    scale?: number;
    image?: {
      naturalWidth: number;
      naturalHeight: number;
      renderWidth: number;
      renderHeight: number;
    };
  };
  fields: Array<{
    key: string;
    page: number;
    // normalized 0..1
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
    // optional metadata
    label?: string;
  }>;
};

export function ImageTemplateWithFields({
  map,
  src,
}: {
  map: FieldMap;
  src: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [pdfBufferSize, setPdfBufferSize] = useState({ w: 0, h: 0 });
  const [values, setValues] = useState<Record<string, string>>({});
  const [pdfjs, setPdfjs] = useState<{
    getDocument: (src: string) => { promise: Promise<PDFDocumentProxy> };
    GlobalWorkerOptions: { workerSrc: string };
  } | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const isPdf = map.kind === "pdf";
  const scale = 1.25;

  // Load pdf.js lazily
  useEffect(() => {
    if (!isPdf) return;
    let mounted = true;
    (async () => {
      const mod = await import("pdfjs-dist");
      const m = mod as {
        getDocument: (src: string) => { promise: Promise<PDFDocumentProxy> };
        GlobalWorkerOptions: { workerSrc: string };
      };
      m.GlobalWorkerOptions ??= { workerSrc: "" };
      m.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      if (mounted) setPdfjs(m);
    })().catch((e) => {
      if (mounted) setPdfError(String(e));
    });
    return () => { mounted = false; };
  }, [isPdf]);

  // Load PDF document from src URL
  useEffect(() => {
    if (!isPdf || !pdfjs || !src) return;
    setPdfError(null);
    let cancelled = false;
    (async () => {
      try {
        const task = pdfjs.getDocument(src);
        const doc = await task.promise;
        if (cancelled) return;
        setPdfDoc(doc as never);
      } catch (e) {
        if (!cancelled) setPdfError(String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [isPdf, pdfjs, src]);

  // Render PDF first page to canvas (buffer size = same coordinate system as mapper)
  useEffect(() => {
    if (!isPdf || !pdfDoc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    let cancelled = false;
    (async () => {
      try {
        const p = await pdfDoc.getPage(1);
        if (cancelled) return;
        const viewport = p.getViewport({ scale });
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const w = Math.floor(viewport.width);
        const h = Math.floor(viewport.height);
        canvas.width = w;
        canvas.height = h;
        if (!cancelled) setPdfBufferSize({ w, h });
        const renderTask = p.render({ canvas, canvasContext: ctx, viewport });
        await renderTask.promise;
      } catch (e) {
        if (!cancelled) setPdfError(String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [isPdf, pdfDoc, scale]);

  // Measure displayed size for image overlay only; PDF uses buffer size
  useEffect(() => {
    if (isPdf) return;
    const el = imgRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isPdf]);

  const overlaySize = isPdf ? pdfBufferSize : size;

  return (
    <div ref={containerRef} className="relative inline-block">
      {isPdf ? (
        <>
          {pdfError && (
            <div className="rounded bg-red-100 px-3 py-2 text-red-800 text-sm">
              {pdfError}
            </div>
          )}
          {!pdfDoc && !pdfError && (
            <div className="flex items-center justify-center w-[765px] max-w-full min-h-[200px] bg-zinc-100 text-zinc-500">
              Loading PDF…
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto block"
            style={{ display: pdfDoc ? "block" : "none" }}
          />
        </>
      ) : (
        <img ref={imgRef} src={src} alt="template" className="max-w-full h-auto block" />
      )}
      <FieldOverlay
        map={map}
        page={1}
        pageWidth={overlaySize.w}
        pageHeight={overlaySize.h}
        values={values}
        onChange={(k, v) => setValues((prev) => ({ ...prev, [k]: v }))}
      />
    </div>
  );
}
