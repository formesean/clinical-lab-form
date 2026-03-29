"use client";

import { SearchIcon } from "lucide-react";
import { useState } from "react";
import AddPatient from "@/components/AddPatient";
import NavBar from "@/components/NavBar";
import PatientInfo from "@/components/PatientInfo";
import PatientTable from "@/components/PatientTable";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );

  return (
    <div className="min-h-screen bg-[#E6F3ED]">
      <NavBar />
      <div className="px-20 py-5">
        <div className="flex w-full items-start gap-5">
          <div className="flex min-w-0 flex-1 flex-col">
            <Card className="flex min-h-[calc(100vh-6.75rem)] w-full flex-col bg-white">
              <CardHeader className="">
                <div className="flex justify-between gap-10">
                  <AddPatient />
                  <InputGroup className="border-[#135A39]">
                    <InputGroupInput
                      placeholder="Search..."
                      className="placeholder:text-[#9CA3AF] text-[#111827] selection:bg-[#135A39] selection:text-white"
                    />
                    <InputGroupAddon>
                      <SearchIcon className="text-[#6B9080] " />
                    </InputGroupAddon>
                  </InputGroup>
                </div>
                <Separator className="bg-[#DDEAE3]" />
              </CardHeader>
              <CardContent className="flex-1 min-h-0 flex flex-col px-5 overflow-auto">
                <ScrollArea className="flex-1 min-h-0">
                  <ScrollBar />
                  <PatientTable onRowClick={setSelectedPatientId} />
                </ScrollArea>
              </CardContent>
              <CardFooter></CardFooter>
            </Card>
          </div>
          <div className="flex min-w-0 flex-[2] flex-col">
            <Card className="flex min-h-[calc(100vh-6.75rem)] w-full flex-col overflow-hidden bg-white">
              <PatientInfo selectedPatientId={selectedPatientId} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
