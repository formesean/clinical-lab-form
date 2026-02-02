import { columns, Patient, Test } from "../app/home/columns"
import DataTable from "../app/home/data-table"

async function getData(): Promise<Patient[]> {
    return [
        {
            id: "2026-029",
            name: "Lysander S. Uy",
            dateReq: "Jan 25, 2026, 8:21 AM",
            status: "Completed",
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