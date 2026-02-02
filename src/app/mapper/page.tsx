"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Rect = {
  id: string;
  page: number; // 1-based for PDF, 1 for image
  x: number; // in rendered pixels
  y: number; // in rendered pixels
  w: number;
  h: number;
  key?: string;
  label?: string;
};

type ExportMap = {
  kind: "pdf" | "image";
  filename?: string;
  // For PDFs, these are page render sizes at the chosen scale (pixels).
  // For images, it's the image natural size + render size.
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

    // pixel coords (at render size)
    xPx: number;
    yPx: number;
    wPx: number;
    hPx: number;

    // normalized coords (0..1), scale-independent
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;

    label?: string;
  }>;

};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function TemplateMapper() {
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<"pdf" | "image" | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // PDF
  const [pdfjs, setPdfjs] = useState<any>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.25);
  const [canvasBufferSize, setCanvasBufferSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Image
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [imgRender, setImgRender] = useState<{ w: number; h: number } | null>(
    null,
  );

  // Mapping state
  const [rects, setRects] = useState<Rect[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Drawing
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const importFieldmapInputRef = useRef<HTMLInputElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawStart = useRef<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<Rect | null>(null);

  const selected = useMemo(
    () => rects.find((r) => r.id === selectedId) ?? null,
    [rects, selectedId],
  );

  // Load pdf.js lazily
  useEffect(() => {
    let mounted = true;
    (async () => {
      const mod = await import("pdfjs-dist/build/pdf");
      // Worker config for Next (no CDN needed)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      mod.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();

      if (mounted) setPdfjs(mod);
    })().catch(console.error);

    return () => {
      mounted = false;
    };
  }, []);

  // Handle file selection -> object URL
  useEffect(() => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    setKind(isPdf ? "pdf" : "image");

    // reset state per new file
    setRects([]);
    setSelectedId(null);
    setDraft(null);
    setPdfDoc(null);
    setPageCount(0);
    setPage(1);
    setCanvasBufferSize({ w: 0, h: 0 });
    setImgNatural(null);
    setImgRender(null);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Load PDF document
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

  // Render current PDF page to canvas (buffer size = single source of truth for coordinates)
  useEffect(() => {
    if (!pdfDoc || kind !== "pdf") return;
    if (!canvasRef.current) return;

    let cancelled = false;
    (async () => {
      const p = await pdfDoc.getPage(page);
      if (cancelled) return;

      const viewport = p.getViewport({ scale });
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
  }, [pdfDoc, page, scale, kind]);

  // Track image natural + render size
  useEffect(() => {
    if (kind !== "image") return;
    if (!imgRef.current) return;

    const img = imgRef.current;
    const onLoad = () => {
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      // rendered size in layout pixels:
      const rect = img.getBoundingClientRect();
      setImgRender({ w: rect.width, h: rect.height });
    };

    img.addEventListener("load", onLoad);
    return () => img.removeEventListener("load", onLoad);
  }, [kind, objectUrl]);

  // Update image render size on resize (best-effort)
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
    const b = el.getBoundingClientRect();
    const x = e.clientX - b.left;
    const y = e.clientY - b.top;
    return { x, y, w: b.width, h: b.height };
  }

  function onPointerDown(e: React.PointerEvent) {
    // Only left click / primary pointer
    if (e.button !== 0) return;

    const pt = getOverlayPoint(e);
    if (!pt) return;

    setIsDrawing(true);
    drawStart.current = { x: clamp(pt.x, 0, pt.w), y: clamp(pt.y, 0, pt.h) };

    const p = kind === "pdf" ? page : 1;
    const id = uid();
    const r: Rect = { id, page: p, x: drawStart.current.x, y: drawStart.current.y, w: 0, h: 0 };
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

    const x1 = drawStart.current.x;
    const y1 = drawStart.current.y;

    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);

    setDraft({ ...draft, x, y, w, h });
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!isDrawing || !draft) return;
    setIsDrawing(false);
    drawStart.current = null;

    const minSize = 6;
    if (draft.w < minSize || draft.h < minSize) {
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
    setRects((prev) => prev.map((r) => (r.id === selectedId ? { ...r, ...patch } : r)));
  }

  function exportJson(): ExportMap | null {
    if (!kind) return null;

    // Determine page render sizes used for normalization
    const pageSizes: Array<{ page: number; width: number; height: number }> = [];

    if (kind === "pdf") {
      const curW = canvasBufferSize.w || 1;
      const curH = canvasBufferSize.h || 1;
      const pc = pageCount || 1;
      for (let i = 1; i <= pc; i++) {
        pageSizes.push({ page: i, width: curW, height: curH });
      }
    } else {
      pageSizes.push({
        page: 1,
        width: imgRender?.w ?? 0,
        height: imgRender?.h ?? 0,
      });
    }

    const sizeByPage = new Map<number, { width: number; height: number }>();
    for (const s of pageSizes) sizeByPage.set(s.page, { width: s.width, height: s.height });

    const fields = rects
      .filter((r) => !!r.key && r.w > 0 && r.h > 0)
      .map((r) => {
        const sz = sizeByPage.get(r.page) ?? { width: 0, height: 0 };
        const W = sz.width || 1; // avoid division by zero
        const H = sz.height || 1;

        const xPx = Math.round(r.x);
        const yPx = Math.round(r.y);
        const wPx = Math.round(r.w);
        const hPx = Math.round(r.h);

        const xPct = Number((xPx / W).toFixed(6));
        const yPct = Number((yPx / H).toFixed(6));
        const wPct = Number((wPx / W).toFixed(6));
        const hPct = Number((hPx / H).toFixed(6));

        return {
          key: r.key!.trim(),
          page: r.page,
          xPx,
          yPx,
          wPx,
          hPx,
          xPct,
          yPct,
          wPct,
          hPct,
          label: r.label?.trim() || undefined,
        };
      })
      .filter((f) => f.key.length > 0);

    if (kind === "pdf") {
      return {
        kind,
        filename: file?.name,
        meta: { scale, pageCount: pageCount || 1, pages: pageSizes },
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

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${(file?.name ?? "template").replace(/\.[^.]+$/, "")}.fieldmap.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function importFieldmap() {
    if (!kind || overlaySize.w <= 0 || overlaySize.h <= 0) {
      alert("Load a template file (PDF or image) first so field positions can be applied.");
      return;
    }
    importFieldmapInputRef.current?.click();
  }

  function onImportFieldmapFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !kind || overlaySize.w <= 0 || overlaySize.h <= 0) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = reader.result as string;
        const data = JSON.parse(raw) as ExportMap;
        if (!data || data.kind !== kind || !Array.isArray(data.fields) || !data.meta?.pages?.length) {
          alert("Invalid or incompatible fieldmap. Load the same template type (PDF or image) and try again.");
          return;
        }
        const W = overlaySize.w || 1;
        const H = overlaySize.h || 1;
        const rectsFromImport: Rect[] = data.fields
          .filter((field) => field.page >= 1 && field.key?.trim())
          .map((field) => ({
            id: uid(),
            page: field.page,
            x: Math.round((field.xPct ?? field.xPx / (data.meta.pages[0]?.width || 1)) * W),
            y: Math.round((field.yPct ?? field.yPx / (data.meta.pages[0]?.height || 1)) * H),
            w: Math.round((field.wPct ?? field.wPx / (data.meta.pages[0]?.width || 1)) * W),
            h: Math.round((field.hPct ?? field.hPx / (data.meta.pages[0]?.height || 1)) * H),
            key: field.key?.trim(),
            label: field.label?.trim() || undefined,
          }));
        setRects(rectsFromImport);
        setSelectedId(rectsFromImport[0]?.id ?? null);
      } catch {
        alert("Could not parse fieldmap JSON. Check the file format.");
      }
    };
    reader.readAsText(f);
  }

  const overlaySize = useMemo(() => {
    if (kind === "pdf") {
      return { w: canvasBufferSize.w, h: canvasBufferSize.h };
    }
    return { w: imgRender?.w ?? 0, h: imgRender?.h ?? 0 };
  }, [kind, page, scale, imgRender, canvasBufferSize]);

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div className="rounded-lg border p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium">
            Template file (PDF / PNG / JPG)
            <input
              className="ml-2 text-sm"
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          {kind === "pdf" && (
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                disabled={!pdfDoc || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <div className="text-sm">
                Page <span className="font-medium">{page}</span> / {pageCount || 1}
              </div>
              <button
                type="button"
                className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                disabled={!pdfDoc || page >= (pageCount || 1)}
                onClick={() => setPage((p) => Math.min(pageCount || 1, p + 1))}
              >
                Next
              </button>

              <div className="ml-2 flex items-center gap-2">
                <span className="text-sm">Scale</span>
                <input
                  className="w-20 rounded border px-2 py-1 text-sm"
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="3"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value) || 1)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="relative inline-block">
          {/* Template render */}
          {kind === "pdf" && <canvas ref={canvasRef} className="block" style={{ width: canvasBufferSize.w || undefined, height: canvasBufferSize.h || undefined }} />}
          {kind === "image" && objectUrl && (
            <img
              ref={imgRef}
              src={objectUrl}
              alt="template"
              className="block max-w-full"
              onLoad={() => {
                const img = imgRef.current;
                if (!img) return;
                setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
                const rect = img.getBoundingClientRect();
                setImgRender({ w: rect.width, h: rect.height });
              }}
            />
          )}

          {/* Overlay */}
          {!!kind && overlaySize.w > 0 && overlaySize.h > 0 && (
            <div
              ref={overlayRef}
              className="absolute left-0 top-0"
              style={{ width: overlaySize.w, height: overlaySize.h }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {/* existing rects */}
              {currentPageRects().map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedId(r.id);
                  }}
                  className={[
                    "absolute border-2",
                    r.id === selectedId ? "border-blue-600 bg-blue-500/10" : "border-emerald-600 bg-emerald-500/10",
                  ].join(" ")}
                  style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
                  title={r.key ? `${r.key}` : "unassigned"}
                />
              ))}

              {/* draft */}
              {draft && (
                <div
                  className="absolute border-2 border-orange-600 bg-orange-500/10"
                  style={{ left: draft.x, top: draft.y, width: draft.w, height: draft.h }}
                />
              )}
            </div>
          )}
        </div>

        {!kind && (
          <div className="mt-4 text-sm text-muted-foreground">
            Select a template file to start mapping.
          </div>
        )}
      </div>

      <aside className="rounded-lg border p-3">
        <input
          ref={importFieldmapInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={onImportFieldmapFile}
        />
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-sm font-semibold">Field Map</div>
          <div className="flex gap-1">
            <button
              type="button"
              className="rounded border px-2 py-1 text-sm disabled:opacity-50"
              disabled={!kind || overlaySize.w <= 0 || overlaySize.h <= 0}
              onClick={importFieldmap}
              title="Load an existing .fieldmap.json to edit"
            >
              Import
            </button>
            <button
              type="button"
              className="rounded border px-2 py-1 text-sm disabled:opacity-50"
              disabled={rects.length === 0}
              onClick={downloadJson}
            >
              Export JSON
            </button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Draw boxes on the template. Select a box to assign a key.
        </div>

        <div className="mt-3 space-y-3">
          <div className="rounded border p-2">
            <div className="text-xs font-medium">Selected</div>

            {!selected && <div className="mt-2 text-sm text-muted-foreground">None</div>}

            {selected && (
              <div className="mt-2 space-y-2">
                <label className="block text-xs">
                  Key (required)
                  <input
                    className="mt-1 w-full rounded border px-2 py-1 text-sm"
                    value={selected.key ?? ""}
                    onChange={(e) => updateSelected({ key: e.target.value })}
                    placeholder="e.g. patient.lastName or chem.fbs"
                  />
                </label>

                <label className="block text-xs">
                  Label (optional)
                  <input
                    className="mt-1 w-full rounded border px-2 py-1 text-sm"
                    value={selected.label ?? ""}
                    onChange={(e) => updateSelected({ label: e.target.value })}
                    placeholder="human label"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label>
                    X
                    <input
                      className="mt-1 w-full rounded border px-2 py-1 text-sm"
                      type="number"
                      value={Math.round(selected.x)}
                      onChange={(e) => updateSelected({ x: Number(e.target.value) || 0 })}
                    />
                  </label>
                  <label>
                    Y
                    <input
                      className="mt-1 w-full rounded border px-2 py-1 text-sm"
                      type="number"
                      value={Math.round(selected.y)}
                      onChange={(e) => updateSelected({ y: Number(e.target.value) || 0 })}
                    />
                  </label>
                  <label>
                    W
                    <input
                      className="mt-1 w-full rounded border px-2 py-1 text-sm"
                      type="number"
                      value={Math.round(selected.w)}
                      onChange={(e) => updateSelected({ w: Number(e.target.value) || 0 })}
                    />
                  </label>
                  <label>
                    H
                    <input
                      className="mt-1 w-full rounded border px-2 py-1 text-sm"
                      type="number"
                      value={Math.round(selected.h)}
                      onChange={(e) => updateSelected({ h: Number(e.target.value) || 0 })}
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Page: {selected.page}
                  </div>
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-sm"
                    onClick={removeSelected}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded border p-2">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-medium">
                Fields ({rects.length})
              </div>
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs"
                onClick={() => {
                  setRects([]);
                  setSelectedId(null);
                }}
                disabled={rects.length === 0}
              >
                Clear
              </button>
            </div>

            <div className="max-h-[380px] overflow-auto">
              <ul className="space-y-1">
                {rects
                  .slice()
                  .sort((a, b) => (a.page - b.page) || (a.y - b.y) || (a.x - b.x))
                  .map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        className={[
                          "w-full rounded px-2 py-1 text-left text-xs",
                          r.id === selectedId ? "bg-muted" : "hover:bg-muted/60",
                        ].join(" ")}
                        onClick={() => setSelectedId(r.id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate font-medium">
                            {r.key?.trim() ? r.key : "(unassigned)"}
                          </div>
                          <div className="shrink-0 text-[10px] text-muted-foreground">
                            p{r.page}
                          </div>
                        </div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          x{Math.round(r.x)} y{Math.round(r.y)} w{Math.round(r.w)} h{Math.round(r.h)}
                        </div>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          <div className="rounded border p-2">
            <div className="text-xs font-medium">Notes</div>
            <ul className="mt-2 list-disc pl-4 text-xs text-muted-foreground">
              <li>Coordinates are in rendered pixels at the chosen PDF scale.</li>
              <li>Keep your scale consistent per template to avoid remapping.</li>
              <li>Later you’ll convert these rects into PDF points or Excel cells.</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}
