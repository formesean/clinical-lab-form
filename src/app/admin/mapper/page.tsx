"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import NavBar from "@/components/NavBar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type InputType = "number" | "text" | "combobox";

type Rect = {
  id: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  key?: string;
  label?: string;
  inputType?: InputType;
  comboboxItems?: string[];
};

type ExportMap = {
  kind: "pdf" | "image";
  filename?: string;
  meta: {
    scale: number;
    pageCount: number;
    pages: Array<{ page: number; width: number; height: number }>;
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
    xPx: number;
    yPx: number;
    wPx: number;
    hPx: number;
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
    label?: string;
    inputType?: InputType;
    comboboxItems?: string[];
  }>;
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function ComboboxItemsEditor({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [newItem, setNewItem] = useState("");
  const addItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed || items.includes(trimmed)) return;
    onChange([...items, trimmed]);
    setNewItem("");
  };
  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <input
          className="flex-1 min-w-0 rounded border border-[#135A39] px-2 py-1 text-sm text-[#111827]"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && (e.preventDefault(), addItem())
          }
          placeholder="New option..."
        />
        <button
          type="button"
          className="shrink-0 rounded border border-[#135A39] px-2 py-1 text-xs text-[#135A39]"
          onClick={addItem}
        >
          Add
        </button>
      </div>
      <ul className="max-h-32 overflow-auto space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1 text-sm">
            <span className="flex-1 min-w-0 truncate text-[#111827]">
              {item}
            </span>
            <button
              type="button"
              className="shrink-0 rounded border border-red-300 px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50"
              onClick={() => removeItem(i)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Fixed scale for PDF so fieldmap coordinates match home page
const PDF_SCALE = 1.25;

export default function AdminMapperPage() {
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<"pdf" | "image" | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const [pdfjs, setPdfjs] = useState<any>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [canvasBufferSize, setCanvasBufferSize] = useState<{
    w: number;
    h: number;
  }>({ w: 0, h: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(
    null
  );
  const [imgRender, setImgRender] = useState<{ w: number; h: number } | null>(
    null
  );

  const [rects, setRects] = useState<Rect[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const importFieldmapInputRef = useRef<HTMLInputElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawStart = useRef<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<Rect | null>(null);
  const [pendingImport, setPendingImport] = useState<ExportMap | null>(null);

  const selected = useMemo(
    () => rects.find((r) => r.id === selectedId) ?? null,
    [rects, selectedId]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      // @ts-expect-error - pdfjs-dist build path has no type declarations
      const mod = await import("pdfjs-dist/build/pdf");
      mod.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      if (mounted) setPdfjs(mod);
    })().catch(console.error);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    setKind(isPdf ? "pdf" : "image");
    setRects([]);
    setSelectedId(null);
    setDraft(null);
    setPdfDoc(null);
    setPageCount(0);
    setPage(1);
    setCanvasBufferSize({ w: 0, h: 0 });
    setImgNatural(null);
    setImgRender(null);
    setPendingImport(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const firstToken = (baseName.match(/^[A-Za-z0-9]+/)?.[0] ?? baseName).trim();
    const candidates = [
      firstToken,
      firstToken.toUpperCase() !== firstToken ? firstToken.toUpperCase() : null,
    ].filter(Boolean) as string[];

    (async () => {
      for (const name of candidates) {
        try {
          const res = await fetch(
            `/filemaps/${encodeURIComponent(name)}.fieldmap.json`
          );
          if (!res.ok) continue;
          const data = (await res.json()) as ExportMap;
          if (!cancelled) {
            setPendingImport(data);
          }
          return;
        } catch {
          // Ignore and keep trying other candidates
        }
      }
      if (!cancelled) setPendingImport(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    if (!pdfjs || !objectUrl || kind !== "pdf") return;
    let cancelled = false;
    (async () => {
      const task = pdfjs.getDocument(objectUrl);
      const doc = await task.promise;
      if (cancelled) return;
      setPdfDoc(doc);
      setPageCount(doc.numPages);
      setPage(1);
    })().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [pdfjs, objectUrl, kind]);

  useEffect(() => {
    if (!pdfDoc || kind !== "pdf" || !canvasRef.current) return;
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
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, page, kind]);

  useEffect(() => {
    if (kind !== "image" || !imgRef.current) return;
    const img = imgRef.current;
    const onLoad = () => {
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      const rect = img.getBoundingClientRect();
      setImgRender({ w: rect.width, h: rect.height });
    };
    img.addEventListener("load", onLoad);
    return () => img.removeEventListener("load", onLoad);
  }, [kind, objectUrl]);

  useEffect(() => {
    if (kind !== "image") return;
    const onResize = () => {
      const img = imgRef.current;
      if (!img) return;
      const rect = img.getBoundingClientRect();
      setImgRender({ w: rect.width, h: rect.height });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [kind]);

  function currentPageRects() {
    const p = kind === "pdf" ? page : 1;
    return rects.filter((r) => r.page === p);
  }

  function getOverlayPoint(e: React.PointerEvent) {
    const el = overlayRef.current;
    if (!el) return null;

    // Get the canvas element to use its coordinate system
    const canvasEl = canvasRef.current;
    if (!canvasEl && kind === "pdf") return null;

    // For PDF, use canvas buffer size directly (exact pixel coordinates)
    // For images, use rendered size
    const bufferW = kind === "pdf" ? canvasBufferSize.w : imgRender?.w ?? 0;
    const bufferH = kind === "pdf" ? canvasBufferSize.h : imgRender?.h ?? 0;
    if (bufferW <= 0 || bufferH <= 0) return null;

    // Get overlay's bounding rect (should match buffer size with explicit px)
    const overlayRect = el.getBoundingClientRect();

    // Calculate position relative to overlay (top-left corner)
    const relX = e.clientX - overlayRect.left;
    const relY = e.clientY - overlayRect.top;

    // Scale to buffer coordinate system to account for any CSS scaling
    // If overlay is exactly buffer size, scale will be 1.0
    const scaleX = bufferW / overlayRect.width;
    const scaleY = bufferH / overlayRect.height;

    // Round to nearest pixel for exact alignment
    return {
      x: Math.round(relX * scaleX),
      y: Math.round(relY * scaleY),
      w: bufferW,
      h: bufferH,
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    const pt = getOverlayPoint(e);
    if (!pt) return;
    setIsDrawing(true);
    drawStart.current = { x: clamp(pt.x, 0, pt.w), y: clamp(pt.y, 0, pt.h) };
    const p = kind === "pdf" ? page : 1;
    const id = uid();
    const r: Rect = {
      id,
      page: p,
      x: drawStart.current.x,
      y: drawStart.current.y,
      w: 0,
      h: 0,
    };
    setDraft(r);
    setSelectedId(id);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDrawing || !drawStart.current || !draft) return;
    const pt = getOverlayPoint(e);
    if (!pt) return;
    const x2 = clamp(pt.x, 0, pt.w);
    const y2 = clamp(pt.y, 0, pt.h);
    const x = Math.min(drawStart.current.x, x2);
    const y = Math.min(drawStart.current.y, y2);
    const w = Math.abs(x2 - drawStart.current.x);
    const h = Math.abs(y2 - drawStart.current.y);
    setDraft({ ...draft, x, y, w, h });
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!isDrawing || !draft) return;
    setIsDrawing(false);
    drawStart.current = null;
    if (draft.w < 6 || draft.h < 6) {
      setDraft(null);
      setSelectedId(null);
      return;
    }
    setRects((prev) => [...prev, draft]);
    setDraft(null);
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  }

  function removeSelected() {
    if (!selectedId) return;
    setRects((prev) => prev.filter((r) => r.id !== selectedId));
    setSelectedId(null);
  }

  function updateSelected(patch: Partial<Rect>) {
    if (!selectedId) return;
    setRects((prev) =>
      prev.map((r) => (r.id === selectedId ? { ...r, ...patch } : r))
    );
  }

  function exportJson(): ExportMap | null {
    if (!kind) return null;
    const pageSizes: Array<{ page: number; width: number; height: number }> =
      [];
    if (kind === "pdf") {
      const curW = canvasBufferSize.w || 1;
      const curH = canvasBufferSize.h || 1;
      for (let i = 1; i <= (pageCount || 1); i++) {
        pageSizes.push({ page: i, width: curW, height: curH });
      }
    } else {
      pageSizes.push({
        page: 1,
        width: imgRender?.w ?? 0,
        height: imgRender?.h ?? 0,
      });
    }
    const sizeByPage = new Map(
      pageSizes.map((s) => [s.page, { width: s.width, height: s.height }])
    );
    const fields = rects
      .filter((r) => !!r.key && r.w > 0 && r.h > 0)
      .map((r) => {
        const sz = sizeByPage.get(r.page) ?? { width: 0, height: 0 };
        const W = sz.width || 1;
        const H = sz.height || 1;
        const xPx = Math.round(r.x);
        const yPx = Math.round(r.y);
        const wPx = Math.round(r.w);
        const hPx = Math.round(r.h);
        return {
          key: r.key!.trim(),
          page: r.page,
          xPx,
          yPx,
          wPx,
          hPx,
          xPct: Number((xPx / W).toFixed(6)),
          yPct: Number((yPx / H).toFixed(6)),
          wPct: Number((wPx / W).toFixed(6)),
          hPct: Number((hPx / H).toFixed(6)),
          label: r.label?.trim() || undefined,
          inputType: r.inputType,
          comboboxItems:
            r.inputType === "combobox" && r.comboboxItems?.length
              ? r.comboboxItems
              : undefined,
        };
      })
      .filter((f) => f.key.length > 0);

    if (kind === "pdf") {
      return {
        kind,
        filename: file?.name,
        meta: { scale: PDF_SCALE, pageCount: pageCount || 1, pages: pageSizes },
        fields,
      };
    }
    return {
      kind,
      filename: file?.name,
      meta: {
        scale: 1,
        pageCount: 1,
        pages: pageSizes,
        image: {
          naturalWidth: imgNatural?.w ?? 0,
          naturalHeight: imgNatural?.h ?? 0,
          renderWidth: imgRender?.w ?? 0,
          renderHeight: imgRender?.h ?? 0,
        },
      },
      fields,
    };
  }

  function downloadJson() {
    const data = exportJson();
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(file?.name ?? "template").replace(
      /\.[^.]+$/,
      ""
    )}.fieldmap.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importFieldmap() {
    if (!kind || overlaySize.w <= 0 || overlaySize.h <= 0) {
      alert(
        "Load a template file (PDF or image) first so field positions can be applied."
      );
      return;
    }
    importFieldmapInputRef.current?.click();
  }

  function applyFieldmapImport(
    data: ExportMap,
    options?: { silent?: boolean }
  ) {
    const silent = options?.silent ?? false;
    if (!kind || overlaySize.w <= 0 || overlaySize.h <= 0) {
      if (!silent) {
        alert(
          "Load a template file (PDF or image) first so field positions can be applied."
        );
      }
      return false;
    }

    if (
      !data ||
      data.kind !== kind ||
      !Array.isArray(data.fields) ||
      !data.meta?.pages?.length
    ) {
      if (!silent) {
        alert(
          "Invalid or incompatible fieldmap. Load the same template type and try again."
        );
      }
      return false;
    }

    const W = overlaySize.w || 1;
    const H = overlaySize.h || 1;
    const basePage = data.meta.pages[0] ?? { width: 1, height: 1 };
    const rectsFromImport: Rect[] = data.fields
      .filter((field) => field.page >= 1 && field.key?.trim())
      .map((field) => ({
        id: uid(),
        page: field.page,
        x: Math.round(
          (field.xPct ?? field.xPx / (basePage.width || 1)) * W
        ),
        y: Math.round(
          (field.yPct ?? field.yPx / (basePage.height || 1)) * H
        ),
        w: Math.round(
          (field.wPct ?? field.wPx / (basePage.width || 1)) * W
        ),
        h: Math.round(
          (field.hPct ?? field.hPx / (basePage.height || 1)) * H
        ),
        key: field.key?.trim(),
        label: field.label?.trim() || undefined,
        inputType: field.inputType,
        comboboxItems: field.comboboxItems?.length
          ? field.comboboxItems
          : undefined,
      }));
    setRects(rectsFromImport);
    setSelectedId(rectsFromImport[0]?.id ?? null);
    return true;
  }

  function onImportFieldmapFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !kind || overlaySize.w <= 0 || overlaySize.h <= 0) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as ExportMap;
        applyFieldmapImport(data);
      } catch {
        alert("Could not parse fieldmap JSON. Check the file format.");
      }
    };
    reader.readAsText(f);
  }

  const overlaySize = useMemo(() => {
    if (kind === "pdf") return { w: canvasBufferSize.w, h: canvasBufferSize.h };
    return { w: imgRender?.w ?? 0, h: imgRender?.h ?? 0 };
  }, [kind, page, imgRender, canvasBufferSize]);

  useEffect(() => {
    if (!pendingImport) return;
    if (!kind || overlaySize.w <= 0 || overlaySize.h <= 0) return;
    applyFieldmapImport(pendingImport, { silent: true });
    setPendingImport(null);
  }, [pendingImport, kind, overlaySize.w, overlaySize.h]);

  return (
    <div className="flex flex-col min-h-screen bg-[#E6F3ED]">
      <NavBar />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 items-center px-20 gap-5 p-5 justify-start">
          <div className="flex-2/3 h-full">
            <Card className="flex bg-white h-full w-full">
              <CardHeader>
                <CardTitle className="font-bold text-xl text-[#135A39]">
                  Template Mapper
                </CardTitle>
                <CardDescription>
                  <label className="text-sm font-medium text-[#111827]">
                    Template file (PDF / PNG / JPG)
                    <input
                      className="ml-2 text-sm border border-[#135A39] rounded px-2 py-1 text-[#111827] hover:cursor-pointer"
                      type="file"
                      accept="application/pdf,image/png,image/jpeg"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {kind === "pdf" && pdfDoc && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <button
                        type="button"
                        className="rounded border border-[#135A39] px-2 py-1 text-[#135A39] disabled:opacity-50"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Prev
                      </button>
                      <span className="text-[#111827]">
                        Page {page} / {pageCount || 1}
                      </span>
                      <button
                        type="button"
                        className="rounded border border-[#135A39] px-2 py-1 text-[#135A39] disabled:opacity-50"
                        disabled={page >= (pageCount || 1)}
                        onClick={() =>
                          setPage((p) => Math.min(pageCount || 1, p + 1))
                        }
                      >
                        Next
                      </button>
                      <span className="text-muted-foreground">
                        Scale {PDF_SCALE} (fixed)
                      </span>
                    </div>
                  )}
                </CardDescription>
                <Separator className="bg-[#DDEAE3]" />
              </CardHeader>
              <CardContent className="p-3 overflow-auto flex flex-col items-center justify-center min-h-[50vh]">
                {!kind && (
                  <div className="text-muted-foreground">
                    Select a template file to start mapping.
                  </div>
                )}
                {kind === "pdf" && pdfDoc && (
                  <div className="flex items-center justify-center w-full">
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
                        {overlaySize.w > 0 && overlaySize.h > 0 && (
                          <div
                            ref={overlayRef}
                            className="absolute left-0 top-0 box-border"
                            style={{
                              width: `${overlaySize.w}px`,
                              height: `${overlaySize.h}px`,
                            }}
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                          >
                            {currentPageRects().map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedId(r.id);
                                }}
                                className={`absolute ${
                                  r.id === selectedId
                                    ? "border-[3px] border-[#0d3d2a] bg-[#135A39]/30 shadow-md"
                                    : "border-2 border-[#6B9080] bg-[#6B9080]/10"
                                }`}
                                style={{
                                  left: `${r.x}px`,
                                  top: `${r.y}px`,
                                  width: `${r.w}px`,
                                  height: `${r.h}px`,
                                }}
                                title={r.key ? r.key : "unassigned"}
                              />
                            ))}
                            {draft && (
                              <div
                                className="absolute border-2 border-orange-600 bg-orange-500/10"
                                style={{
                                  left: `${draft.x}px`,
                                  top: `${draft.y}px`,
                                  width: `${draft.w}px`,
                                  height: `${draft.h}px`,
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {kind === "image" && objectUrl && (
                  <div className="flex items-center justify-center w-full">
                    <div className="relative border border-[#DDEAE3]">
                      <img
                        ref={imgRef}
                        src={objectUrl}
                        alt="template"
                        className="block max-w-full"
                        onLoad={() => {
                          const img = imgRef.current;
                          if (!img) return;
                          setImgNatural({
                            w: img.naturalWidth,
                            h: img.naturalHeight,
                          });
                          const rect = img.getBoundingClientRect();
                          setImgRender({ w: rect.width, h: rect.height });
                        }}
                      />
                      {overlaySize.w > 0 && overlaySize.h > 0 && (
                        <div
                          ref={overlayRef}
                          className="absolute left-0 top-0 box-border"
                          style={{
                            width: `${overlaySize.w}px`,
                            height: `${overlaySize.h}px`,
                          }}
                          onPointerDown={onPointerDown}
                          onPointerMove={onPointerMove}
                          onPointerUp={onPointerUp}
                        >
                          {currentPageRects().map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedId(r.id);
                              }}
                              className={`absolute ${
                                r.id === selectedId
                                  ? "border-[3px] border-[#0d3d2a] bg-[#135A39]/30 shadow-md"
                                  : "border-2 border-[#6B9080] bg-[#6B9080]/10"
                              }`}
                              style={{
                                left: r.x,
                                top: r.y,
                                width: r.w,
                                height: r.h,
                              }}
                              title={r.key ?? "unassigned"}
                            />
                          ))}
                          {draft && (
                            <div
                              className="absolute border-2 border-orange-600 bg-orange-500/10"
                              style={{
                                left: `${draft.x}px`,
                                top: `${draft.y}px`,
                                width: `${draft.w}px`,
                                height: `${draft.h}px`,
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="flex-1/3 h-full">
            <Card className="flex bg-white h-full w-full">
              <CardHeader>
                <CardTitle className="font-bold text-xl text-[#135A39]">
                  Field Map
                </CardTitle>
                <CardDescription>
                  Draw boxes on the template. Select a box to assign a key.
                </CardDescription>
                <Separator className="bg-[#DDEAE3]" />
                <div className="flex gap-2">
                  <input
                    ref={importFieldmapInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={onImportFieldmapFile}
                  />
                  <button
                    type="button"
                    className="rounded border border-[#135A39] px-2 py-1 text-sm text-[#135A39] disabled:opacity-50 enabled:hover:cursor-pointer"
                    disabled={!kind || overlaySize.w <= 0 || overlaySize.h <= 0}
                    onClick={importFieldmap}
                  >
                    Import
                  </button>
                  <button
                    type="button"
                    className="rounded border border-[#135A39] px-2 py-1 text-sm text-[#135A39] disabled:opacity-50 enabled:hover:cursor-pointer"
                    disabled={rects.length === 0}
                    onClick={downloadJson}
                  >
                    Export JSON
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-3 overflow-auto">
                <div className="rounded border border-[#DDEAE3] p-2 mb-3">
                  <div className="text-xs font-medium text-[#111827]">
                    Selected
                  </div>
                  {!selected && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      None
                    </div>
                  )}
                  {selected && (
                    <div className="mt-2 space-y-2">
                      <label className="block text-xs text-[#111827]">
                        Key (required)
                        <input
                          className="mt-1 w-full rounded border border-[#135A39] px-2 py-1 text-sm text-[#111827]"
                          value={selected.key ?? ""}
                          onChange={(e) =>
                            updateSelected({ key: e.target.value })
                          }
                          placeholder="e.g. patient.lastName"
                        />
                      </label>
                      <label className="block text-xs text-[#111827]">
                        Label (optional)
                        <input
                          className="mt-1 w-full rounded border border-[#135A39] px-2 py-1 text-sm text-[#111827]"
                          value={selected.label ?? ""}
                          onChange={(e) =>
                            updateSelected({ label: e.target.value })
                          }
                          placeholder="human label"
                        />
                      </label>
                      <label className="block text-xs text-[#111827]">
                        Input type
                        <select
                          className="mt-1 w-full rounded border border-[#135A39] px-2 py-1 text-sm text-[#111827] bg-white"
                          value={selected.inputType ?? "text"}
                          onChange={(e) =>
                            updateSelected({
                              inputType: e.target.value as InputType,
                            })
                          }
                        >
                          <option value="text">Text</option>
                          <option value="number">Number (decimal)</option>
                          <option value="combobox">Combobox</option>
                        </select>
                      </label>
                      {selected.inputType === "combobox" && (
                        <div className="space-y-1.5">
                          <div className="text-xs font-medium text-[#111827]">
                            Combobox items
                          </div>
                          <ComboboxItemsEditor
                            items={selected.comboboxItems ?? []}
                            onChange={(items) =>
                              updateSelected({ comboboxItems: items })
                            }
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {(["x", "y", "w", "h"] as const).map((k) => (
                          <label key={k} className="text-[#111827]">
                            {k.toUpperCase()}
                            <input
                              className="mt-1 w-full rounded border border-[#135A39] px-2 py-1 text-sm"
                              type="number"
                              value={Math.round(selected[k])}
                              onChange={(e) =>
                                updateSelected({
                                  [k]: Number(e.target.value) || 0,
                                })
                              }
                            />
                          </label>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-muted-foreground">
                          Page: {selected.page}
                        </span>
                        <button
                          type="button"
                          className="rounded border border-[#135A39] px-2 py-1 text-sm text-[#135A39]"
                          onClick={removeSelected}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="rounded border border-[#DDEAE3] p-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#111827]">
                      Fields ({rects.length})
                    </span>
                    <button
                      type="button"
                      className="rounded border border-[#135A39] px-2 py-1 text-xs text-[#135A39] disabled:opacity-50"
                      disabled={rects.length === 0}
                      onClick={() => {
                        setRects([]);
                        setSelectedId(null);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <ul className="max-h-[380px] overflow-auto space-y-1">
                    {rects
                      .slice()
                      .sort((a, b) => a.page - b.page || a.y - b.y || a.x - b.x)
                      .map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            className={`w-full rounded px-2 py-1 text-left text-xs ${
                              r.id === selectedId
                                ? "bg-[#DDEAE3] text-[#135A39]"
                                : "hover:bg-[#E6F3ED]"
                            }`}
                            onClick={() => setSelectedId(r.id)}
                          >
                            <div className="flex justify-between gap-2">
                              <span className="truncate font-medium">
                                {r.key?.trim() ? r.key : "(unassigned)"}
                              </span>
                              <span className="shrink-0 text-[10px] text-muted-foreground">
                                p{r.page}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                              <span>
                                x{Math.round(r.x)} y{Math.round(r.y)} w
                                {Math.round(r.w)} h{Math.round(r.h)}
                              </span>
                              <span className="shrink-0 capitalize">
                                {r.inputType ?? "text"}
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  PDF scale is fixed at {PDF_SCALE} so exported fieldmaps match
                  the home page.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
