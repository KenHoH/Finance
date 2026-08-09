"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, CheckCircle2, X, Upload, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { formatCurrency } from "@/lib/utils";
import { DatePicker } from "@/components/ui/DatePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ScannedItem, Transaction } from "@/lib/types";
import { optimisticCreate, rollbackOnError } from "@/lib/optimistic";
import { useQueryClient } from "@tanstack/react-query";

export default function ReceiptsPage(){
  const addToast = useToastStore((s) => s.addToast);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanAttempted, setScanAttempted] = useState(false);
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [categoryId, setCategoryId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scanMutation = useMutation({
    mutationFn: async(file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/receipts/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setIsScanning(false);
      if(data?.items && Array.isArray(data.items)){
        setItems(data.items);
      } else if(data?.item){
        setItems([{ item: data.item, price: data.price || 0, quantity: data.quantity || 1 }]);
      } else {
        addToast("Could not extract receipt data", "warning");
      }
    },
    onError: (err) => {
      setIsScanning(false);
      addToast(extractApiError(err, "Failed to scan receipt"), "error");
    },
  });

  const queryClient = useQueryClient();

  const confirmMutation = useMutation({
    mutationFn: (dto: { items: ScannedItem[]; date?: string; categoryId?: string }) =>
      api.post("/receipts/confirm", dto),
    onMutate: async (dto) => {
      const temps: Transaction[] = dto.items.map((item, i) => ({
        id: `opt-${Date.now()}-${i}`,
        description: item.item,
        amount: Number(item.price) * (Number(item.quantity) || 1),
        type: "EXPENSE",
        date: dto.date || new Date().toISOString(),
        categoryId: dto.categoryId || null,
        category: null,
        source: "receipt",
        isAutoTracked: true,
        createdAt: new Date().toISOString(),
      }));
      for(const temp of temps){
        await optimisticCreate(queryClient, ["transactions", "EXPENSE"], temp);
        await optimisticCreate(queryClient, ["transactions"], temp);
      }
      return {};
    },
    onError: (err) => {
      rollbackOnError(queryClient, ["transactions", "EXPENSE"], undefined);
      rollbackOnError(queryClient, ["transactions"], undefined);
      addToast(extractApiError(err, "Failed to save receipt"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    onSuccess: () => {
      setItems([]);
      setFile(null);
      setPreview("");
      addToast("Receipt saved as transactions", "success");
    },
  });

  function formatDateInput(d: Date){
    return d.toISOString().split("T")[0];
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if(!f) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if(!allowed.includes(f.type)){
      addToast("Only PNG, JPEG, and WebP images are allowed", "error");
      return;
    }
    if(f.size > 5 * 1024 * 1024){
      addToast("File must be under 5MB", "error");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setItems([]);
  };

  const handleScan = () => {
    if(!file) return;
    setIsScanning(true);
    setScanAttempted(true);
    scanMutation.mutate(file);
  };

  const updateItem = (index: number, field: keyof ScannedItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, it) => sum + (Number(it.price) * (Number(it.quantity) || 1)), 0);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-24">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Camera className="w-5 h-5 text-primary" />
          </div>
          Receipt Scanner
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Upload a receipt photo and extract transaction data</p>
      </header>

      {/* Upload Area */}
      {!file && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors bg-card"
          onClick={() => fileInputRef.current?.click()}
        >
          <img src="/scan-receipt-hero.webp" alt="" className="w-28 h-28 mx-auto mb-3 object-contain opacity-80" />
          <p className="text-sm font-medium text-foreground mb-1">Click to upload receipt</p>
          <p className="text-sm text-muted-foreground">PNG, JPEG, WebP up to 5MB</p>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </motion.div>
      )}

      {/* Preview */}
      {preview && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative rounded-xl overflow-hidden border border-border bg-card">
          <img src={preview} alt="Receipt preview" className="w-full max-h-80 object-contain bg-black/20" />
          <button
            onClick={() => { setFile(null); setPreview(""); setItems([]); }}
            className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-sky-400 hover:bg-black/80 transition-colors"
            aria-label="Remove"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}

      {/* Scan Button */}
      {file && items.length === 0 && !isScanning && !scanAttempted && (
        <div className="flex justify-center">
          <button
            onClick={handleScan}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-medium hover:brightness-110 transition-all active:scale-[0.98]"
          >
            <Upload className="w-5 h-5" /> Scan Receipt
          </button>
        </div>
      )}

      {isScanning && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Scanning receipt...</span>
        </div>
      )}

      {/* No items found after scan */}
      {file && items.length === 0 && !isScanning && scanAttempted && (
        <EmptyState
          image="/empty-receipts.webp"
          title="No receipt data found"
          description="Try uploading a clearer image of the receipt."
        />
      )}

      {/* Extracted Items */}
      {items.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Extracted Items</h3>
            <span className="text-sm font-bold text-primary">{formatCurrency(total)}</span>
          </div>

          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-card border border-border rounded-xl p-3">
                <input
                  type="text"
                  value={item.item}
                  onChange={(e) => updateItem(i, "item", e.target.value)}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                  placeholder="Item name"
                />
                <input
                  type="number"
                  value={item.quantity || 1}
                  onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                  className="w-16 bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-primary"
                  placeholder="Qty"
                />
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => updateItem(i, "price", Number(e.target.value))}
                  className="w-28 bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:border-primary"
                  placeholder="Price"
                />
                <button onClick={() => removeItem(i)} className="p-1.5 text-muted-foreground hover:text-red-400 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Date</label>
              <DatePicker value={date} onChange={setDate} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Category ID (optional)</label>
              <input type="text" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} placeholder="UUID" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => { setItems([]); setFile(null); setPreview(""); }} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors">Clear</button>
            <button
              onClick={() => confirmMutation.mutate({ items, date, categoryId: categoryId || undefined })}
              disabled={confirmMutation.isPending || items.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
            >
              {confirmMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Confirm & Save
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
