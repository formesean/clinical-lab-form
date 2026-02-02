"use client";

import { FormType, Sex } from "@prisma/client";
import { useForm } from "@tanstack/react-form";
import { getDefaultValues, getFormSchemaConfig } from "@/lib/form-schemas";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "./ui/combobox";
import { Button } from "./ui/button";

const inputClass =
  "text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white";
const labelClass = "text-[#111827] placeholder:text-[#9CA3AF]";

type Unit = "conv" | "si";

type FormLayoutProps = {
  formType: FormType;
  sex: Sex;
  unit: Unit;
  age: number;
};

export default function FormLayout({
  formType,
  sex,
  unit,
  age,
}: FormLayoutProps) {
  const { schema, fields } = getFormSchemaConfig(formType);
  const defaultValues = getDefaultValues(formType);

  const form = useForm({
    defaultValues: defaultValues as Record<string, unknown>,
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      const res = await fetch(`/api/forms/export-excel/${formType.toLowerCase()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...value,
          formType,
          sex,
          unit,
          age
        }),
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${formType}.xlsx`;
      a.click();
    }
  });

  return (
    <>
      <form
        id="lab-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="w-full sm:max-w-md"
      >
        <FieldGroup>
          {fields.map((fieldConfig) => {
            if ("keys" in fieldConfig && fieldConfig.kind === "rel_abs") {
              const [keyRel, keyAbs] = fieldConfig.keys;
              const [subLabelRel, subLabelAbs] = fieldConfig.subLabels ?? ["Relative", "Absolute"];
              return (
                <Field key={keyRel} className="flex flex-col gap-0">
                  <FieldLabel className={labelClass}>
                    {fieldConfig.label}
                  </FieldLabel>
                  <div className="flex gap-2 items-start">
                    <form.Field name={keyRel} key={keyRel}>
                      {(fieldRel) => {
                        const v = fieldRel.state.value;
                        const display = v === undefined || v === null ? "" : String(v);
                        const invalid = fieldRel.state.meta.isTouched && !fieldRel.state.meta.isValid;
                        return (
                          <span className="flex flex-col items-start gap-1">
                            <Input
                              id={keyRel}
                              name={keyRel}
                              type="number"
                              inputMode="decimal"
                              step="any"
                              value={display}
                              onBlur={fieldRel.handleBlur}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const n = parseFloat(raw);
                                fieldRel.handleChange(raw === "" || Number.isNaN(n) ? undefined : n);
                              }}
                              aria-invalid={invalid}
                              autoComplete="off"
                              className={inputClass + " w-24"}
                            />
                            <FieldDescription className="text-sm text-[#6B7280] shrink-0">
                              {subLabelRel}
                            </FieldDescription>
                          </span>
                        );
                      }}
                    </form.Field>
                    <form.Field name={keyAbs} key={keyAbs}>
                      {(fieldAbs) => {
                        const v = fieldAbs.state.value;
                        const display = v === undefined || v === null ? "" : String(v);
                        const invalid = fieldAbs.state.meta.isTouched && !fieldAbs.state.meta.isValid;
                        return (
                          <span className="flex flex-col items-start gap-1">
                            <Input
                              id={keyAbs}
                              name={keyAbs}
                              type="number"
                              inputMode="decimal"
                              step="any"
                              value={display}
                              onBlur={fieldAbs.handleBlur}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const n = parseFloat(raw);
                                fieldAbs.handleChange(raw === "" || Number.isNaN(n) ? undefined : n);
                              }}
                              aria-invalid={invalid}
                              autoComplete="off"
                              className={inputClass + " w-24"}
                            />
                            <FieldDescription className="text-sm text-[#6B7280] shrink-0">
                              {subLabelAbs}
                            </FieldDescription>
                          </span>
                        );
                      }}
                    </form.Field>
                  </div>
                </Field>
              );
            }

            if ("keys" in fieldConfig && fieldConfig.kind === "id_res") {
              const [key0, key1] = fieldConfig.keys;
              const [subLabel0, subLabel1] = fieldConfig.subLabels ?? ["ID", "Result"];
              const [options0, options1] = fieldConfig.options ?? [[], []];
              const secondIsText = fieldConfig.secondInputKind === "text";
              return (
                <Field key={key0} className="flex flex-col gap-0">
                  <FieldLabel className={labelClass}>
                    {fieldConfig.label}
                  </FieldLabel>
                  <div className="flex gap-2 items-start">
                    <form.Field name={key0} key={key0}>
                      {(field0) => {
                        const v = field0.state.value;
                        const display = v === undefined || v === null ? "" : String(v);
                        const invalid = field0.state.meta.isTouched && !field0.state.meta.isValid;
                        return (
                          <span className="flex flex-col items-start gap-1">
                            <Combobox
                              items={options0}
                              value={display || null}
                              onValueChange={(val: string | null) => field0.handleChange(val ?? undefined)}
                            >
                              <ComboboxInput
                                id={key0}
                                name={key0}
                                aria-invalid={invalid}
                                className={inputClass + " w-32"}
                              />
                              <ComboboxContent>
                                <ComboboxEmpty>No items found.</ComboboxEmpty>
                                <ComboboxList>
                                  {(item: string) => (
                                    <ComboboxItem key={item} value={item}>
                                      {item}
                                    </ComboboxItem>
                                  )}
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                            <FieldDescription className="text-sm text-[#6B7280]">
                              {subLabel0}
                            </FieldDescription>
                          </span>
                        );
                      }}
                    </form.Field>
                    <form.Field name={key1} key={key1}>
                      {(field1) => {
                        const v = field1.state.value;
                        const display = v === undefined || v === null ? "" : String(v);
                        const invalid = field1.state.meta.isTouched && !field1.state.meta.isValid;
                        return (
                          <span className="flex flex-col items-start gap-1">
                            {secondIsText ? (
                              <>
                                <Textarea
                                  id={key1}
                                  name={key1}
                                  value={display}
                                  onBlur={field1.handleBlur}
                                  onChange={(e) => field1.handleChange(e.target.value || undefined)}
                                  aria-invalid={invalid}
                                  autoComplete="off"
                                  className={inputClass + " w-40 resize-y min-h-10"}
                                  rows={2}
                                />
                                <FieldDescription className="text-sm text-[#6B7280]">
                                  {subLabel1}
                                </FieldDescription>
                              </>
                            ) : (
                              <>
                                <Combobox
                                  items={options1}
                                  value={display || null}
                                  onValueChange={(val: string | null) => field1.handleChange(val ?? undefined)}
                                >
                                  <ComboboxInput
                                    id={key1}
                                    name={key1}
                                    aria-invalid={invalid}
                                    className={inputClass + " w-32"}
                                  />
                                  <ComboboxContent>
                                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                                    <ComboboxList>
                                      {(item: string) => (
                                        <ComboboxItem key={item} value={item}>
                                          {item}
                                        </ComboboxItem>
                                      )}
                                    </ComboboxList>
                                  </ComboboxContent>
                                </Combobox>
                                <FieldDescription className="text-sm text-[#6B7280]">
                                  {subLabel1}
                                </FieldDescription>
                              </>
                            )}
                          </span>
                        );
                      }}
                    </form.Field>
                  </div>
                </Field>
              );
            }

            if ("keys" in fieldConfig && fieldConfig.kind === "id_id_res") {
              const [key0, key1, key2] = fieldConfig.keys;
              const [subLabel0, subLabel1, subLabel2] = fieldConfig.subLabels ?? ["ID 1", "ID 2", "Result"];
              const [options0, options1, options2] = fieldConfig.options ?? [[], [], []];
              const renderCombobox = (name: string, items: string[], subLabel: string) => (
                <form.Field name={name} key={name}>
                  {(field: { state: { value: unknown; meta: { isTouched: boolean; isValid: boolean } }; handleChange: (v: string | undefined) => void }) => {
                    const v = field.state.value;
                    const display = v === undefined || v === null ? "" : String(v);
                    const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <span className="flex flex-col items-start gap-1">
                        <Combobox
                          items={items}
                          value={display || null}
                          onValueChange={(val: string | null) => field.handleChange(val ?? undefined)}
                        >
                          <ComboboxInput
                            id={name}
                            name={name}
                            aria-invalid={invalid}
                            className={inputClass + " w-32"}
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>No items found.</ComboboxEmpty>
                            <ComboboxList>
                              {(item: string) => (
                                <ComboboxItem key={item} value={item}>
                                  {item}
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        <FieldDescription className="text-sm text-[#6B7280]">
                          {subLabel}
                        </FieldDescription>
                      </span>
                    );
                  }}
                </form.Field>
              );
              return (
                <Field key={key0} className="flex flex-col gap-1">
                  <FieldLabel className={labelClass}>
                    {fieldConfig.label}
                  </FieldLabel>
                  <div className="flex gap-2 items-start">
                    {renderCombobox(key0, options0, subLabel0)}
                    {renderCombobox(key2, options2, subLabel2)}
                  </div>
                  <div>
                    {renderCombobox(key1, options1, subLabel1)}
                  </div>
                </Field>
              );
            }

            if (!("key" in fieldConfig)) return null;
            const key = fieldConfig.key;
            return (
              <form.Field key={key} name={key} children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                const isNumber = fieldConfig.kind === "number";
                const isCombobox = fieldConfig.kind === "combobox";
                const value = field.state.value;
                const displayValue =
                  value === undefined || value === null
                    ? ""
                    : String(value);
                const comboboxItems = "options" in fieldConfig ? fieldConfig.options ?? [] : [];

                return (
                  <Field
                    data-invalid={isInvalid}
                    className="flex flex-col gap-0"
                  >
                    <FieldLabel
                      htmlFor={field.name}
                      className={labelClass}
                    >
                      {fieldConfig.label}
                    </FieldLabel>
                    {isNumber ? (
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={displayValue}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const n = parseFloat(raw);
                          field.handleChange(
                            raw === "" || Number.isNaN(n) ? undefined : n
                          );
                        }}
                        aria-invalid={isInvalid}
                        autoComplete="off"
                        className={inputClass}
                      />
                    ) : isCombobox ? (
                      <Combobox
                        items={comboboxItems}
                        value={displayValue || null}
                        onValueChange={(v: string | null) =>
                          field.handleChange(v ?? undefined)
                        }
                      >
                        <ComboboxInput
                          id={field.name}
                          name={field.name}
                          aria-invalid={isInvalid}
                          className={inputClass}
                        />
                        <ComboboxContent>
                          <ComboboxEmpty>No items found.</ComboboxEmpty>
                          <ComboboxList>
                            {(item: string) => (
                              <ComboboxItem key={item} value={item}>
                                {item}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    ) : (
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={displayValue}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          const raw = e.target.value;
                          field.handleChange(raw || undefined);
                        }}
                        aria-invalid={isInvalid}
                        autoComplete="off"
                        className={inputClass + " resize-y min-h-12"}
                        rows={3}
                      />
                    )}
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }} />
            );
          })}
        </FieldGroup>
        <Button type="submit" className="mt-4 hover:cursor-pointer">
          Save
        </Button>
      </form>
    </>
  );
}
