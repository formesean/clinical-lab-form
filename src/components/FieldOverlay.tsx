"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";

type FieldMap = {
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

type Props = {
  map: FieldMap;
  page: number; // 1-based
  pageWidth: number;  // current rendered size
  pageHeight: number; // current rendered size
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
};

function rectPctToPx(
  f: { xPct: number; yPct: number; wPct: number; hPct: number },
  pageW: number,
  pageH: number
) {
  const left = Math.round(f.xPct * pageW);
  const top = Math.round(f.yPct * pageH);
  const width = Math.round(f.wPct * pageW);
  const height = Math.round(f.hPct * pageH);
  return { left, top, width, height };
}


export function FieldOverlay({
  map,
  page,
  pageWidth,
  pageHeight,
  values,
  onChange,
}: Props) {
  const fields = useMemo(
    () => map.fields.filter((f) => f.page === page),
    [map, page]
  );

  return (
    <div className="absolute inset-0">
      {fields.map((f) => {
        const r = rectPctToPx(f, pageWidth, pageHeight);

        return (
          <div
            key={`${f.page}:${f.key}`}
            className="absolute"
            style={{
              left: r.left,
              top: r.top,
              width: r.width,
              height: r.height,
            }}
          >
            {/* Use "h-full" to fill mapped height */}
            <Input
              className="h-full w-full text-xs px-1 py-0"
              value={values[f.key] ?? ""}
              onChange={(e) => onChange(f.key, e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}
