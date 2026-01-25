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
import PatientTable from "../components/ui/PatientTable";

export default function Home() {
  const Date = "Saturday, January 24, 2026"
  const Time = "11:10:32 PM"
  return (
    <div className="flex flex-col min-h-screen bg-white space-y-2">
      <NavBar />
      <Separator />

      <div className="flex justify-between items-center h-16 px-20 text-black mt-5">
        <div className="flex flex-col justify-center items-start ">
          <h1 className="text-2xl font-bold">Patients</h1>
          <p>Oo lage lista ni</p>
        </div>
        <div className="flex items-center justify-center space-x-6">
          <div className="flex flex-col items-end">
            <p className="">Philippine Standard Time</p>
            <p className="font-semibold">{Date},{Time}</p>
          </div>
        </div>
      </div >

      <div className="flex-1 px-20">
        <Card className="flex h-140 bg-white">
          <CardHeader>
            <div className="flex justify-between">
              <a href="#" className="flex items-center space-x-2">
                <PlusCircleIcon className="h-8 w-8" />
                <p>Add Patient</p>
              </a>
              <InputGroup className="w-80">
                <InputGroupInput placeholder="Search..." />
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
              </InputGroup>
            </div>
            <Separator />
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
