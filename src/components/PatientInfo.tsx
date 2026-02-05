import { useEffect, useState } from "react";
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
import type { FormType } from "@prisma/client";
import { PatientDTO } from "@/types/api/patients";
import { buildRequisitionDefaults, formatDisplayDate } from "@/lib/lab-forms";
import { FormTemplateViewer } from "./FormTemplateViewer";
import { ButtonGroup } from "./ui/button-group";
import { Button } from "./ui/button";
import { Download } from "lucide-react";

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

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
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
                      }
                    )
                  : ""}
              </div>
            </CardDescription>
            <Separator />
          </CardHeader>
          <CardContent className="min-h-0 overflow-hidden flex flex-col">
            {patientInfo && patientInfo.requestedForms.length > 0 && (
              <div className="mt-3">
                <Tabs defaultValue={orderedForms[0]}>
                  <div className="flex justify-between items-center">
                    <TabsList>
                      {orderedForms.map((formType) => (
                        <TabsTrigger key={formType} value={formType} className="hover:cursor-pointer">
                          {formType}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <ButtonGroup>
                      <Button
                        className={`hover:cursor-pointer ${isEditing ? "bg-[#135A39] hover:bg-[#13AA39]" : "bg-white"}`}
                        variant={isEditing ? "default" : "outline"}
                        onClick={handleEditToggle}
                      >
                        {isEditing ? "Save" : "Edit"}
                      </Button>
                      <Button className="hover:cursor-pointer" variant="outline" size="icon">
                        <Download />
                      </Button>
                    </ButtonGroup>
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
                            onChange={(key, value) =>
                              setFormValues((prev) => ({
                                ...prev,
                                [formType]: {
                                  ...(prev[formType] ?? {}),
                                  [key]: value,
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
    </div>
  );
}
