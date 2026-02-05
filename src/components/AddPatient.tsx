"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { CircleUserRound, LogOutIcon, PlusCircleIcon } from "lucide-react"
import { Separator } from "./ui/separator"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { DatePicker } from "./DatePicker"
import { FormType, Sex } from "@prisma/client"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "./ui/field"
import { Checkbox } from "./ui/checkbox"

export default function AddPatient() {
    const [fullName, setFullName] = useState<string>("")
    const [patientIdNum, setPatientIdNum] = useState<string>("")
    const [lastName, setLastName] = useState<string>("")
    const [firstName, setFirstName] = useState<string>("")
    const [middleName, setMiddleName] = useState<string>("")
    const [dateOfBirth, setDateOfBirth] = useState<string>("")
    const [age, setAge] = useState<number>(0)
    const [sex, setSex] = useState<Sex>("MALE")
    const [requestingPhysician, setRequestingPhysician] = useState<string>("")
    const [requestedForms, setRequestedForms] = useState<FormType[]>([])
    const [open, setOpen] = useState<boolean>(false)

    const toggleFormType = (formType: FormType, checked: boolean | "indeterminate") => {
        setRequestedForms((prev) =>
            checked === true
                ? prev.includes(formType) ? prev : [...prev, formType]
                : prev.filter((t) => t !== formType)
        )
    }

    const items = [
        { label: "Please select ", value: null },
        { label: "Male", value: "MALE" },
        { label: "Female", value: "FEMALE" },
    ]

    const normalizeDateOfBirth = (value: string) => {
        const trimmed = value.trim()
        if (!trimmed) return ""

        const isoDateMatch = /^\d{4}-\d{2}-\d{2}$/.exec(trimmed)
        if (isoDateMatch) {
            return new Date(`${trimmed}T00:00:00`).toISOString()
        }

        const dmyMatch = /^(\d{1,2})\/([A-Za-z]{3})\/(\d{4})$/.exec(trimmed)
        if (dmyMatch) {
            const day = Number(dmyMatch[1])
            const monthToken = dmyMatch[2].toLowerCase()
            const year = Number(dmyMatch[3])
            const months: Record<string, number> = {
                jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
                jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
            }
            const month = months[monthToken]
            if (!month) return trimmed
            const dd = String(day).padStart(2, "0")
            const mm = String(month).padStart(2, "0")
            return new Date(`${year}-${mm}-${dd}T00:00:00`).toISOString()
        }

        return trimmed
    }

    const handleAddPatient = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const dateOfBirthIso = normalizeDateOfBirth(dateOfBirth)
            const body = {
                patientIdNum,
                lastName,
                firstName,
                middleName: middleName || null,
                dateOfBirth: dateOfBirthIso,
                age,
                sex,
                requestingPhysician: requestingPhysician || null,
                requestedForms,
            };

            const addPatient = await fetch("/api/patients", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(body),
            });

            const data = await addPatient.json();

            if (!addPatient.ok) {
                if (addPatient.status === 422 && data?.error?.details) {
                    console.error("Validation failed:", data.error.details);
                }
                throw new Error(data?.error?.message ?? "Failed to add patient");
            }
            console.log("Success:", data);

            setOpen(false);
        } catch (err: unknown) {
            console.error(err instanceof Error ? err.message : err);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
                <div>
                    <div className="flex items-center space-x-2 text-[#135A39] whitespace-nowrap hover:cursor-pointer">
                        <PlusCircleIcon className="h-8 w-8" />
                        <p className="text-[#135A39] font-semibold">Add Patient</p>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-[#135A39] text-2xl font-bold">Add New Patient</DialogTitle>
                    <DialogDescription>
                        Enter patient details and select requested lab tests.
                    </DialogDescription>
                    <Separator />
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleAddPatient}>
                    <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="requestingPhysician" className="text-[#111827] placeholder:text-[#9CA3AF]">Patient ID No.</Label>
                        <Input
                            id="patientIdNum"
                            type="text"
                            placeholder="P-0001"
                            className="text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white"
                            value={patientIdNum}
                            onChange={(e) => setPatientIdNum(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="lastName" className="text-[#111827] placeholder:text-[#9CA3AF]">Last Name</Label>
                            <Input
                                id="lastName"
                                type="text"
                                placeholder="Uy"
                                className="text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="firstName" className="text-[#111827] placeholder:text-[#9CA3AF]">First Name</Label>
                            <Input
                                id="firstName"
                                type="text"
                                placeholder="Lysander"
                                className="text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="middleName" className="text-[#111827] placeholder:text-[#9CA3AF] ">Middle Name</Label>
                            <Input
                                id="middleName"
                                type="text"
                                placeholder="Sestoso"
                                className="text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white"
                                value={middleName}
                                onChange={(e) => setMiddleName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="dateOfBirth" className="text-[#111827] placeholder:text-[#9CA3AF]">Date of Birth</Label>
                            <Input
                                id="dateOfBirth"
                                type="text"
                                placeholder="dd/mmm/yyyy"
                                className="text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white"
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                            />
                            {/* <DatePicker /> */}
                        </div>

                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="age" className="text-[#111827] placeholder:text-[#9CA3AF]">Age</Label>
                            <Input
                                id="age"
                                type="number"
                                placeholder="22"
                                className="text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white"
                                value={age}
                                onChange={(e) => setAge(Number(e.target.value))}
                            />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="sex" className="text-[#111827] placeholder:text-[#9CA3AF] ">Sex</Label>
                            <Select
                                value={sex}
                                defaultValue={items[0]?.value ?? ""}
                                onValueChange={(value) => setSex(value as Sex)}
                            >
                                <SelectTrigger >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup >
                                        {items
                                            .filter((item) => item.value !== null)
                                            .map((item) => (
                                                <SelectItem key={item.value as string} value={item.value as string}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                    </div>

                    <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="requestingPhysician" className="text-[#111827] placeholder:text-[#9CA3AF]">Name of Requesting Physician</Label>
                        <Input
                            id="requestingPhysician"
                            type="text"
                            placeholder="Esheloristicism Destravius Maximus Jr."
                            className="text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white"
                            value={requestingPhysician}
                            onChange={(e) => setRequestingPhysician(e.target.value)}
                        />
                    </div>
                    <DialogTitle className="text-[#135A39] font-semibold">Requested Lab Test/s</DialogTitle>
                    <DialogDescription>
                        Select the lab tests requested for this patient.
                    </DialogDescription>
                    <Separator />

                    <div className="flex justify-center gap-10">
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="clinChem" className="text-[#111827] whitespace-nowrap ">Clinical Chemistry</Label>
                                <FieldGroup className="max-w-sm flex flex-col">
                                    <div className="flex flex-col space-y-1.5">
                                        <Field orientation="horizontal">
                                            <Checkbox
                                                id="form-chem"
                                                checked={requestedForms.includes(FormType.CHEM)}
                                                onCheckedChange={(checked) => toggleFormType(FormType.CHEM, checked)}
                                            />
                                            <Label htmlFor="form-chem">CHEM</Label>
                                        </Field>
                                        <Field orientation="horizontal">
                                            <Checkbox
                                                id="form-ogtt"
                                                checked={requestedForms.includes(FormType.OGTT)}
                                                onCheckedChange={(checked) => toggleFormType(FormType.OGTT, checked)}
                                            />
                                            <Label htmlFor="form-ogtt">OGTT</Label>
                                        </Field>
                                    </div>
                                </FieldGroup>
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="hema" className="text-[#111827]">Hematology</Label>
                                <FieldGroup className="max-w-sm flex flex-col">
                                    <div className="flex flex-col space-y-1.5">
                                        <Field orientation="horizontal">
                                            <Checkbox
                                                id="form-cbc"
                                                checked={requestedForms.includes(FormType.CBC)}
                                                onCheckedChange={(checked) => toggleFormType(FormType.CBC, checked)}
                                            />
                                            <Label htmlFor="form-cbc">CBC</Label>
                                        </Field>
                                        <Field orientation="horizontal">
                                            <Checkbox
                                                id="form-bt"
                                                checked={requestedForms.includes(FormType.BT)}
                                                onCheckedChange={(checked) => toggleFormType(FormType.BT, checked)}
                                            />
                                            <Label htmlFor="form-bt">BT</Label>
                                        </Field>
                                    </div>
                                </FieldGroup>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="clinMic" className="text-[#111827] whitespace-nowrap">Clinical Microscopy</Label>
                                <FieldGroup className="max-w-sm flex flex-col">
                                    <div className="flex flex-col space-y-1.5">
                                        <Field orientation="horizontal">
                                            <Checkbox
                                                id="form-ua"
                                                checked={requestedForms.includes(FormType.UA)}
                                                onCheckedChange={(checked) => toggleFormType(FormType.UA, checked)}
                                            />
                                            <Label htmlFor="terms-checkbox">UA</Label>
                                        </Field>
                                        <Field orientation="horizontal">
                                            <Checkbox
                                                id="form-se"
                                                checked={requestedForms.includes(FormType.SE)}
                                                onCheckedChange={(checked) => toggleFormType(FormType.SE, checked)}
                                            />
                                            <Label htmlFor="terms-checkbox">SE</Label>
                                        </Field>
                                        <Field orientation="horizontal">
                                            <Checkbox
                                                id="form-pt"
                                                checked={requestedForms.includes(FormType.PT)}
                                                onCheckedChange={(checked) => toggleFormType(FormType.PT, checked)}
                                            />
                                            <Label htmlFor="form-pt">PT</Label>
                                        </Field>
                                        <Field orientation="horizontal">
                                            <Checkbox
                                                id="form-obt"
                                                checked={requestedForms.includes(FormType.OBT)}
                                                onCheckedChange={(checked) => toggleFormType(FormType.OBT, checked)}
                                            />
                                            <Label htmlFor="terms-checkbox">OBT</Label>
                                        </Field>
                                    </div>
                                </FieldGroup>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="immunoSero" className="text-[#111827]">Immuno-Serology</Label>
                                <div className="flex flex-col space-y-1.5">
                                    <Field orientation="horizontal">
                                        <Checkbox
                                            id="form-immuno"
                                            checked={requestedForms.includes(FormType.IMMUNO)}
                                            onCheckedChange={(checked) => toggleFormType(FormType.IMMUNO, checked)}
                                        />
                                        <Label htmlFor="form-immuno">IMMUNO</Label>
                                    </Field>
                                </div>
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="microBio" className="text-[#111827]">Microbiology</Label>
                                <div className="flex flex-col space-y-1.5">
                                    <Field orientation="horizontal">
                                        <Checkbox
                                            id="form-micro"
                                            checked={requestedForms.includes(FormType.MICRO)}
                                            onCheckedChange={(checked) => toggleFormType(FormType.MICRO, checked)}
                                        />
                                        <Label htmlFor="form-micro">MICRO</Label>
                                    </Field>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-[#135A39] text-white hover:bg-[#0f4030] mt-2 hover:cursor-pointer">
                        Submit
                    </Button>
                </form>
            </DialogContent >

        </Dialog >
    )
}
