"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { PatientDTO } from "@/types/api/patients";

type Props = {
  onRowClick?: (patientId: string) => void;
};

export default function PatientTable({ onRowClick }: Props) {
  const [patients, setPatients] = useState<PatientDTO[]>([]);

  const handleFetchPatients = useCallback(async () => {
    try {
      const res = await fetch("/api/patients?limit=12", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422 && data?.error?.details) {
          console.error("Validation failed:", data.error.details);
        }
        throw new Error(data?.error?.message ?? "Failed to fetch patients");
      }

      setPatients(data.patients);
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : err);
    }
  }, []);

  useEffect(() => {
    void handleFetchPatients();
  }, [handleFetchPatients]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("patient-session-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "PatientSession" },
        () => {
          void handleFetchPatients();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [handleFetchPatients]);

  const handleNameWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollWidth <= el.clientWidth) return;
    e.preventDefault();
    el.scrollLeft += e.deltaY;
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="text-left text-[#111827]">
              Patient ID
            </TableHead>
            <TableHead className="text-left text-[#111827]">Name</TableHead>
            <TableHead className="text-center text-[#111827]">
              Date Created
            </TableHead>
            <TableHead className="text-center text-[#111827]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow
              key={patient.id}
              className={
                onRowClick ? "cursor-pointer hover:bg-muted/50" : undefined
              }
              onClick={() => onRowClick?.(patient.id)}
            >
              <TableCell className="text-left  text-[#111827]">
                {patient.patientIdNum}
              </TableCell>
              <TableCell className="text-left text-[#111827] max-w-[180px] min-w-0 relative">
                <div
                  className="overflow-x-auto overflow-y-hidden whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-6"
                  onWheel={handleNameWheel}
                >
                  {[patient.lastName, patient.firstName, patient.middleName]
                    .filter(Boolean)
                    .join(", ")}
                </div>
                <div
                  className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-white to-transparent"
                  aria-hidden
                />
              </TableCell>
              <TableCell className="text-center text-[#111827]">
                {new Date(patient.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-center text-[#111827]">
                Processing
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
