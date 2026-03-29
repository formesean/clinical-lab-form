"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";

type MedTech = {
  id: string;
  fullName: string;
  licenseNum: string;
  createdAt: string;
  updatedAt: string;
};

export default function AdminMedTechsPage() {
  const [medtechs, setMedtechs] = useState<MedTech[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [licenseNum, setLicenseNum] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchMedtechs = async () => {
    try {
      const res = await fetch("/api/admin/medtechs");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setMedtechs(data.medtechs ?? []);
    } catch {
      console.error("Failed to load medtechs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedtechs();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFullName("");
    setLicenseNum("");
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (mt: MedTech) => {
    setEditingId(mt.id);
    setFullName(mt.fullName);
    setLicenseNum(mt.licenseNum);
    setError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!fullName.trim() || !licenseNum.trim()) {
      setError("Both fields are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = editingId
        ? `/api/admin/medtechs/${editingId}`
        : "/api/admin/medtechs";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          licenseNum: licenseNum.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.message ?? "Save failed");
        return;
      }

      setDialogOpen(false);
      await fetchMedtechs();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/medtechs/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.error(data?.error?.message ?? "Delete failed");
      }
      setDeleteConfirmId(null);
      await fetchMedtechs();
    } catch {
      console.error("Delete failed");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#E6F3ED]">
      <NavBar />
      <div className="flex flex-1 items-start justify-center px-20 p-5">
        <Card className="w-full max-w-3xl bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-bold text-xl text-[#135A39]">
                  Medical Technologists
                </CardTitle>
                <CardDescription>
                  Manage medtechs for the "Performed By" fields across all form
                  types.
                </CardDescription>
              </div>
              <Button
                className="bg-[#135A39] hover:bg-[#0d3d2a] hover:cursor-pointer"
                onClick={openCreate}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add MedTech
              </Button>
            </div>
            <Separator className="bg-[#DDEAE3]" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground text-center py-8">
                Loading...
              </div>
            ) : medtechs.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                No medical technologists added yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#135A39]">Full Name</TableHead>
                    <TableHead className="text-[#135A39]">
                      PRC License No.
                    </TableHead>
                    <TableHead className="text-[#135A39] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medtechs.map((mt) => (
                    <TableRow key={mt.id}>
                      <TableCell className="font-medium text-[#111827]">
                        {mt.fullName}
                      </TableCell>
                      <TableCell className="text-[#111827]">
                        {mt.licenseNum}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 hover:cursor-pointer"
                            onClick={() => openEdit(mt)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:cursor-pointer"
                            onClick={() => setDeleteConfirmId(mt.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#135A39]">
              {editingId ? "Edit MedTech" : "Add MedTech"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-[#111827]">
                Full Name
              </Label>
              <Input
                id="fullName"
                placeholder="e.g. Juan A. Dela Cruz, RMT"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border-[#135A39]/40 text-[#111827]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNum" className="text-[#111827]">
                PRC License Number
              </Label>
              <Input
                id="licenseNum"
                placeholder="e.g. 0012345"
                value={licenseNum}
                onChange={(e) => setLicenseNum(e.target.value)}
                className="border-[#135A39]/40 text-[#111827]"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#135A39] hover:bg-[#0d3d2a] hover:cursor-pointer"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#135A39]">
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#111827]">
            Are you sure you want to remove this medical technologist? This
            action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="hover:cursor-pointer"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
