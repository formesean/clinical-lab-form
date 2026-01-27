import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import NavBar from "@/components/ui/NavBar";
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
import PatientTable from "../../components/ui/PatientTable";

export default function Home() {
  const Date = "Saturday, January 24, 2026"
  const Time = "11:10:32 PM"
  return (
    <div className="flex flex-col min-h-screen bg-[#E6F3ED] space-y-2">
      <NavBar />
      <Separator className="bg-[#B7D7C6]" />

      <div className="flex justify-between items-center h-16 px-20 text-black mt-5">
        <div className="flex flex-col justify-center items-start text-[#135A39]">
          <h1 className="text-2xl text-[#111827] font-bold">Patient Directory</h1>
          <p className="text-[#6B7280]">Ongoing laboratory requests</p>
        </div>
        <div className="flex items-center justify-center space-x-6 text-[#135A39]">
          <div className="flex flex-col items-end">
            <p className="text-[#6B7280]">Philippine Standard Time</p>
            <p className="font-semibold text-[#111827]">{Date},{Time}</p>
          </div>
        </div>
      </div >

      <div className="flex-1 px-20 mt-4">
        <Card className="flex h-140 bg-white">
          <CardHeader className="">
            <div className="flex justify-between">
              <a href="#" className="flex items-center space-x-2 text-[#135A39]">
                <PlusCircleIcon className="h-8 w-8"/>
                    <p className="text-[#135A39] font-semibold">Add Patient</p>
              </a>
              <InputGroup className="w-80 border-[#135A39]">
                <InputGroupInput placeholder="Search..." className="placeholder:text-[#9CA3AF] text-[#111827]"/>
                <InputGroupAddon>
                  <SearchIcon className="text-[#6B9080]"/>
                </InputGroupAddon>
              </InputGroup>
            </div>
            <Separator className="bg-[#DDEAE3]" />
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-110">
              <PatientTable />
              <ScrollBar />
            </ScrollArea>
          </CardContent>
          <CardFooter>

          </CardFooter>
        </Card>
      </div>
    </div >
  );
}
