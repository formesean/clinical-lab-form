import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { PatientDTO } from "@/types/api/patients";
import { FormTemplateViewer } from "./FormTemplateViewer";

type PatientIdProp = {
    selectedPatientId: string | null;
};

type FormValuesState = Record<string, Record<string, string>>;

export default function PatientInfo({ selectedPatientId }: PatientIdProp) {
    const [patientInfo, setPatientInfo] = useState<PatientDTO | null>(null);
    const [formValues, setFormValues] = useState<FormValuesState>({});

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
    }, [selectedPatientId]);

    return (
        <div className="min-h-0 overflow-hidden">
            {!selectedPatientId ? (
                <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
                    Select a patient to view details
                </div>
            ) : (
                <>
                    <CardHeader className="">
                        <CardTitle>
                            <span className="font-bold text-xl">{[patientInfo?.lastName, patientInfo?.firstName, patientInfo?.middleName].filter(Boolean).join(", ")}</span>
                        </CardTitle>
                        <CardDescription>
                            <div className="flex flex-col space-y-2">
                                Date Created: {patientInfo?.createdAt
                                    ? new Date(patientInfo.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })
                                    : ""}
                            </div>
                        </CardDescription>
                        <Separator />
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col">
                        {patientInfo && patientInfo.requestedForms.length > 0 && (
                            <div className="flex-1 mt-3">
                                <Tabs defaultValue={patientInfo.requestedForms[0]} className="min-h-0 overflow-hidden">
                                    <TabsList>
                                        {patientInfo.requestedForms.map((formType) => (
                                            <TabsTrigger key={formType} value={formType}>
                                                {formType}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    {patientInfo.requestedForms.map((formType) => (
                                        <TabsContent key={formType} value={formType} className="min-h-0 overflow-hidden">
                                            <Card className="p-0 min-h-0 overflow-hidden">
                                                <CardContent className="p-0 pt-7 flex items-center justify-center w-full min-h-0">
                                                    <FormTemplateViewer
                                                        formType={formType}
                                                        values={formValues[formType] ?? {}}
                                                        onChange={(key, value) =>
                                                            setFormValues((prev) => ({
                                                                ...prev,
                                                                [formType]: {
                                                                    ...(prev[formType] ?? {}),
                                                                    [key]: value,
                                                                },
                                                            }))}
                                                    />
                                                </CardContent>
                                                <CardFooter>
                                                </CardFooter>
                                            </Card>
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>

                    </CardFooter>
                </>
            )}
        </div>
    );
}