"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, CheckCircle2, Clock, ArrowDownLeft, ArrowUpRight, ChevronRight, Loader2, Camera, X, Upload, FileImage } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn, formatCurrency, unwrapArray } from "@/lib/utils";
import { validateString, validateNumber, runValidators } from "@/lib/validation";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type { SplitBill, ScannedItem } from "@/lib/types";
import { optimisticCreate, optimisticDelete, rollbackOnError } from "@/lib/optimistic";

export default function SplitBillsPage(){
  const addToast = useToastStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'settled'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedBill, setSelectedBill] = useState<SplitBill | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [splitWith, setSplitWith] = useState("");
  const [billToDelete, setBillToDelete] = useState<string | null>(null);

  const [showScanSection, setShowScanSection] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreview, setScanPreview] = useState("");
  const [scanItems, setScanItems] = useState<ScannedItem[]>([]);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const scanFileInputRef = useRef<HTMLInputElement>(null);

  const { data: bills = [], isLoading } = useQuery<SplitBill[]>({
    queryKey: ["split-bills"],
    queryFn: async() => {
      const res = await get<unknown>("/split-bills");
      return unwrapArray<SplitBill>(res);
    },
  });

  const shownToastRef = useRef(false);
  React.useEffect(() => {
    if(!isLoading && bills.length === 0 && !shownToastRef.current){
      shownToastRef.current = true;
      addToast("No split bills found. Create one to split expenses.", "info");
    }
  }, [isLoading, bills.length, addToast]);

  const userId = user?.id;
  const pendingBills = bills.filter(b => b.status !== "SETTLED");

  const amountTheyOweMe = pendingBills
    .filter(b => b.creatorId === userId)
    .reduce((acc, curr) => acc + curr.participants.filter(p => p.status === "PENDING").reduce((a, p) => a + Number(p.amount), 0), 0);

  const amountIOwe = pendingBills
    .filter(b => b.creatorId !== userId)
    .reduce((acc, curr) => acc + curr.participants.filter(p => p.status === "PENDING").reduce((a, p) => a + Number(p.amount), 0), 0);

  const netBalance = amountTheyOweMe - amountIOwe;

  const filteredBills = bills.filter(b => {
    if(activeTab === 'all') return true;
    if(activeTab === 'pending') return b.status !== "SETTLED";
    if(activeTab === 'settled') return b.status === "SETTLED";
    return true;
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { if(timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const createMutation = useMutation({
    mutationFn: (dto: { description: string; totalAmount: number; date: string; participants: { name: string; amount: number }[] }) =>
      api.post("/split-bills", dto),
    onMutate: async (dto) => {
      const temp: SplitBill = {
        id: `opt-${Date.now()}`,
        description: dto.description,
        totalAmount: dto.totalAmount,
        date: dto.date,
        status: "PENDING",
        creatorId: userId || "",
        participants: dto.participants.map((p, i) => ({ id: `opt-p-${Date.now()}-${i}`, name: p.name, amount: p.amount, status: "PENDING" as const })),
        createdAt: new Date().toISOString(),
      };
      return optimisticCreate(queryClient, ["split-bills"], temp);
    },
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["split-bills"], context);
      addToast(extractApiError(err, "Failed to create split bill"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["split-bills"] }),
    onSuccess: () => {
      setIsSuccess(true);
      setDescription("");
      setTotalAmount("");
      setSplitWith("");
      timeoutRef.current = setTimeout(() => {
        setIsSuccess(false);
        setIsModalOpen(false);
      }, 1500);
      addToast("Split bill created", "success");
    },
  });

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
      setIsScanningReceipt(false);
      let extractedItems: ScannedItem[] = [];
      if(data?.items && Array.isArray(data.items)){
        extractedItems = data.items;
      } else if(data?.item){
        extractedItems = [{ item: data.item, price: data.price || 0, quantity: data.quantity || 1 }];
      }
      setScanItems(extractedItems);
      if(extractedItems.length > 0){
        const total = extractedItems.reduce((sum, it) => sum + (Number(it.price) * (Number(it.quantity) || 1)), 0);
        setTotalAmount(String(total));
        const firstItemName = extractedItems[0].item;
        if(!description) setDescription(firstItemName);
        addToast(`Extracted ${extractedItems.length} items from receipt`, "success");
      } else {
        addToast("Could not extract receipt data", "warning");
      }
    },
    onError: (err) => {
      setIsScanningReceipt(false);
      addToast(extractApiError(err, "Failed to scan receipt"), "error");
    },
  });

  const handleScanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setScanFile(f);
    setScanPreview(URL.createObjectURL(f));
    setScanItems([]);
  };

  const handleScanReceipt = () => {
    if(!scanFile) return;
    setIsScanningReceipt(true);
    scanMutation.mutate(scanFile);
  };

  const updateParticipantMutation = useMutation({
    mutationFn: (dto: { billId: string; participantId: string; status: string }) =>
      api.put(`/split-bills/${dto.billId}/participants/${dto.participantId}`, { status: dto.status }),
    onMutate: async (dto) => {
      const previous = queryClient.getQueryData<SplitBill[]>(["split-bills"]) || [];
      queryClient.setQueryData<SplitBill[]>(["split-bills"], (old) =>
        (old || []).map((bill) =>
          bill.id === dto.billId
            ? {
                ...bill,
                participants: bill.participants.map((p) =>
                  (p as { id: string; name: string; amount: number; status: "PENDING" | "PAID" }).id === dto.participantId ? { ...p, status: dto.status as "PENDING" | "PAID" } : p,
                ),
              }
            : bill,
        ),
      );
      return { previous };
    },
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["split-bills"], context);
      addToast(extractApiError(err, "Failed to update participant"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["split-bills"] }),
    onSuccess: () => {
      addToast("Participant updated", "success");
    },
  });

  const deleteBillMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/split-bills/${id}`),
    onMutate: async (id) => optimisticDelete(queryClient, ["split-bills"], id),
    onError: (err, id, context) => {
      rollbackOnError(queryClient, ["split-bills"], context);
      addToast(extractApiError(err, "Failed to delete split bill"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["split-bills"] }),
    onSuccess: () => {
      setSelectedBill(null);
      setIsDetailModalOpen(false);
      addToast("Split bill deleted", "success");
    },
  });

  if(isLoading){
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-24">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {[0,1,2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="space-y-4">
          {[0,1,2,3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-7">
        <div className="flex items-center gap-5">
          <img src="/split-bills-hero.png" alt="" className="w-24 h-24 object-contain hidden md:block" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
              <div className="p-2 bg-sky-500/10 rounded-lg md:hidden">
                <Users className="w-5 h-5 text-sky-400" />
              </div>
              Split Bills
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage shared expenses with friends</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] hover:brightness-110"
          >
            <Plus className="w-5 h-5" /> New Split Bill
          </button>
        </div>
      </header>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Split Bill"
        description="Split expenses easily with friends."
        isSuccess={isSuccess}
        successMessage="Split bill has been created."
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const errors = runValidators(
              validateString(description, "Description", { min: 1, max: 200 }),
              validateNumber(totalAmount, "Total Amount", { min: 0.01 })
            );
            if(errors.length > 0){
              addToast(errors[0].message, "error");
              return;
            }
            const participantNames = splitWith.split(",").map((s) => s.trim()).filter(Boolean);
            if(participantNames.length === 0){
              addToast("Add at least one participant", "error");
              return;
            }
            if(participantNames.some((n) => n.length > 50)){
              addToast("Each participant name must be 50 characters or less", "error");
              return;
            }
            const perPerson = Number(totalAmount) / (participantNames.length + 1 || 1);
            createMutation.mutate({
              description: description.trim(),
              totalAmount: Number(totalAmount),
              date: new Date().toISOString(),
              participants: participantNames.map((name) => ({ name, amount: perPerson })),
            });
          }}
        >
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dinner at Mcdonalds"
              required
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Total Amount</label>
            <CurrencyInput
              value={totalAmount}
              onChange={setTotalAmount}
              placeholder="0"
              required
              className="[&_input]:px-4 [&_input]:py-3 [&_input]:text-base [&_input]:font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Split With</label>
            <input
              type="text"
              value={splitWith}
              onChange={(e) => setSplitWith(e.target.value)}
              placeholder="friend1, friend2, friend3"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base font-medium"
            />
            <p className="text-sm text-muted-foreground">Comma-separated names. You are included automatically.</p>
          </div>

          {/* Inline Receipt Scan */}
          <div className="border border-border rounded-xl p-3 space-y-3">
            <button
              type="button"
              onClick={() => setShowScanSection(!showScanSection)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Camera className="w-4 h-4" />
              {showScanSection ? "Hide receipt scan" : "Scan receipt to auto-fill"}
            </button>

            {showScanSection && (
              <div className="space-y-3">
                {!scanFile && (
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors bg-card"
                    onClick={() => scanFileInputRef.current?.click()}
                  >
                    <FileImage className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Click to upload receipt</p>
                    <p className="text-xs text-muted-foreground">PNG, JPEG, WebP up to 5MB</p>
                    <input ref={scanFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleScanFileChange} />
                  </div>
                )}

                {scanPreview && (
                  <div className="relative rounded-xl overflow-hidden border border-border bg-card">
                    <img src={scanPreview} alt="Receipt preview" className="w-full max-h-48 object-contain bg-black/20" />
                    <button
                      type="button"
                      onClick={() => { setScanFile(null); setScanPreview(""); setScanItems([]); }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-sky-400 hover:bg-black/80 transition-colors"
                      aria-label="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {scanFile && scanItems.length === 0 && !isScanningReceipt && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleScanReceipt}
                      className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:brightness-110 transition-all active:scale-[0.98]"
                    >
                      <Upload className="w-4 h-4" /> Scan Receipt
                    </button>
                  </div>
                )}

                {isScanningReceipt && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Scanning receipt...</span>
                  </div>
                )}

                {scanItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Extracted Items</p>
                    {scanItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate">{item.item}</span>
                        <span className="text-muted-foreground">x{item.quantity || 1}</span>
                        <span className="font-medium">{formatCurrency(Number(item.price))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] mt-6 shadow-md disabled:opacity-60"
          >
            {createMutation.isPending ? "Creating..." : "Create Split Bill"}
          </button>
        </form>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-7">
          <div className="flex items-center gap-2 text-rose-500 font-semibold uppercase text-sm mb-2"><ArrowDownLeft className="w-5 h-5" /> You Owe</div>
          <p className="text-3xl font-bold text-foreground">{formatCurrency(amountIOwe)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-7">
          <div className="flex items-center gap-2 text-sky-400 font-semibold uppercase text-sm mb-2"><ArrowUpRight className="w-5 h-5" /> You Are Owed</div>
          <p className="text-3xl font-bold text-foreground">{formatCurrency(amountTheyOweMe)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-7">
          <div className="flex items-center gap-2 text-muted-foreground font-semibold uppercase text-sm mb-2">Net Balance</div>
          <p className={cn("text-3xl font-bold", netBalance >= 0 ? "text-sky-400" : "text-rose-500")}>
            {netBalance >= 0 ? "+" : ""}{formatCurrency(netBalance)}
          </p>
        </motion.div>
      </div>

      <div className="flex rounded-xl p-1.5 w-fit shadow-sm bg-card border border-border">
        {(['all', 'pending', 'settled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === tab ? "bg-sky-500 text-white shadow-md" : "text-muted-foreground hover:bg-accent/50"
            )}
          >
            {tab === 'all' ? "All Bills" : tab === 'pending' ? "Pending" : "Settled"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredBills.map((bill, idx) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => { setSelectedBill(bill); setIsDetailModalOpen(true); }}
              className="group rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-foreground">{bill.description}</h3>
                  {bill.status === "SETTLED" ? (
                    <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 text-sm font-bold rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Settled</span>
                  ) : (
                    <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 text-sm font-bold rounded-full flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Pending</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400 font-medium">
                  <span>{format(new Date(bill.date), 'dd MMM yyyy')}</span>
                  <span>•</span>
                  <span>Total: {formatCurrency(Number(bill.totalAmount))}</span>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-3 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                <div className="flex -space-x-2">
                  {bill.participants.map((p) => (
                    <div
                      key={p.id}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-card z-10 overflow-hidden bg-accent",
                        p.status === 'PAID' ? "ring-2 ring-sky-500" : ""
                      )}
                      title={`${p.name}: ${p.status}`}
                    >
                      <span className="text-sm">{p.name.slice(0,2).toUpperCase()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-slate-400 group-hover:text-sky-400 transition-colors">
                  View Details <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
          {filteredBills.length === 0 && (
            <EmptyState
              title="No split bills found"
              description="Create a new split bill to divide expenses with friends."
            />
          )}
        </AnimatePresence>
      </div>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Bill Details"
      >
        {selectedBill && (
          <div className="space-y-6">
            <div className="bg-accent/50 rounded-xl p-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-foreground">{selectedBill.description}</h3>
                <p className="text-sm text-slate-400 font-medium">{format(new Date(selectedBill.date), 'dd MMM yyyy')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400 font-medium uppercase mb-1">Total</p>
                <p className="text-2xl font-extrabold text-primary">{formatCurrency(Number(selectedBill.totalAmount))}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-3 px-2">Participants</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {selectedBill.participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-accent shrink-0 flex items-center justify-center border border-border">
                        <span className="text-base font-bold">{p.name.slice(0,2).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-base font-bold text-foreground">{p.name}</p>
                        <p className="text-sm font-semibold text-slate-400 capitalize">{p.status.toLowerCase()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-foreground">{formatCurrency(Number(p.amount))}</p>
                      {p.status === 'PAID' ? (
                        <span className="text-sm font-bold text-sky-400 flex items-center gap-1 justify-end mt-1"><CheckCircle2 className="w-3 h-3" /> Settled</span>
                      ) : (
                        <span className="text-sm font-bold text-sky-400 flex items-center gap-1 justify-end mt-1"><Clock className="w-3 h-3" /> Pending</span>
                      )}
                      <button
                        onClick={() => updateParticipantMutation.mutate({ billId: selectedBill.id, participantId: p.id, status: p.status === 'PAID' ? 'PENDING' : 'PAID' })}
                        disabled={updateParticipantMutation.isPending}
                        className={cn(
                          "mt-1 text-sm font-bold px-2 py-1 rounded-lg transition-colors",
                          p.status === 'PAID'
                            ? "text-sky-400 hover:bg-sky-500/10"
                            : "text-sky-400 hover:bg-sky-500/10"
                        )}
                      >
                        {p.status === 'PAID' ? 'Mark Pending' : 'Mark Paid'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="flex-1 bg-accent hover:bg-accent/80 text-foreground py-3.5 rounded-xl font-bold transition-colors active:scale-[0.98]"
              >
                Close
              </button>
              <button
                onClick={() => { if(selectedBill) setBillToDelete(selectedBill.id); }}
                disabled={deleteBillMutation.isPending}
                className="px-5 py-3.5 rounded-xl font-bold text-red-400 hover:bg-red-500/10 transition-colors active:scale-[0.98] disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!billToDelete}
        onConfirm={() => {
          if(billToDelete){
            deleteBillMutation.mutate(billToDelete);
            setBillToDelete(null);
          }
        }}
        onCancel={() => setBillToDelete(null)}
        title="Delete split bill?"
        description="Are you sure you want to delete this split bill? This action cannot be undone."
        confirmLabel={deleteBillMutation.isPending ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </div>
  );
}
