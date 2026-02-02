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
import PatientDirectory from "@/components/PatientDirectory";
import { Badge } from "@/components/ui/badge";
import { string } from "zod";
import PatientTable from "@/components/PatientTable";
import AddPatient from "@/components/AddPatient";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#E6F3ED]">
      <NavBar></NavBar>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 items-center px-20 gap-5 p-5 justify-start">
          <div className="flex-1/3 h-full">
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
              <CardContent>
                <ScrollArea className="">
                  <ScrollBar />
                  <PatientTable></PatientTable>
                </ScrollArea>
              </CardContent>
              <CardFooter>

              </CardFooter>
            </Card>
          </div>
          <div className="flex-2/3 h-full">
            <Card className="flex bg-white h-full w-full">
              <CardHeader className="">
                <CardTitle>
                  <span className="font-bold text-xl">Patient Details</span>
                </CardTitle>
                <CardDescription>
                  <div className="flex flex-col space-y-2">
                    <span>Patient ID:</span>
                    <div className="flex space-x-6">
                      <span>Date of Birth: April 12, 2003</span>
                      <span>Age: 22</span>
                      <span>Sex: Male</span>
                    </div>
                  </div>
                </CardDescription>
                <Separator />
              </CardHeader>
              <CardContent>
                <div className="flex-1">
                  <Tabs>
                    <TabsList>
                      <TabsTrigger value="a">Clinical Chemistry</TabsTrigger>
                      <TabsTrigger value="b">Hematology</TabsTrigger>
                      <TabsTrigger value="c">Clinical Microscopy</TabsTrigger>
                      <TabsTrigger value="d">Microbiology</TabsTrigger>
                      <TabsTrigger value="e">Immuno-serology</TabsTrigger>
                    </TabsList>
                    <TabsContent value="a">
                      <Card className="h-75">
                        <CardContent>
                        </CardContent>
                        <CardFooter>
                        </CardFooter>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
              <CardFooter>

              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div >
  );
}
