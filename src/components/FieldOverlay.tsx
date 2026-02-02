"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxValue,
} from "@/components/ui/combobox";

type InputType = "number" | "text" | "combobox";

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
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
    xPx?: number;
    yPx?: number;
    wPx?: number;
    hPx?: number;
    label?: string;
    inputType?: InputType;
    comboboxItems?: string[];
  }>;
};

type Props = {
  map: FieldMap;
  page: number;
  pageWidth: number;
  pageHeight: number;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
};

/**
 * Renders input fields over the PDF/image exactly like the mapper renders boxes.
 * Uses xPx/yPx/wPx/hPx directly when available (same as mapper's r.x, r.y, r.w, r.h).
 */
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
    <div
      className="absolute left-0 top-0 box-border"
      style={{
        width: `${pageWidth}px`,
        height: `${pageHeight}px`,
      }}
    >
      {fields.map((f) => {
        // Use pixel values directly, exactly like the mapper does:
        // style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
        const hasPixelValues =
          typeof f.xPx === "number" &&
          typeof f.yPx === "number" &&
          typeof f.wPx === "number" &&
          typeof f.hPx === "number";

        const left = hasPixelValues ? f.xPx! : f.xPct * pageWidth;
        const top = hasPixelValues ? f.yPx! : f.yPct * pageHeight;
        const width = hasPixelValues ? f.wPx! : f.wPct * pageWidth;
        const height = hasPixelValues ? f.hPx! : f.hPct * pageHeight;

        const fieldStyle = {
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
        };

        const fieldClassName = "absolute h-auto text-xs px-1 py-0 bg-[#E6F3ED]/90 border border-[#135A39]/40 text-[#111827] placeholder:text-[#6B9080]";

        const inputType = f.inputType ?? "text";
        const currentValue = values[f.key] ?? "";

        // Render Combobox for combobox input type
        if (inputType === "combobox" && f.comboboxItems && f.comboboxItems.length > 0) {
          return (
            <div key={`${f.page}:${f.key}`} className="absolute" style={fieldStyle}>
              <Combobox
                value={currentValue}
                onValueChange={(value) => onChange(f.key, value ?? "")}
              >
                <ComboboxValue />
                <ComboboxInput
                  className="h-full text-xs bg-[#E6F3ED]/90 border border-[#135A39]/40 text-[#111827] placeholder:text-[#6B9080] [&_input]:h-full [&_input]:px-1 [&_input]:py-0 [&_input]:text-xs"
                  placeholder={f.label}
                />
                <ComboboxContent>
                  <ComboboxList>
                    {f.comboboxItems.map((item) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          );
        }

        // Render Input for text or number input types
        return (
          <Input
            key={`${f.page}:${f.key}`}
            type={inputType === "number" ? "number" : "text"}
            className={fieldClassName}
            style={fieldStyle}
            value={currentValue}
            onChange={(e) => onChange(f.key, e.target.value)}
            placeholder={f.label}
          />
        );
      })}
    </div>
  );
}
