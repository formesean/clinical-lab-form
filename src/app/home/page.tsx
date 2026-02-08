"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import NavBar from "@/components/NavBar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PlusCircleIcon, SlidersHorizontalIcon, ArrowDownNarrowWide, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge";
import { string } from "zod";
import PatientTable from "@/components/PatientTable";
import AddPatient from "@/components/AddPatient";
import type { PatientDTO } from "@/types/api/patients";
import PatientInfo from "@/components/PatientInfo";

export default function Home() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  console.log(selectedPatientId)

  return (
    <div className="flex flex-col min-h-screen bg-[#E6F3ED]">
      <NavBar></NavBar>
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex flex-1 items-center px-20 gap-5 p-5 min-h-0 w-full">
          <div className="flex-1 min-w-0 h-full flex flex-col">
            <Card className="flex bg-white h-full w-full">
              <CardHeader className="">
                <div className="flex justify-between gap-10">
                  <AddPatient />
                  <InputGroup className="border-[#135A39]">
                    <InputGroupInput placeholder="Search..." className="placeholder:text-[#9CA3AF] text-[#111827] selection:bg-[#135A39] selection:text-white" />
                    <InputGroupAddon>
                      <SearchIcon className="text-[#6B9080] " />
                    </InputGroupAddon>
                  </InputGroup>
                </div>
                <Separator className="bg-[#DDEAE3]" />
              </CardHeader>
              <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col px-5">
                <ScrollArea className="flex-1 min-h-0">
                  <ScrollBar />
                  <PatientTable onRowClick={setSelectedPatientId} />
                </ScrollArea>
              </CardContent>
              <CardFooter>

              </CardFooter>
            </Card>
          </div>
          <div className="flex-2 min-w-0 h-full flex flex-col">
            <Card className="flex flex-1 bg-white h-full w-full min-h-0 overflow-hidden">
              <PatientInfo selectedPatientId={selectedPatientId} />
            </Card>
          </div>
        </div>
      </div>
    </div >
  );
}