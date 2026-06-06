"use client";

import React from "react";
import { FileText, Camera, Loader2, ArrowLeft } from "lucide-react";

interface SplitBillWizardProps {
  receiptPreview: string;
  setReceiptPreview: (v: string) => void;
  receiptFileInputRef: React.RefObject<HTMLInputElement | null>;
  handleReceiptFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setReceiptFile: React.Dispatch<React.SetStateAction<File | null>>;
  setScannedItems: React.Dispatch<React.SetStateAction<{ item: string; price: number; quantity: number }[]>>;
  scannedItems: { item: string; price: number; quantity: number }[];
  isScanning: boolean;
  onOpenReviewModal: () => void;
  formatCurrency: (n: number) => string;
}

export const SplitBillWizard: React.FC<SplitBillWizardProps> = ({
  receiptPreview,
  setReceiptPreview,
  receiptFileInputRef,
  handleReceiptFileChange,
  setReceiptFile,
  setScannedItems,
  scannedItems,
  isScanning,
  onOpenReviewModal,
  formatCurrency,
}) => {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Receipt Image{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (optional — auto-fills items)
          </span>
        </label>
        {!receiptPreview ? (
          <div
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors bg-card"
            onClick={() => receiptFileInputRef.current?.click()}
          >
            <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Click to upload receipt</p>
            <p className="text-xs text-muted-foreground">PNG, JPEG, WebP up to 5MB</p>
            <input
              ref={receiptFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleReceiptFileChange}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative rounded-xl overflow-hidden border border-border bg-card">
              <img
                src={receiptPreview}
                alt="Receipt preview"
                className="w-full max-h-48 object-contain bg-black/20"
              />
            </div>
            {isScanning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Scanning receipt...
                  </span>
                </div>
                <div className="h-2 bg-accent rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 w-full bg-primary rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
                </div>
              </div>
            )}
            {scannedItems.length > 0 && !isScanning && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">
                    {scannedItems.length} item{scannedItems.length > 1 ? "s" : ""} scanned
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {formatCurrency(scannedItems.reduce((sum, i) => sum + i.price * i.quantity, 0))}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={() => {
                      if(isScanning) return;
                      setReceiptFile(null);
                      setReceiptPreview("");
                      setScannedItems([]);
                    }}
                    className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-accent text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Back"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenReviewModal}
                    className="flex-1 text-center text-sm font-bold text-primary hover:text-primary/80 transition-colors py-2 rounded-lg bg-primary/10 hover:bg-primary/20"
                  >
                    Review & Edit Items
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
