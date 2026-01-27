"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Divide, MoreHorizontal, Info } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

const badgeColors: Record<string, string> = {
    "Clinical Chemistry": "bg-[#C2E0F0]",
    "Hematology": "bg-[#F1C2C4]",
    "Clinical Microscopy": "bg-[#F5E8A5]",
    "Immuno-Serology": "bg-[#D8C1E6]",
    "Microbiology": "bg-[#C7E9E0]",
}

const textColors: Record<string, string> = {
    "Clinical Chemistry": "text-[#0A4E66]",
    "Hematology": "text-[#9A1F22]",
    "Clinical Microscopy": "text-[#7A6A0F]",
    "Immuno-Serology": "text-[#5D2C8C]",
    "Microbiology": "text-[#135A39]",
}

export type SubTest = {
    name: string
    status: "Pending" | "Processing" | "Completed"
}

export type Test = {
    name: string
    shortName: string
    subTests: SubTest[]
}

export type Patient = {
    id: string
    name: string
    dateReq: string
    status: "Pending" | "Processing" | "Completed"
    tests: Test[]
}

function getClinicStatus(subTests: SubTest[]): "Pending" | "Processing" | "Completed" {
    if (subTests.every((t) => t.status === "Completed")) return "Completed"
    if (subTests.some((t) => t.status === "Processing")) return "Processing"
    return "Pending"
}

export const columns: ColumnDef<Patient>[] = [
    {
        accessorKey: "id",
        header: () => <div className="text-left text-[#111827]">Patient ID</div>,
        cell: ({ row }) => <div className="text-left w-fit text-[#111827]">{row.original.id}</div>
    },
    {
        accessorKey: "name",
        header: () => <div className="text-left text-[#111827]">Name</div>,
        cell: ({ row }) => <div className="text-left w-fit text-[#111827]">{row.original.name}</div>
    },
    {
        accessorKey: "dateReq",
        header: () =>
            <div className="flex items-center text-left text-[#111827] justify-around">Date Requested</div>,
        cell: ({ row }) => <div className="text-right w-fit text-[#111827]">{row.original.dateReq}</div>
    },
    {
        accessorKey: "status",
        header: () => <div className="text-center text-[#111827]">Status</div>,
        cell: ({ row }) => <div className="text-center text-[#111827]">{row.original.status}</div>
    },
    {
        accessorKey: "tests",
        header: () =>
            <div className="flex items-center justify-center text-center text-[#111827] space-x-1">
                <span>Laboratory Section</span>
                <Info className="size-3 items" />
            </div>,
        cell: ({ row }) => (
            <div className="flex flex-wrap gap-2 text-[#111827] px-4">
                {row.original.tests.map((clinic) => {
                    const clinicStatus = getClinicStatus(clinic.subTests)

                    const dotColor =
                        clinicStatus === "Pending"
                            ? "bg-gray-300"
                            : clinicStatus === "Processing"
                                ? "bg-yellow-300"
                                : "bg-green-300"

                    return (
                        <div key={clinic.name} className="flex items-center gap-1 space-x-2">
                            <div className={`justify-start rounded-full h-2.5 w-2.5 ${dotColor}`} />
                            <Badge variant="secondary" className={`${textColors[clinic.name] || "text-gray-400"} h-4 rounded-full w-fit ${badgeColors[clinic.name] || "bg-gray-400"}`}>
                                {clinic.shortName.toUpperCase()}
                            </Badge>
                        </div>
                    )
                })}
            </div>
        ),
    },
]
