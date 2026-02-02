"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { FormType, Sex } from "@prisma/client"
import type { PatientDTO } from "@/types/api/patients"
import { Button } from "./ui/button"

type Props = {
    onRowClick?: (patientId: string) => void;
};

export default function PatientTable({ onRowClick }: Props) {
    const [patient, setPatient] = useState<PatientDTO[]>([]);

    const q: string | null = null;
    const limit: number | null = 12;
    const cursor: string | null = null;

    const params = new URLSearchParams();
    if (q != null && q !== "") params.set("q", q);
    if (limit != null && limit > 0) params.set("limit", String(limit));
    if (cursor != null && cursor !== "") params.set("cursor", cursor);
    const url = params.toString() ? `/api/patients?${params.toString()}` : "/api/patients";

    const handleFetchPatients = async () => {
        try {
            const fetchPatients = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });

            const data = await fetchPatients.json();

            if (!fetchPatients.ok) {
                if (fetchPatients.status === 422 && data?.error?.details) {
                    console.error("Validation failed:", data.error.details);
                }
                throw new Error(data?.error?.message ?? "Failed to fetch patients");
            }

            setPatient(data.patients)
            console.log("Success:", data);

        } catch (err: unknown) {
            console.error(err instanceof Error ? err.message : err);
        }
    }

    useEffect(() => {
        handleFetchPatients();
    }, []);

    const handleNameWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (el.scrollWidth <= el.clientWidth) return;
        e.preventDefault();
        el.scrollLeft += e.deltaY;
    };

    return (
        <div className="w-full overflow-x-auto">
            <Table className="w-full table-fixed">
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-left text-[#111827]">Patient ID</TableHead>
                        < TableHead className="text-left text-[#111827]"> Name</TableHead >
                        <TableHead className="text-center text-[#111827]">Date Created</TableHead>
                        <TableHead className="text-center text-[#111827]">Status</TableHead>
                    </TableRow >
                </TableHeader >
                <TableBody>
                    {patient.map((patient) => (
                        <TableRow
                            key={patient.id}
                            className={onRowClick ? "cursor-pointer hover:bg-muted/50" : undefined}
                            onClick={() => onRowClick?.(patient.id)}
                        >
                            <TableCell className="text-left  text-[#111827]">
                                {patient.patientIdNum}
                            </TableCell>
                            <TableCell className="text-left text-[#111827] max-w-[180px] min-w-0 relative">
                                <div
                                    className="overflow-x-auto overflow-y-hidden whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-6"
                                    onWheel={handleNameWheel}
                                >
                                    {[patient.lastName, patient.firstName, patient.middleName].filter(Boolean).join(", ")}
                                </div>
                                <div
                                    className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-white to-transparent"
                                    aria-hidden
                                />
                            </TableCell>
                            <TableCell className="text-center text-[#111827]">
                                {new Date(patient.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-center text-[#111827]">
                                Processing
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table >
        </div >
    )
}