import type { FormType } from "@prisma/client";
import { Download, FileText, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { applyInputRules } from "@/lib/form-inputs";
import { buildRequisitionDefaults, formatDisplayDate } from "@/lib/lab-forms";
import type { PatientDTO } from "@/types/api/patients";
import { FormTemplateViewer } from "./FormTemplateViewer";
import { Button } from "./ui/button";
import { ButtonGroup } from "./ui/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Toast } from "./ui/toast";

type PatientIdProp = {
  selectedPatientId: string | null;
};

type FormValuesState = Record<string, Record<string, string>>;

const FORM_ORDER = [
  "CHEM",
  "OGTT",
  "CBC",
  "BT",
  "UA",
  "SE",
  "PT",
  "OBT",
  "IMMUNO",
  "MICRO",
] as const;

export default function PatientInfo({ selectedPatientId }: PatientIdProp) {
  const [patientInfo, setPatientInfo] = useState<PatientDTO | null>(null);
  const [formValues, setFormValues] = useState<FormValuesState>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [activeFormType, setActiveFormType] = useState<string | null>(null);
  const [lockTokens, setLockTokens] = useState<Record<string, string>>({});
  const [chemUnitMode, setChemUnitMode] = useState<"CU" | "SI">("CU");
  const lastLockedFormRef = useRef<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPatientInfo = async (id: string) => {
    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422 && data?.error?.details) {
          console.error("Validation failed:", data.error.details);
        }
        throw new Error(data?.error?.message ?? "Failed to fetch patient info");
      }

      setPatientInfo(data.patient as PatientDTO);
      console.log("Success:", data);
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : err);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      void fetchPatientInfo(selectedPatientId);
    } else {
      setPatientInfo(null);
    }
    setIsEditing(false);
    setLockTokens({});
    setFormValues({});
    lastLockedFormRef.current = null;
    setChemUnitMode("CU");
  }, [selectedPatientId]);

  const orderedForms = patientInfo?.requestedForms
    ? [...patientInfo.requestedForms].sort((a, b) => {
        const aIndex = FORM_ORDER.indexOf(a as (typeof FORM_ORDER)[number]);
        const bIndex = FORM_ORDER.indexOf(b as (typeof FORM_ORDER)[number]);

        const safeAIndex = aIndex === -1 ? Number.POSITIVE_INFINITY : aIndex;
        const safeBIndex = bIndex === -1 ? Number.POSITIVE_INFINITY : bIndex;

        if (safeAIndex !== safeBIndex) {
          return safeAIndex - safeBIndex;
        }

        return a.localeCompare(b);
      })
    : [];

  const handleEditToggle = async () => {
    if (!patientInfo) return;
    const formType = activeFormType ?? orderedForms[0];
    if (!formType) return;
    if (!isEditing) {
      try {
        const tokens = await acquireLocks([formType]);
        setLockTokens((prev) => ({ ...prev, ...tokens }));
        lastLockedFormRef.current = formType;
        setIsEditing(true);
      } catch (err) {
        console.error(err instanceof Error ? err.message : err);
      }
      return;
    }

    try {
      setIsSaving(true);
      await saveForms([formType], lockTokens);
      await releaseLocks([formType], lockTokens);
      setLockTokens((prev) => {
        const next = { ...prev };
        delete next[formType];
        return next;
      });
      lastLockedFormRef.current = null;
      setIsEditing(false);
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
    } finally {
      setIsSaving(false);
    }
  };

  const patientFieldValues: Record<string, string> = patientInfo
    ? {
        "patient.patientIdNum": patientInfo.patientIdNum ?? "",
        "patient.lastName": patientInfo.lastName ?? "",
        "patient.firstName": patientInfo.firstName ?? "",
        "patient.middleName": patientInfo.middleName ?? "",
        "patient.dateOfBirth": (() => {
          if (!patientInfo.dateOfBirth) return "";
          const parsed = new Date(patientInfo.dateOfBirth);
          return Number.isNaN(parsed.getTime())
            ? patientInfo.dateOfBirth
            : formatDisplayDate(parsed);
        })(),
        "patient.age": String(patientInfo.age ?? ""),
        "patient.sex": patientInfo.sex ?? "",
        "patient.requestingPhysician": patientInfo.requestingPhysician ?? "",
      }
    : {};

  const handleDownload = async () => {
    if (!patientInfo) return;
    const formType = activeFormType ?? orderedForms[0];
    if (!formType) return;
    if (formType !== "CHEM") return;

    const unit = chemUnitMode === "SI" ? "si" : "conv";
    const dataToExport = {
      ...(patientInfo
        ? buildRequisitionDefaults(
            formType as FormType,
            new Date(patientInfo.createdAt),
          )
        : {}),
      ...(formValues[formType] ?? {}),
      ...patientFieldValues,
    };

    const res = await fetch("/api/forms/export-excel/chem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formType,
        sex: patientInfo.sex,
        unit,
        data: dataToExport,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      console.error(err?.error ?? "Failed to export");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const match = disposition.match(/filename="([^"]+)"/);
    a.href = url;
    a.download = match?.[1] ?? `${formType}_${unit}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showToastMessage = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 4000);
  };

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    [],
  );

  const handleDownloadPdf = async () => {
    if (!patientInfo) return;
    const formType = activeFormType ?? orderedForms[0];
    if (!formType) return;
    if (formType !== "CHEM") return;

    const unit = chemUnitMode === "SI" ? "si" : "conv";
    const dataToExport = {
      ...(patientInfo
        ? buildRequisitionDefaults(
            formType as FormType,
            new Date(patientInfo.createdAt),
          )
        : {}),
      ...(formValues[formType] ?? {}),
      ...patientFieldValues,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      setIsExportingPdf(true);
      const res = await fetch("/api/forms/export-pdf/chem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType,
          sex: patientInfo.sex,
          unit,
          data: dataToExport,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        if (res.status === 503 || err?.error?.code === "QUOTA_EXHAUSTED") {
          showToastMessage("PDF quota exhausted — downloading Excel instead.");
          void handleDownload();
          return;
        }
        console.error(err?.error ?? "Failed to export PDF");
        showToastMessage("PDF conversion failed. Please try again.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      a.href = url;
      a.download = match?.[1] ?? `${formType}_${unit}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToastMessage("PDF request timed out — downloading Excel instead.");
      void handleDownload();
    } finally {
      clearTimeout(timeoutId);
      setIsExportingPdf(false);
    }
  };

  useEffect(() => {
    if (!patientInfo || !patientInfo.requestedForms.length) {
      setActiveFormType(null);
      return;
    }
    if (!activeFormType) {
      setActiveFormType(patientInfo.requestedForms[0] ?? null);
    }
  }, [patientInfo, activeFormType]);

  useEffect(() => {
    if (!patientInfo || !isEditing) return;
    const nextForm = activeFormType ?? null;
    const prevForm = lastLockedFormRef.current;
    if (!nextForm || nextForm === prevForm) return;
    let cancelled = false;
    (async () => {
      try {
        if (prevForm && lockTokens[prevForm]) {
          await releaseLocks([prevForm], lockTokens);
        }
        const tokens = await acquireLocks([nextForm]);
        if (cancelled) return;
        setLockTokens((prev) => ({ ...prev, ...tokens }));
        lastLockedFormRef.current = nextForm;
      } catch (err) {
        console.error(err instanceof Error ? err.message : err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeFormType, isEditing, patientInfo, lockTokens]);

  useEffect(() => {
    if (!patientInfo) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/patients/${patientInfo.id}/forms`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.forms || cancelled) return;

      const nextValues: FormValuesState = {};
      for (const form of data.forms as Array<{
        formType: string;
        data?: Record<string, unknown>;
      }>) {
        const raw = form.data && typeof form.data === "object" ? form.data : {};
        const entries = Object.entries(raw).map(([k, v]) => [
          k,
          v == null ? "" : String(v),
        ]);
        nextValues[form.formType] = Object.fromEntries(entries);
      }
      if (!cancelled) setFormValues(nextValues);
    })();
    return () => {
      cancelled = true;
    };
  }, [patientInfo]);

  const acquireLocks = async (forms: string[]) => {
    if (!patientInfo) return {};
    const tokens: Record<string, string> = {};
    for (const formType of forms) {
      const res = await fetch(
        `/api/patients/${patientInfo.id}/forms/${formType}/lock`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lockToken: lockTokens[formType] }),
        },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.lockToken) {
        throw new Error(
          data?.error?.message ?? `Failed to acquire lock for ${formType}`,
        );
      }
      tokens[formType] = data.lockToken as string;
    }
    return tokens;
  };

  const releaseLocks = async (
    forms: string[],
    tokens: Record<string, string>,
  ) => {
    if (!patientInfo) return;
    await Promise.all(
      forms.map((formType) =>
        fetch(`/api/patients/${patientInfo.id}/forms/${formType}/lock`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lockToken: tokens[formType] }),
        }).catch(() => null),
      ),
    );
  };

  const saveForms = async (forms: string[], tokens: Record<string, string>) => {
    if (!patientInfo) return;
    for (const formType of forms) {
      const dataToSave = {
        ...(patientInfo
          ? buildRequisitionDefaults(
              formType as FormType,
              new Date(patientInfo.createdAt),
            )
          : {}),
        ...(formValues[formType] ?? {}),
        ...patientFieldValues,
      };
      const res = await fetch(
        `/api/patients/${patientInfo.id}/forms/${formType}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lockToken: tokens[formType],
            data: dataToSave,
          }),
        },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error?.message ?? `Failed to save ${formType}`);
      }
    }
  };

  useEffect(() => {
    const handler = async (event: Event) => {
      const customEvent = event as CustomEvent<{ done?: () => void }>;
      const done = customEvent.detail?.done;
      if (!patientInfo || !isEditing) {
        done?.();
        return;
      }

      const formType = activeFormType ?? orderedForms[0];
      if (!formType) {
        done?.();
        return;
      }

      try {
        setIsSaving(true);
        if (lockTokens[formType]) {
          await saveForms([formType], lockTokens);
          await releaseLocks([formType], lockTokens);
          setLockTokens((prev) => {
            const next = { ...prev };
            delete next[formType];
            return next;
          });
        }
      } catch (err) {
        console.error(err instanceof Error ? err.message : err);
      } finally {
        setIsSaving(false);
        setIsEditing(false);
        done?.();
      }
    };

    window.addEventListener("auth-expired", handler as EventListener);
    return () => {
      window.removeEventListener("auth-expired", handler as EventListener);
    };
  }, [activeFormType, isEditing, lockTokens, orderedForms, patientInfo]);

  return (
    <div>
      {!selectedPatientId ? (
        <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
          Select a patient to view details
        </div>
      ) : (
        <>
          <CardHeader className="">
            <CardTitle>
              <span className="font-bold text-xl">
                {[
                  patientInfo?.lastName,
                  patientInfo?.firstName,
                  patientInfo?.middleName,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </CardTitle>
            <CardDescription>
              <div className="flex flex-col space-y-2">
                Date Created:{" "}
                {patientInfo?.createdAt
                  ? new Date(patientInfo.createdAt).toLocaleDateString(
                      "en-PH",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )
                  : ""}
              </div>
            </CardDescription>
            <Separator />
          </CardHeader>
          <CardContent className="min-h-0 overflow-hidden flex flex-col">
            {patientInfo && patientInfo.requestedForms.length > 0 && (
              <div className="mt-3">
                <Tabs
                  value={activeFormType ?? orderedForms[0]}
                  onValueChange={setActiveFormType}
                >
                  <div className="flex justify-between items-center">
                    <TabsList>
                      {orderedForms.map((formType) => (
                        <TabsTrigger
                          key={formType}
                          value={formType}
                          className="hover:cursor-pointer"
                        >
                          {formType}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <div className="flex items-center gap-2">
                      {isEditing && activeFormType === "CHEM" && (
                        <ButtonGroup>
                          <Button
                            type="button"
                            variant={
                              chemUnitMode === "CU" ? "default" : "outline"
                            }
                            className={
                              chemUnitMode === "CU"
                                ? "bg-[#135A39] hover:bg-[#13AA39]"
                                : ""
                            }
                            onClick={() => setChemUnitMode("CU")}
                          >
                            Conv.
                          </Button>
                          <Button
                            type="button"
                            variant={
                              chemUnitMode === "SI" ? "default" : "outline"
                            }
                            className={
                              chemUnitMode === "SI"
                                ? "bg-[#135A39] hover:bg-[#13AA39]"
                                : ""
                            }
                            onClick={() => setChemUnitMode("SI")}
                          >
                            SI
                          </Button>
                        </ButtonGroup>
                      )}
                      <ButtonGroup>
                        <Button
                          className={`hover:cursor-pointer ${isEditing ? "bg-[#135A39] hover:bg-[#13AA39]" : "bg-white"}`}
                          variant={isEditing ? "default" : "outline"}
                          onClick={handleEditToggle}
                          disabled={isSaving}
                        >
                          {isSaving ? "Saving..." : isEditing ? "Save" : "Edit"}
                        </Button>
                        <Button
                          className="hover:cursor-pointer"
                          variant="outline"
                          size="icon"
                          onClick={handleDownload}
                          disabled={isExportingPdf}
                        >
                          <Download />
                        </Button>
                        <Button
                          className="hover:cursor-pointer"
                          variant="outline"
                          size="icon"
                          onClick={handleDownloadPdf}
                          title="Download PDF"
                          disabled={isExportingPdf}
                        >
                          <FileText />
                        </Button>
                      </ButtonGroup>
                    </div>
                  </div>

                  {orderedForms.map((formType) => (
                    <TabsContent key={formType} value={formType}>
                      <Card className="p-0">
                        <CardContent className="p-0 pt-7 flex items-center justify-center w-full">
                          <FormTemplateViewer
                            formType={formType}
                            values={{
                              ...(patientInfo
                                ? buildRequisitionDefaults(
                                    formType as FormType,
                                    new Date(patientInfo.createdAt),
                                  )
                                : {}),
                              ...(formValues[formType] ?? {}),
                              ...patientFieldValues,
                            }}
                            isEditable={isEditing}
                            patientSex={patientInfo?.sex}
                            patientDateOfBirth={patientInfo?.dateOfBirth}
                            patientCreatedAt={patientInfo?.createdAt}
                            patientAgeYears={patientInfo?.age}
                            chemUnitMode={
                              activeFormType === "CHEM"
                                ? chemUnitMode
                                : undefined
                            }
                            onChange={(key, value) =>
                              setFormValues((prev) => ({
                                ...prev,
                                [formType]: {
                                  ...(prev[formType] ?? {}),
                                  ...applyInputRules({
                                    key,
                                    value,
                                    values: prev[formType] ?? {},
                                    sex: patientInfo?.sex ?? null,
                                  }),
                                },
                              }))
                            }
                          />
                        </CardContent>
                        <CardFooter></CardFooter>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </CardContent>
        </>
      )}
      {isExportingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-background px-8 py-7 shadow-2xl">
            <LoaderCircle className="size-12 animate-spin text-[#135A39]" />
            <div className="text-center">
              <p className="font-semibold text-foreground">Generating PDF</p>
              <p className="text-sm text-muted-foreground">
                Please wait while we prepare your file.
              </p>
            </div>
          </div>
        </div>
      )}
      <Toast message={toastMessage} visible={showToast} variant="warning" />
    </div>
  );
}
