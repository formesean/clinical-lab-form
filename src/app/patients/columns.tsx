"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Divide, MoreHorizontal } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

const clinicColors: Record<string, string> = {
    "Clinical Chemistry": "bg-blue-500",
    "Hematology": "bg-red-500",
    "Clinical Microscopy": "bg-yellow-500",
    "Immuno-Serology": "bg-violet-500",
    "Microbiology": "bg-green-500",
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
        header: () => <div className="text-left">Patient ID</div>,
        cell: ({ row }) => <div className="text-left w-fit">{row.original.id}</div>
    },
    {
        accessorKey: "name",
        header: () => <div className="text-left">Name</div>,
        cell: ({ row }) => <div className="text-left w-fit">{row.original.name}</div>
    },
    {
        accessorKey: "dateReq",
        header: () => <div className="text-left">Date Requested</div>,
        cell: ({ row }) => <div className="text-right w-fit">{row.original.dateReq}</div>
    },
    {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => <div className="text-center">{row.original.status}</div>
    },
    {
        accessorKey: "tests",
        header: () => <div className="text-center">Test Status</div>,
        cell: ({ row }) => (
            <div className="flex flex-wrap gap-2 justify-center">
                {row.original.tests.map((clinic) => {
                    const clinicStatus = getClinicStatus(clinic.subTests)

                    const dotColor =
                        clinicStatus === "Pending"
                            ? "bg-gray-500"
                            : clinicStatus === "Processing"
                                ? "bg-yellow-500"
                                : "bg-green-500"

                    return (
                        <div key={clinic.name} className="flex items-center gap-1">
                            <div className={`rounded-full h-2.5 w-2.5 ${dotColor}`} />
                            <Badge variant="secondary" className={`text-white rounded-full w-fit ${clinicColors[clinic.name] || "bg-gray-400"}`}>
                                {clinic.shortName.toUpperCase()}
                            </Badge>
                        </div>
                    )
                })}
            </div>
        ),
    },
]
