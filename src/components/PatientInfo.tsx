import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export default function PatientInfo() {
    const fetchPatientInfo = async () => {

    }

    return (
        <div>
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
            <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col">
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
        </div>
    );
}