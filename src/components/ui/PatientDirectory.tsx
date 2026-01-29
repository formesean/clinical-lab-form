import { columns, Patient, Test } from "../../app/home/columns"
import DataTable from "../../app/home/data-table"

async function getData(): Promise<Patient[]> {
    return [
        {
            id: "2026-029",
            name: "Lysander S. Uy",
            dateReq: "Jan 25, 2026, 8:21 AM",
            status: "Completed",
            tests: [
                {
                    name: "Hematology",
                    shortName: "HEMA",
                    subTests: [
                        { name: "CBC", status: "Completed" },
                        { name: "Bloodtyping", status: "Completed" }
                    ]
                },
                {
                    name: "Microbiology",
                    shortName: "MICRO",
                    subTests: [{ name: "UA", status: "Completed" }]
                },
                {
                    name: "Clinical Microscopy",
                    shortName: "CLIN MIC",
                    subTests: [{ name: "UA", status: "Completed" }]
                },
                {
                    name: "Immuno-Serology",
                    shortName: "IMMUNO",
                    subTests: [{ name: "UA", status: "Completed" }]
                },
                {
                    name: "Clinical Chemistry",
                    shortName: "CLIN CHEM",
                    subTests: [{ name: "UA", status: "Processing" }]
                },
            ]
        },
        {
            id: "2026-029",
            name: "Sean Karl Tyrese Aguilar",
            dateReq: "Jan 25, 2026, 11:52 AM",
            status: "Processing",
        },
    ]
}
export default async function PatientDirectory() {
    const data = await getData()

    return (
        < DataTable columns={columns} data={data} />
    )
}