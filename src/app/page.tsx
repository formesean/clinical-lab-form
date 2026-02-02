"use client";

import {
  ImageTemplateWithFields,
  type FieldMap,
} from "@/components/ImageTemplateWithFields";
import chemFieldmap from "../../public/filemaps/CHEM.fieldmap.json";
import { useCallback, useEffect, useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              PDF template
            </span>
            <input
              type="file"
              accept="application/pdf"
              onChange={onFileChange}
              className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 dark:text-zinc-400 dark:file:bg-zinc-700 dark:file:text-zinc-200"
            />
          </label>
          {objectUrl ? (
            <ImageTemplateWithFields
              map={chemFieldmap as FieldMap}
              src={objectUrl}
            />
          ) : (
            <p className="rounded border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              Choose a PDF file to display the form with field overlays.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
