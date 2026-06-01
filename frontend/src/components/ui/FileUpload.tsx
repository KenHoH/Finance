"use client";

import React, { useCallback, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  onClear?: () => void;
  value?: File | null;
  className?: string;
}

/**
 * Drag-and-drop file upload with preview.
 */
export function FileUpload({
  accept = "image/*,.pdf,.csv",
  maxSizeMB = 5,
  onFileSelect,
  onClear,
  value,
  className,
}: FileUploadProps){
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if(file && file.size <= maxSizeMB * 1024 * 1024) {
        onFileSelect(file);
      }
    },
    [maxSizeMB, onFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file && file.size <= maxSizeMB * 1024 * 1024) {
        onFileSelect(file);
      }
      e.target.value = "";
    },
    [maxSizeMB, onFileSelect]
  );

  if(value) {
    return (
      <div className={cn("flex items-center gap-3 rounded-xl border border-border bg-accent/30 px-4 py-3", className)}>
        <FileText className="h-5 w-5 text-primary" />
        <div className="flex-1 min-w-0">
          <p className="truncate text-xs font-medium text-foreground">{value.name}</p>
          <p className="text-[10px] text-muted-foreground">{(value.size / 1024).toFixed(1)} KB</p>
        </div>
        <button
          onClick={onClear}
          className="rounded-md p-1 text-muted-foreground hover:text-rose-400 transition-colors"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border bg-accent/20 hover:border-primary/50",
        className
      )}
    >
      <Upload className="h-6 w-6 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">
        Drag & drop or <span className="text-primary">click to browse</span>
      </p>
      <p className="text-[10px] text-muted-foreground">
        Max {maxSizeMB}MB
      </p>
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="sr-only"
      />
    </label>
  );
}
