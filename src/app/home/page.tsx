"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import NavBar from "@/components/NavBar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SearchIcon } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PatientTable from "@/components/PatientTable";
import AddPatient from "@/components/AddPatient";
import { FieldOverlay } from "@/components/FieldOverlay";
import { useEffect, useRef, useState } from "react";

// Fixed scale - MUST match the mapper's PDF_SCALE exactly
const PDF_SCALE = 1.25;

// Type includes xPx/yPx/wPx/hPx to match the fieldmap JSON
type ChemFieldmap = {
  kind: "pdf" | "image";
  meta: {
    pageCount: number;
    pages: Array<{ page: number; width: number; height: number }>;
    scale?: number;
  };
  fields: Array<{
    key: string;
    page: number;
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
    xPx?: number;
    yPx?: number;
    wPx?: number;
    hPx?: number;
    label?: string;
  }>;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("a");
  const [chemPdfUrl, setChemPdfUrl] = useState<string | null>(null);
  const [chemFieldmap, setChemFieldmap] = useState<ChemFieldmap | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const chemPdfUrlRef = useRef<string | null>(null);

  // PDF rendering - EXACTLY like mapper page
  const [pdfjs, setPdfjs] = useState<any>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [canvasBufferSize, setCanvasBufferSize] = useState({ w: 0, h: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load pdf.js lazily (same as mapper)
  useEffect(() => {
    let mounted = true;
    (async () => {
      // @ts-expect-error - pdfjs-dist build path has no type declarations
      const mod = await import("pdfjs-dist/build/pdf");
      mod.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      if (mounted) setPdfjs(mod);
    })().catch(console.error);
    return () => { mounted = false; };
  }, []);

  // Load CHEM.pdf and fieldmap when tab is active
  useEffect(() => {
    if (activeTab !== "a") {
      if (chemPdfUrlRef.current) {
        URL.revokeObjectURL(chemPdfUrlRef.current);
        chemPdfUrlRef.current = null;
      }
      setChemPdfUrl(null);
      setChemFieldmap(null);
      setPdfDoc(null);
      setPageCount(0);
      setPage(1);
      setCanvasBufferSize({ w: 0, h: 0 });
      return;
    }
    let cancelled = false;
    (async () => {
      const [pdfRes, fieldmapRes] = await Promise.all([
        fetch("/api/templates/CHEM.pdf"),
        fetch("/filemaps/CHEM.fieldmap.json"),
      ]);
      if (cancelled) return;
      if (pdfRes.ok) {
        const blob = await pdfRes.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        chemPdfUrlRef.current = url;
        setChemPdfUrl(url);
      }
      if (fieldmapRes.ok) {
        const data = (await fieldmapRes.json()) as ChemFieldmap;
        if (!cancelled) setChemFieldmap(data);
      }
    })();
    return () => {
      cancelled = true;
      if (chemPdfUrlRef.current) {
        URL.revokeObjectURL(chemPdfUrlRef.current);
        chemPdfUrlRef.current = null;
      }
    };
  }, [activeTab]);

  // Load PDF document from blob URL (same as mapper)
  useEffect(() => {
    if (!pdfjs || !chemPdfUrl) return;
    let cancelled = false;
    (async () => {
      const task = pdfjs.getDocument(chemPdfUrl);
      const doc = await task.promise;
      if (cancelled) return;
      setPdfDoc(doc);
      setPageCount(doc.numPages);
      setPage(1);
    })().catch(console.error);
    return () => { cancelled = true; };
  }, [pdfjs, chemPdfUrl]);

  // Render PDF page - EXACTLY like mapper page
  // Uses fixed PDF_SCALE (1.25) to produce same canvas size as mapper
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      const p = await pdfDoc.getPage(page);
      if (cancelled) return;

      // Use same fixed scale as mapper
      const viewport = p.getViewport({ scale: PDF_SCALE });
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Same as mapper: Math.floor(viewport.width/height)
      const w = Math.floor(viewport.width);
      const h = Math.floor(viewport.height);
      canvas.width = w;
      canvas.height = h;
      if (!cancelled) setCanvasBufferSize({ w, h });

      const renderTask = p.render({ canvasContext: ctx, viewport });
      await renderTask.promise;
    })().catch(console.error);
    return () => { cancelled = true; };
  }, [pdfDoc, page]);

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
                      <TabsTrigger value="a">Clinical Chemistry</TabsTrigger>
                      <TabsTrigger value="b">Hematology</TabsTrigger>
                      <TabsTrigger value="c">Clinical Microscopy</TabsTrigger>
                      <TabsTrigger value="d">Microbiology</TabsTrigger>
                      <TabsTrigger value="e">Immuno-serology</TabsTrigger>
                    </TabsList>
                    <TabsContent value="a">
                      <Card className="p-0">
                        <CardContent className="p-0 pt-7 flex items-center justify-center w-full">
                          {!chemPdfUrl && !pdfDoc && (
                            <div className="text-muted-foreground">
                              Loading CHEM.pdf and fieldmap...
                            </div>
                          )}
                          {pdfDoc && (
                            <div className="p-0">
                              <div className="border border-[#DDEAE3]">
                                {/* Container with relative positioning - EXACTLY like mapper */}
                                <div
                                  className="relative"
                                  style={{
                                    width: `${canvasBufferSize.w}px`,
                                    height: `${canvasBufferSize.h}px`,
                                  }}
                                >
                                  <canvas
                                    ref={canvasRef}
                                    className="block align-top"
                                    style={{
                                      width: `${canvasBufferSize.w}px`,
                                      height: `${canvasBufferSize.h}px`,
                                      display: "block",
                                    }}
                                  />
                                  {/* FieldOverlay positioned exactly like mapper's overlay */}
                                  {chemFieldmap &&
                                    canvasBufferSize.w > 0 &&
                                    canvasBufferSize.h > 0 && (
                                      <FieldOverlay
                                        map={chemFieldmap}
                                        page={page}
                                        pageWidth={canvasBufferSize.w}
                                        pageHeight={canvasBufferSize.h}
                                        values={fieldValues}
                                        onChange={(key, value) =>
                                          setFieldValues((prev) => ({ ...prev, [key]: value }))
                                        }
                                      />
                                    )}
                                </div>
                              </div>
                            </div>
                          )}
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
    </div>
  );
}
