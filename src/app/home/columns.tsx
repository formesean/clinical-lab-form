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
]
