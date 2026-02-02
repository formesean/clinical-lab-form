"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import NavBar from "@/components/NavBar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SearchIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PatientTable from "@/components/PatientTable";
import AddPatient from "@/components/AddPatient";
import { FormTemplateViewer } from "@/components/FormTemplateViewer";
import { useState } from "react";

// Form type per tab (must match template filename and fieldmap: {formType}.pdf, {formType}.fieldmap.json)
const FORM_TYPE_BY_TAB: Record<string, string> = {
  a: "CHEM",
  b: "OGTT",
  c: "CBC",
  d: "BT",
  e: "UA",
  f: "SE",
  g: "PT",
  h: "OBT",
  i: "IMMUNO",
  j: "MICRO"
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("a");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  return (
    <div className="flex flex-col min-h-screen bg-[#E6F3ED]">
      <NavBar />
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
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="a">CHEM</TabsTrigger>
                      <TabsTrigger value="b">OGTT</TabsTrigger>
                      <TabsTrigger value="c">CBC</TabsTrigger>
                      <TabsTrigger value="d">BT</TabsTrigger>
                      <TabsTrigger value="e">UA</TabsTrigger>
                      <TabsTrigger value="f">SE</TabsTrigger>
                    </TabsList>
                    <TabsContent value="a">
                      <Card className="p-0">
                        <CardContent className="p-0 pt-7 flex items-center justify-center w-full">
                          <FormTemplateViewer
                            formType={FORM_TYPE_BY_TAB.a}
                            values={fieldValues}
                            onChange={(key, value) =>
                              setFieldValues((prev) => ({ ...prev, [key]: value }))
                            }
                          />
                        </CardContent>
                        <CardFooter />
                      </Card>
                    </TabsContent>
                    <TabsContent value="b">
                      <Card className="p-0">
                        <CardContent className="p-0 pt-7 flex items-center justify-center w-full">
                          <FormTemplateViewer
                            formType={FORM_TYPE_BY_TAB.b}
                            values={fieldValues}
                            onChange={(key, value) =>
                              setFieldValues((prev) => ({ ...prev, [key]: value }))
                            }
                          />
                        </CardContent>
                        <CardFooter />
                      </Card>
                    </TabsContent>
                    <TabsContent value="c">
                      <Card className="p-0">
                        <CardContent className="p-0 pt-7 flex items-center justify-center w-full">
                          <FormTemplateViewer
                            formType={FORM_TYPE_BY_TAB.c}
                            values={fieldValues}
                            onChange={(key, value) =>
                              setFieldValues((prev) => ({ ...prev, [key]: value }))
                            }
                          />
                        </CardContent>
                        <CardFooter />
                      </Card>
                    </TabsContent>
                    <TabsContent value="d">
                      <Card className="p-0">
                        <CardContent className="p-0 pt-7 flex items-center justify-center w-full">
                          <FormTemplateViewer
                            formType={FORM_TYPE_BY_TAB.d}
                            values={fieldValues}
                            onChange={(key, value) =>
                              setFieldValues((prev) => ({ ...prev, [key]: value }))
                            }
                          />
                        </CardContent>
                        <CardFooter />
                      </Card>
                    </TabsContent>
                    <TabsContent value="e">
                      <Card className="p-0">
                        <CardContent className="p-0 pt-7 flex items-center justify-center w-full">
                          <FormTemplateViewer
                            formType={FORM_TYPE_BY_TAB.e}
                            values={fieldValues}
                            onChange={(key, value) =>
                              setFieldValues((prev) => ({ ...prev, [key]: value }))
                            }
                          />
                        </CardContent>
                        <CardFooter />
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
    </div>
  );
}
