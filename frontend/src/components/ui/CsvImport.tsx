"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileUpload } from "./FileUpload";
import { DataTable } from "./DataTable";

interface CsvRow {
  id: string;
  date: string;
  description: string;
  amount: string;
  type: string;
  category: string;
  valid: boolean;
  errors: string[];
}

interface CsvImportProps {
  onImport: (rows: Omit<CsvRow, "id" | "valid" | "errors">[]) => void;
  className?: string;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split("\n").filter((l) => l.trim());
  for(const line of lines) {
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for(let i = 0; i < line.length; i++) {
      const char = line[i];
      if(char === '"') {
        if(inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if(char === "," && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cols.push(current.trim());
    rows.push(cols);
  }
  return rows;
}

function validateRow(row: Record<string, string>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if(!row.date || isNaN(new Date(row.date).getTime())) errors.push("Invalid date");
  if(!row.description?.trim()) errors.push("Description required");
  const amt = Number(row.amount);
  if(isNaN(amt) || amt <= 0) errors.push("Amount must be > 0");
  if(!["INCOME", "EXPENSE"].includes(row.type?.toUpperCase())) errors.push("Type must be INCOME or EXPENSE");
  return { valid: errors.length === 0, errors };
}

/**
 * CSV Import component with preview, validation, and bulk import.
 */
export function CsvImport({ onImport, className }: CsvImportProps){
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");

  const handleFileSelect = useCallback(async(selectedFile: File) => {
    setFile(selectedFile);
    const text = await selectedFile.text();
    const rows = parseCSV(text);
    if(rows.length < 2) {
      setPreview([]);
      setStep("preview");
      return;
    }

    const headers = rows[0].map((h) => h.toLowerCase().trim());
    const dataRows = rows.slice(1);
    const parsed: CsvRow[] = [];

    for(let i = 0; i < dataRows.length; i++) {
      const rowData: Record<string, string> = {};
      for(let j = 0; j < headers.length; j++) {
        rowData[headers[j]] = dataRows[i][j] || "";
      }
      const { valid, errors } = validateRow(rowData);
      parsed.push({
        id: `row-${i}`,
        date: rowData.date || rowData["transaction date"] || "",
        description: rowData.description || "",
        amount: rowData.amount || "",
        type: (rowData.type || "EXPENSE").toUpperCase(),
        category: rowData.category || "",
        valid,
        errors,
      });
    }

    setPreview(parsed);
    setStep("preview");
  }, []);

  const handleImport = () => {
    const validRows = preview
      .filter((r) => r.valid)
      .map((r) => ({
        date: r.date,
        description: r.description,
        amount: r.amount,
        type: r.type as "INCOME" | "EXPENSE",
        category: r.category,
      }));
    onImport(validRows);
    setStep("done");
  };

  const validCount = preview.filter((r) => r.valid).length;
  const invalidCount = preview.length - validCount;

  return (
    <div className={cn("space-y-4", className)}>
      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FileUpload
              accept=".csv"
              onFileSelect={handleFileSelect}
              onClear={() => setFile(null)}
              value={file}
            />
            <p className="mt-2 text-[10px] text-muted-foreground">
              CSV columns: date, description, amount, type (INCOME/EXPENSE), category
            </p>
          </motion.div>
        )}

        {step === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  {validCount} valid
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-rose-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {invalidCount} invalid
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setStep("upload"); setFile(null); setPreview([]); }}
                  className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/80"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={validCount === 0}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors",
                    validCount > 0 ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <Upload className="h-3 w-3" />
                  Import {validCount} rows
                </button>
              </div>
            </div>

            <DataTable
              columns={[
                { key: "date", label: "Date" },
                { key: "description", label: "Description" },
                { key: "amount", label: "Amount" },
                { key: "type", label: "Type" },
                {
                  key: "valid",
                  label: "Status",
                  render: (row: CsvRow) => (
                    <span className={cn("text-[10px] font-medium", row.valid ? "text-emerald-400" : "text-rose-400")}>
                      {row.valid ? "Valid" : row.errors.join(", ")}
                    </span>
                  ),
                },
              ]}
              data={preview}
            />
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-foreground">Import Complete</p>
            <p className="text-xs text-muted-foreground">{validCount} transactions imported successfully.</p>
            <button
              onClick={() => { setStep("upload"); setFile(null); setPreview([]); }}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-primary/90"
            >
              Import Another File
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
