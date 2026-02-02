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

export interface Patients extends PatientDTO { }

export default function PatientTable() {
    const [patients, setPatients] = useState<PatientDTO[]>([])

    const handleFetchPatients = async () => {
        try {
            const fetchPatients = await fetch("/api/patients", {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await fetchPatients.json();

            if (!fetchPatients.ok) {
                if (fetchPatients.status === 422 && data?.error?.details) {
                    console.error("Validation failed:", data.error.details);
                }
                throw new Error(data?.error?.message ?? "Failed to fetch patients");
            }

            setPatients(data.patients)
            console.log("Success:", data);

        } catch (err: unknown) {
            console.error(err instanceof Error ? err.message : err);
        }
    }

    return (
        <div className="w-full overflow-x-auto">
            <Button onClick={handleFetchPatients}></Button>
            <Table className="w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-left text-[#111827]">Patient ID</TableHead>
                        < TableHead className="text-left text-[#111827]" > Name</TableHead >
                        <TableHead className="text-left text-[#111827]">Date Requested</TableHead>
                        <TableHead className="text-left text-[#111827]">Status</TableHead>
                    </TableRow >
                </TableHeader >
                <TableBody>
                    <TableRow>
                        <TableCell className="text-left  text-[#111827]">
                            2026-029-CC
                        </TableCell>
                        <TableCell className="text-left text-[#111827] overflow-hidden ">
                            Lysander S. Uy
                        </TableCell>
                        <TableCell className="text-center text-[#111827]">
                            January 23, 2026
                        </TableCell>
                        <TableCell className="text-left text-[#111827]">
                            Processing
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table >
        </div >
    )
}