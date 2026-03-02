"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
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

type MedTechEntry = { fullName: string; licenseNum: string };

type Props = {
  map: FieldMap;
  page: number;
  pageWidth: number;
  pageHeight: number;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  isEditable?: boolean;
  chemUnitMode?: "CU" | "SI";
  medtechs?: MedTechEntry[];
};

// Shared visual tokens — single source of truth for all field types
const FIELD_BG = "bg-[#E6F3ED]";
const FIELD_BORDER = "border border-[#135A39]/40";
const FIELD_TEXT_ACTIVE = "text-[#111827]";
const FIELD_TEXT_DISABLED = "text-[#6B9080]";
const FIELD_PLACEHOLDER = "placeholder:text-[#6B9080]";
const FIELD_DISABLED_BASE = "disabled:cursor-not-allowed disabled:opacity-100";

const COMBOBOX_FIELD_CLASS = [
  `!h-full !min-h-0 !shadow-none rounded-md`,
  `${FIELD_BG} ${FIELD_BORDER}`,
  `text-center ${FIELD_TEXT_ACTIVE} ${FIELD_PLACEHOLDER}`,
  `${FIELD_DISABLED_BASE} disabled:${FIELD_TEXT_DISABLED}`,
  // inner <input> sizing/alignment
  "[&_input]:!h-full [&_input]:!min-h-0 [&_input]:px-1 [&_input]:py-0",
  "[&_input]:!text-[10px] [&_input]:leading-tight [&_input]:text-center",
  // inner <input> text color — active vs disabled
  `[&_input]:${FIELD_TEXT_ACTIVE} [&_input]:disabled:${FIELD_TEXT_DISABLED}`,
  // keep trigger visually aligned with mapped fields
  "[&_[data-slot=input-group-addon]]:pr-1 [&_[data-slot=input-group-button]]:h-full [&_[data-slot=input-group-button]]:rounded-sm [&_[data-slot=input-group-button]]:hover:bg-transparent",
].join(" ");

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
  isEditable = true,
  chemUnitMode,
  medtechs,
}: Props) {
  const medtechByName = useMemo(() => {
    if (!medtechs?.length) return null;
    const m = new Map<string, string>();
    for (const mt of medtechs) m.set(mt.fullName, mt.licenseNum);
    return m;
  }, [medtechs]);
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

        const baseFieldClassName = [
          "text-center absolute h-auto !text-[10px] leading-tight px-1 py-0",
          FIELD_BG, FIELD_BORDER, FIELD_TEXT_ACTIVE, FIELD_PLACEHOLDER,
          FIELD_DISABLED_BASE, `disabled:${FIELD_TEXT_DISABLED}`,
        ].join(" ");

        const inputType = f.inputType ?? "text";
        const currentValue = values[f.key] ?? "";

        const lowerKey = f.key.toLowerCase();
        const isFlagField = lowerKey.includes("flag");
        const isPatientField = lowerKey.includes("patient");
        const isRequisitionField =
          lowerKey.includes("dateofreq") || lowerKey.includes("timeofreq");
        const isChemField = lowerKey.startsWith("chem.");
        const isChemCuVal = isChemField && lowerKey.endsWith("_cu_val");
        const isChemSuVal = isChemField && lowerKey.endsWith("_su_val");
        const isChemUnitDisabled =
          !!chemUnitMode &&
          (chemUnitMode === "CU" ? isChemSuVal : isChemCuVal);
        const isPerfByName = lowerKey.endsWith(".perfbyname");
        const isPerfByLic = lowerKey.endsWith(".perfbylic");
        const hasMedtechs = !!medtechByName && medtechByName.size > 0;
        const isPerfByLicLocked = isPerfByLic && hasMedtechs;
        const isDisabled =
          !isEditable ||
          isFlagField ||
          isPatientField ||
          isRequisitionField ||
          isChemUnitDisabled;

        const fieldClassName = `${baseFieldClassName} bg-[#E6F3ED]`;

        if (isPerfByName && hasMedtechs) {
          const prefix = f.key.slice(0, f.key.lastIndexOf("."));
          const licKey = `${prefix}.perfByLic`;
          return (
            <div key={`${f.page}:${f.key}`} className="absolute" style={fieldStyle}>
              <Combobox
                value={currentValue}
                onValueChange={(value) => {
                  if (!isEditable) return;
                  const name = value ?? "";
                  onChange(f.key, name);
                  const lic = medtechByName.get(name) ?? "";
                  onChange(licKey, lic);
                }}
                disabled={!isEditable}
              >
                <ComboboxInput
                  className={COMBOBOX_FIELD_CLASS}
                  disabled={!isEditable}
                />
                <ComboboxContent>
                  <ComboboxList>
                    {Array.from(medtechByName.keys()).map((name) => (
                      <ComboboxItem key={name} value={name}>
                        {name}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          );
        }

        // Render Combobox for combobox input type
        if (inputType === "combobox" && f.comboboxItems && f.comboboxItems.length > 0) {
          return (
            <div key={`${f.page}:${f.key}`} className="absolute" style={fieldStyle}>
              <Combobox
                value={currentValue}
                onValueChange={(value) => {
                  if (isDisabled) return;
                  onChange(f.key, value ?? "");
                }}
                disabled={isDisabled}
              >
                <ComboboxInput
                  className={COMBOBOX_FIELD_CLASS}
                  disabled={isDisabled}
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
        const isNumericInput = inputType === "number";
        return (
          <Input
            key={`${f.page}:${f.key}`}
            type={isNumericInput ? "text" : "text"}
            inputMode={isNumericInput ? "decimal" : undefined}
            pattern={isNumericInput ? "[0-9]*[.,]?[0-9]*" : undefined}
            className={fieldClassName}
            style={fieldStyle}
            value={currentValue}
            disabled={isDisabled}
            readOnly={isPerfByLicLocked}
            onChange={(e) => {
              if (isDisabled || isPerfByLicLocked) return;
              onChange(f.key, e.target.value);
            }}
          />
        );
      })}
    </div>
  );
}
