import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { PatientDTO } from "@/types/api/patients";

type PatientIdProp = {
    selectedPatientId: string | null;
};

export default function PatientInfo({ selectedPatientId }: PatientIdProp) {
    const [patientInfo, setPatientInfo] = useState<PatientDTO | null>(null);

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
        <div>
            <CardHeader className="">
                <CardTitle>
                    <span className="font-bold text-xl">{[patientInfo?.lastName, patientInfo?.firstName, patientInfo?.middleName].filter(Boolean).join(", ")}</span>
                </CardTitle>
                <CardDescription>
                    <div className="flex flex-col space-y-2">
                        <span>{patientInfo?.patientIdNum}</span>
                        <div className="flex space-x-6">
                            <span>Date of Birth: April 12, 2003</span>
                            <span>Age: 22</span>
                            <span>Sex: Male</span>
                        </div>
                    </div>
                </CardDescription>
                <Separator />
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {patientInfo && patientInfo.requestedForms.length > 0 && (
                    <div className="flex-1 ">
                        <Tabs defaultValue={patientInfo.requestedForms[0]}>
                            <TabsList>
                                {patientInfo.requestedForms.map((formType) => (
                                    <TabsTrigger key={formType} value={formType}>
                                        {formType}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {patientInfo.requestedForms.map((formType) => (
                                <TabsContent key={formType} value={formType}>
                                    <Card className="h-75">
                                        <CardContent>
                                            <p>Form type: {formType}</p>
                                        </CardContent>
                                        <CardFooter>
                                        </CardFooter>
                                    </Card>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                )}
            </CardContent >
            <CardFooter>

            </CardFooter>
        </div >
    );
}