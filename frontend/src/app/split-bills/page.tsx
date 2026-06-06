"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, CheckCircle2, Clock, ArrowDownLeft, ArrowUpRight, ChevronRight,
  X, Receipt,
  Trash2, Pencil
} from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn, formatCurrency, unwrapArray } from "@/lib/utils";
import { validateString, runValidators } from "@/lib/validation";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { SplitBillWizard } from "@/components/split-bill/SplitBillWizard";
import type { SplitBill } from "@/lib/types";
import { optimisticCreate, rollbackOnError } from "@/lib/optimistic";

interface Friend {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export default function SplitBillsPage(){
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'settled'>('all');
  const [viewTab, setViewTab] = useState<'created' | 'owed'>('created');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [description, setDescription] = useState("");

  // Receipt upload
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const receiptFileInputRef = useRef<HTMLInputElement>(null);

  // OCR scanned items
  const [scannedItems, setScannedItems] = useState<{item: string; price: number; quantity: number}[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemQty, setEditItemQty] = useState("1");
  const [editItemPrice, setEditItemPrice] = useState("");
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemPrice, setNewItemPrice] = useState("");
  // Global bill modifiers
  const [taxRate, setTaxRate] = useState("");
  const [serviceChargeRate, setServiceChargeRate] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");

  // Friend selection
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [friendSearch, setFriendSearch] = useState("");

  // Item assignment flow
  const [itemAssignments, setItemAssignments] = useState<Record<number, string[]>>({});
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showFriendPickerModal, setShowFriendPickerModal] = useState(false);
  const [expandedPreviewParticipant, setExpandedPreviewParticipant] = useState<string | null>(null);

  // Non-registered participants (manual name entry)
  const [manualParticipants, setManualParticipants] = useState<{ id: string; name: string }[]>([]);
  const [manualNameInput, setManualNameInput] = useState("");

  const { data: bills = [], isLoading } = useQuery<SplitBill[]>({
    queryKey: ["split-bills"],
    queryFn: async() => {
      const res = await get<unknown>("/split-bills");
      return unwrapArray<SplitBill>(res);
    },
  });

  const { data: friends = [] } = useQuery<Friend[]>({
    queryKey: ["friends"],
    queryFn: async () => {
      const res = await get<unknown>("/friends");
      const arr = unwrapArray<{ friendshipId: string; friend: Friend; createdAt: string }>(res);
      return arr.map((f) => f.friend);
    },
  });

  const pendingBills = bills.filter(b => b.status !== "SETTLED");

  const myCreatedBills = useMemo(() => bills.filter(b => b.creatorId === userId), [bills, userId]);
  const myOwedBills = useMemo(() => bills.filter(b => b.creatorId !== userId && b.participants.some(p => p.userId === userId)), [bills, userId]);

  const amountTheyOweMe = pendingBills
    .filter(b => b.creatorId === userId)
    .reduce((acc, curr) => acc + curr.participants.filter(p => p.status === "PENDING").reduce((a, p) => a + Number(p.amountOwed), 0), 0);

  const amountIOwe = pendingBills
    .filter(b => b.creatorId !== userId)
    .reduce((acc, curr) => {
      const myShare = curr.participants.find(p => p.userId === userId && p.status === "PENDING");
      return acc + Number(myShare?.amountOwed || 0);
    }, 0);

  const netBalance = amountTheyOweMe - amountIOwe;

  const viewBills = viewTab === 'created' ? myCreatedBills : myOwedBills;

  const filteredBills = viewBills.filter(b => {
    if(activeTab === 'all') return true;
    if(activeTab === 'pending') return b.status !== "SETTLED";
    if(activeTab === 'settled') return b.status === "SETTLED";
    return true;
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { if(timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const createMutation = useMutation({
    mutationFn: (dto: { description: string; totalAmount: number; date: string; receiptImageUrl?: string; items?: { item: string; quantity: number; price: number; assignedTo: string[] }[]; participants: { userId?: string; name: string; amountOwed?: number }[]; taxRate?: number; serviceChargeRate?: number; discountAmount?: number }) =>
      api.post("/split-bills", dto),
    onMutate: async (dto) => {
      const temp: SplitBill = {
        id: `opt-${Date.now()}`,
        description: dto.description,
        totalAmount: dto.totalAmount,
        date: dto.date,
        status: "PENDING",
        creatorId: userId || "",
        receiptImageUrl: dto.receiptImageUrl,
        participants: dto.participants.map((p, i) => ({ id: `opt-p-${Date.now()}-${i}`, name: p.name, amountOwed: p.amountOwed || 0, status: "PENDING" as const, userId: p.userId })),
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
      setSelectedFriends([]);
      setManualParticipants([]);
      setManualNameInput("");
      setReceiptFile(null);
      setReceiptPreview("");
      setScannedItems([]);
      setShowReviewModal(false);
      setShowAssignmentModal(false);
      setShowPreviewModal(false);
      setShowAddItemModal(false);
      setShowFriendPickerModal(false);
      setItemAssignments({});
      setTaxRate("");
      setServiceChargeRate("");
      setDiscountAmount("");
      timeoutRef.current = setTimeout(() => {
        setIsSuccess(false);
        setIsModalOpen(false);
      }, 1500);
    },
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/split-bills/upload-receipt", formData);
      return res.data?.url || res.data?.imageUrl || "";
    },
    onError: (err) => addToast(extractApiError(err, "Failed to upload receipt"), "error"),
  });

  const scanReceiptMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);

      const csrfMatch = document.cookie.match(/csrf-token=([^;]+)/);
      const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[1]) : "";

      const headers: Record<string, string> = {};
      if(csrfToken) headers["X-CSRF-Token"] = csrfToken;

      const res = await fetch("/api/receipts/scan", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers,
      });

      if(!res.ok){
        const errData = await res.json().catch(() => ({ message: `Scan failed: ${res.status}` }));
        throw new Error(errData.message);
      }

      return res.json() as Promise<{ items: {item: string; price: number; quantity: number}[]; total: number; raw_text: string; message: string }>;
    },
    onSuccess: (data) => {
      const items = data.items.map(i => ({ item: i.item, price: i.price, quantity: i.quantity || 1 }));
      setScannedItems(items);
      if(items.length > 0){
        setShowReviewModal(true);
      }
      addToast(`Scanned ${data.items.length} items from receipt`, "success");
    },
    onError: (err) => addToast(extractApiError(err, "Receipt scan failed"), "error"),
  });

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setReceiptFile(f);
    setReceiptPreview(URL.createObjectURL(f));
    setIsScanning(true);
    try{
      await scanReceiptMutation.mutateAsync(f);
    }finally{
      setIsScanning(false);
    }
  };

  const handleCreateSubmit = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    const errors = runValidators(
      validateString(description, "Description", { min: 1, max: 200 })
    );
    if(errors.length > 0){
      addToast(errors[0].message, "error");
      return;
    }
    if(selectedFriends.length === 0 && manualParticipants.length === 0){
      addToast("Select at least one friend or add a participant name to split with", "error");
      return;
    }

    const subtotal = scannedItems.length > 0
      ? scannedItems.reduce((sum, it) => sum + it.price * it.quantity, 0)
      : 0;
    const taxPct = parseFloat(taxRate) || 0;
    const servicePct = parseFloat(serviceChargeRate) || 0;
    const discountVal = Math.max(0, parseInt(discountAmount.replace(/\D/g, '')) || 0);
    const totalTax = Math.round(subtotal * (taxPct / 100));
    const totalService = Math.round(subtotal * (servicePct / 100));
    const grandTotal = subtotal + totalTax + totalService - discountVal;

    // Build items with assignments
    const items = scannedItems.length > 0
      ? scannedItems.map((it, idx) => ({
          item: it.item,
          quantity: it.quantity,
          price: it.price,
          assignedTo: itemAssignments[idx] || [],
        }))
      : undefined;

    const participants = [
      { userId: userId || '', name: user?.username || 'You' },
      ...selectedFriends.map(f => ({ userId: f.id, name: f.username })),
      ...manualParticipants.map(m => ({ name: m.name.trim() })),
    ];

    let receiptImageUrl: string | undefined;
    if(receiptFile){
      try {
        const res = await uploadReceiptMutation.mutateAsync(receiptFile);
        receiptImageUrl = res;
      } catch {
        return;
      }
    }

    createMutation.mutate({
      description: description.trim(),
      totalAmount: Math.max(0, grandTotal),
      date: new Date().toISOString(),
      receiptImageUrl,
      items,
      participants,
      taxRate: taxPct,
      serviceChargeRate: servicePct,
      discountAmount: discountVal,
    });
  };

  const toggleFriend = (friend: Friend) => {
    setSelectedFriends(prev => {
      const exists = prev.find(f => f.id === friend.id);
      if(exists) return prev.filter(f => f.id !== friend.id);
      return [...prev, friend];
    });
  };


  if(isLoading){
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-24">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {[0,1,2].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="space-y-4">
          {[0,1,2,3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-7">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-sky-500/10 rounded-xl">
            <Users className="w-7 h-7 text-sky-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Split Bills</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage shared expenses with friends</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] hover:brightness-110"
        >
          <Plus className="w-5 h-5" /> New Split Bill
        </button>
      </header>

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

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex rounded-xl p-1.5 w-fit shadow-sm bg-card border border-border">
          {(['created', 'owed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setViewTab(tab)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                viewTab === tab ? "bg-sky-500 text-white shadow-md" : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              {tab === 'created' ? "Bills I Created" : "Bills I Owe"}
            </button>
          ))}
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
              {tab === 'all' ? "All" : tab === 'pending' ? "Pending" : "Settled"}
            </button>
          ))}
        </div>
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
              onClick={() => router.push(`/split-bills/${bill.id}`)}
              className="group rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-foreground">{bill.description}</h3>
                  {bill.status === "SETTLED" ? (
                    <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 text-sm font-bold rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Settled</span>
                  ) : (
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 text-sm font-bold rounded-full flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Pending</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400 font-medium">
                  <span>{format(new Date(bill.date), 'dd MMM yyyy')}</span>
                  <span>Total: {formatCurrency(Number(bill.totalAmount))}</span>
                  {bill.receiptImageUrl && <span className="flex items-center gap-1"><Receipt className="w-3.5 h-3.5" /> Receipt</span>}
                </div>
              </div>
              <div className="flex flex-col md:items-end gap-3 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                <div className="flex -space-x-2">
                  {bill.participants.map((p) => (
                    <div
                      key={p.id}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-card z-10 overflow-hidden bg-accent",
                        p.status === 'CONFIRMED' ? "ring-2 ring-sky-500" : p.status === 'PAID_PENDING_CONFIRMATION' ? "ring-2 ring-amber-500" : ""
                      )}
                      title={p.name + ': ' + p.status}
                    >
                      {p.name.slice(0,2).toUpperCase()}
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
              description={viewTab === 'created' ? "Create a new split bill to divide expenses with friends." : "You don't owe any split bills yet."}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ===== CREATE MODAL ===== */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setScannedItems([]);
          setShowReviewModal(false);
          setShowAssignmentModal(false);
          setShowPreviewModal(false);
          setShowAddItemModal(false);
          setShowFriendPickerModal(false);
          setItemAssignments({});
          setTaxRate("");
          setServiceChargeRate("");
          setDiscountAmount("");
          setSelectedFriends([]);
          setManualParticipants([]);
          setManualNameInput("");
          setFriendSearch("");
        }}
        title="New Split Bill"
        description="Upload a receipt, select friends, and split the bill."
        isSuccess={isSuccess}
        successMessage="Split bill has been created."
      >
        <SplitBillWizard
          receiptPreview={receiptPreview}
          setReceiptPreview={setReceiptPreview}
          receiptFileInputRef={receiptFileInputRef}
          handleReceiptFileChange={handleReceiptFileChange}
          setReceiptFile={setReceiptFile}
          setScannedItems={setScannedItems}
          scannedItems={scannedItems}
          isScanning={isScanning}
          onOpenReviewModal={() => setShowReviewModal(true)}
          formatCurrency={formatCurrency}
        />
      </Modal>

      {/* ===== RECEIPT ITEMS MODAL ===== */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={`Receipt Items (${scannedItems.length})`}
        description="Review, edit, add or remove items before confirming."
        zIndex={60}
      >
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setShowAddItemModal(true)}
            className="flex-1 py-2.5 border border-dashed border-border rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-accent/30 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
          <button
            type="button"
            onClick={() => setShowFriendPickerModal(true)}
            className="flex-1 py-2.5 border border-dashed border-border rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-accent/30 transition-all flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" /> Add Friends
          </button>
        </div>

        {/* Items list */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {scannedItems.map((item, idx) => (
            <div key={idx} className="group bg-accent/30 border border-border/60 hover:border-border rounded-xl transition-colors">
              {editingItemIndex === idx ? (
                <div className="p-3 space-y-2">
                  <input
                    type="text"
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    placeholder="Item name"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editItemQty}
                      onChange={(e) => setEditItemQty(e.target.value)}
                      placeholder="Qty"
                      min={1}
                      className="w-20 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                    <CurrencyInput
                      value={editItemPrice}
                      onChange={setEditItemPrice}
                      placeholder="Price"
                      className="flex-1 [&_input]:py-2 [&_input]:text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const qty = Math.max(1, parseInt(editItemQty) || 1);
                        const price = Math.max(0, parseInt(editItemPrice.replace(/\D/g, '')) || 0);
                        const next = scannedItems.map((it, i) => i === idx ? { ...it, item: editItemName.trim() || 'Item', quantity: qty, price } : it);
                        setScannedItems(next);
                        setEditingItemIndex(null);
                      }}
                      className="flex-1 bg-primary text-primary-foreground py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingItemIndex(null)}
                      className="flex-1 bg-accent text-foreground py-1.5 rounded-lg text-xs font-bold hover:bg-accent/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.item}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} x {formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-bold text-primary">{formatCurrency(item.price * item.quantity)}</p>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItemIndex(idx);
                          setEditItemName(item.item);
                          setEditItemQty(String(item.quantity));
                          setEditItemPrice(String(item.price));
                        }}
                        className="p-1.5 rounded-lg text-sky-400 hover:bg-sky-500/10 transition-colors"
                        aria-label="Edit item"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = scannedItems.filter((_, i) => i !== idx);
                          setScannedItems(next);
                        }}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {scannedItems.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No items yet. Click &quot;Add Item&quot; to add one.</p>
          )}
        </div>

        {/* Selected participants */}
        {(selectedFriends.length > 0 || manualParticipants.length > 0) && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Participants</label>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{selectedFriends.length + manualParticipants.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedFriends.map((f) => (
                <div key={f.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                  <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">{f.username.slice(0,2).toUpperCase()}</span>
                  {f.username}
                </div>
              ))}
              {manualParticipants.map((m) => (
                <div key={m.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-foreground text-xs font-bold rounded-full">
                  <span className="w-5 h-5 rounded-full bg-background flex items-center justify-center text-[10px]">{m.name.slice(0,2).toUpperCase()}</span>
                  {m.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-border space-y-3">
          {(() => {
            const subtotal = scannedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
            const tax = Math.round(subtotal * (parseFloat(taxRate) || 0) / 100);
            const service = Math.round(subtotal * (parseFloat(serviceChargeRate) || 0) / 100);
            const discount = Math.max(0, parseInt(discountAmount.replace(/\D/g, '')) || 0);
            const grandTotal = subtotal + tax + service - discount;
            return (
              <>
                {/* Modifiers */}
                <div className="space-y-2 bg-accent/20 border border-border/60 rounded-xl p-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Modifiers</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Tax (%)</label>
                      <input
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        min={0}
                        placeholder="0"
                        className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Service (%)</label>
                      <input
                        type="number"
                        value={serviceChargeRate}
                        onChange={(e) => setServiceChargeRate(e.target.value)}
                        min={0}
                        placeholder="0"
                        className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Discount (Rp)</label>
                      <CurrencyInput
                        value={discountAmount}
                        onChange={setDiscountAmount}
                        placeholder="0"
                        className="[&_input]:pl-10 [&_input]:pr-2 [&_input]:py-1.5 [&_input]:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Receipt breakdown */}
                <div className="space-y-1 px-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
                  </div>
                  {tax > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tax ({parseFloat(taxRate) || 0}%)</span>
                      <span className="font-semibold text-foreground">+{formatCurrency(tax)}</span>
                    </div>
                  )}
                  {service > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Service ({parseFloat(serviceChargeRate) || 0}%)</span>
                      <span className="font-semibold text-foreground">+{formatCurrency(service)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-semibold text-emerald-400">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-sm font-bold text-muted-foreground">Grand Total</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(Math.max(0, grandTotal))}</span>
                  </div>
                </div>
              </>
            );
          })()}
          <button
            type="button"
            onClick={() => {
              setShowReviewModal(false);
              setShowAssignmentModal(true);
            }}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            Next: Assign Items
          </button>
        </div>
      </Modal>

      {/* ===== ADD ITEM MODAL ===== */}
      <Modal
        isOpen={showAddItemModal}
        onClose={() => {
          setShowAddItemModal(false);
          setNewItemName("");
          setNewItemQty("1");
          setNewItemPrice("");
        }}
        title="Add Item"
        description="Add a missing item to the receipt."
        zIndex={75}
        backdropClassName="bg-black/80 backdrop-blur-md"
      >
        <div className="space-y-4">
          {/* Item Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">Item Name</label>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="e.g. Extra Rice"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {/* Quantity + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Quantity</label>
              <input
                type="number"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                min={1}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Price per Unit</label>
              <CurrencyInput
                value={newItemPrice}
                onChange={setNewItemPrice}
                placeholder="0"
                className="[&_input]:pl-12 [&_input]:pr-3 [&_input]:py-2.5 [&_input]:text-sm"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const qty = Math.max(1, parseInt(newItemQty) || 1);
              const price = Math.max(0, parseInt(newItemPrice.replace(/\D/g, '')) || 0);
              if(newItemName.trim()){
                setScannedItems(prev => [...prev, { item: newItemName.trim(), quantity: qty, price }]);
              }
              setNewItemName(""); setNewItemQty("1"); setNewItemPrice("");
              setShowAddItemModal(false);
            }}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            Add Item
          </button>
        </div>
      </Modal>

      {/* ===== FRIEND PICKER MODAL ===== */}
      <Modal
        isOpen={showFriendPickerModal}
        onClose={() => {
          setShowFriendPickerModal(false);
          setFriendSearch("");
          setManualNameInput("");
        }}
        title="Add Friends"
        description="Search your friends or add someone without an account."
        zIndex={72}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Search friends */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Search Friends</label>
            <input
              type="text"
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {(() => {
                const available = (friendSearch
                  ? friends.filter(f => f.username.toLowerCase().includes(friendSearch.toLowerCase()))
                  : friends
                ).filter(f => !selectedFriends.find(sf => sf.id === f.id));
                if(available.length === 0){
                  return (
                    <div className="text-center py-4">
                      <p className="text-xs text-muted-foreground font-medium">{friendSearch ? "No matching friends" : "No friends available"}</p>
                    </div>
                  );
                }
                return available.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => toggleFriend(friend)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {friend.username.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground flex-1 text-left">{friend.username}</span>
                    <Plus className="w-4 h-4 text-primary" />
                  </button>
                ));
              })()}
            </div>
          </div>

          {/* Add without account */}
          <div className="bg-accent/20 border border-border/60 rounded-xl p-3 space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Add Without Account</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={manualNameInput}
                onChange={(e) => setManualNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if(e.key === "Enter"){
                    e.preventDefault();
                    if(manualNameInput.trim()){
                      setManualParticipants((prev) => [...prev, { id: "manual-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7), name: manualNameInput.trim() }]);
                      setManualNameInput("");
                    }
                  }
                }}
                placeholder="Enter name..."
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => {
                  if(manualNameInput.trim()){
                    setManualParticipants((prev) => [...prev, { id: "manual-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7), name: manualNameInput.trim() }]);
                    setManualNameInput("");
                  }
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Add
              </button>
            </div>
          </div>

          {/* Selected so far */}
          {(selectedFriends.length > 0 || manualParticipants.length > 0) && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Selected ({selectedFriends.length + manualParticipants.length})</label>
              <div className="flex flex-wrap gap-2">
                {selectedFriends.map((f) => (
                  <div key={f.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                    <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">{f.username.slice(0,2).toUpperCase()}</span>
                    {f.username}
                    <button type="button" onClick={() => toggleFriend(f)} className="hover:text-white ml-0.5" aria-label={"Remove " + f.username}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {manualParticipants.map((m) => (
                  <div key={m.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-foreground text-xs font-bold rounded-full">
                    <span className="w-5 h-5 rounded-full bg-background flex items-center justify-center text-[10px]">{m.name.slice(0,2).toUpperCase()}</span>
                    {m.name}
                    <button type="button" onClick={() => setManualParticipants((prev) => prev.filter((p) => p.id !== m.id))} className="hover:text-white ml-0.5" aria-label={"Remove " + m.name}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-border">
          <button
            type="button"
            onClick={() => setShowFriendPickerModal(false)}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </Modal>

      {/* ===== ITEM ASSIGNMENT MODAL ===== */}
      <Modal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        title="Assign Items"
        description="Tap a participant to assign each item. Unassigned items split equally."
        zIndex={70}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Participants */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Participants</label>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{1 + selectedFriends.length + manualParticipants.length}</span>
            </div>
            {(selectedFriends.length === 0 && manualParticipants.length === 0) ? (
              <div className="p-3 bg-accent/30 border border-dashed border-border/60 rounded-xl text-center">
                <Users className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground font-medium">No participants yet. Go back and add friends.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">{(user?.username || 'You').slice(0,2).toUpperCase()}</span>
                  {user?.username || 'You'} (You)
                </div>
                {selectedFriends.map((f) => (
                  <div key={f.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                    <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">{f.username.slice(0,2).toUpperCase()}</span>
                    {f.username}
                  </div>
                ))}
                {manualParticipants.map((m) => (
                  <div key={m.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-foreground text-xs font-bold rounded-full">
                    <span className="w-5 h-5 rounded-full bg-background flex items-center justify-center text-[10px]">{m.name.slice(0,2).toUpperCase()}</span>
                    {m.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignment section */}
          {scannedItems.length > 0 && (selectedFriends.length > 0 || manualParticipants.length > 0) && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Assign Items</label>
                <span className="text-[10px] text-muted-foreground font-medium">Unassigned = split equally</span>
              </div>
              {scannedItems.map((item, idx) => {
                const assigned = itemAssignments[idx] || [];
                const isUnassigned = assigned.length === 0;
                return (
                  <div key={idx} className="bg-accent/30 border border-border/60 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{idx + 1}</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.item}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} x {formatCurrency(item.price)} = {formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      </div>
                      {isUnassigned && (
                        <span className="text-[10px] font-bold text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded">Split equally</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const creatorId = userId || 'creator';
                          setItemAssignments(prev => {
                            const current = prev[idx] || [];
                            if(current.includes(creatorId)){
                              return { ...prev, [idx]: current.filter(id => id !== creatorId) };
                            }
                            return { ...prev, [idx]: [...current, creatorId] };
                          });
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold transition-all",
                          assigned.includes(userId || 'creator')
                            ? "bg-emerald-500 text-white"
                            : "bg-accent/50 text-muted-foreground hover:bg-accent"
                        )}
                      >
                        <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px]", assigned.includes(userId || 'creator') ? "bg-white/20" : "bg-accent")}>
                          {(user?.username || 'Y').slice(0,1).toUpperCase()}
                        </span>
                        {user?.username || 'You'}
                      </button>
                      {selectedFriends.map(f => {
                        const isAssigned = assigned.includes(f.id);
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              setItemAssignments(prev => {
                                const current = prev[idx] || [];
                                if(current.includes(f.id)){
                                  return { ...prev, [idx]: current.filter(id => id !== f.id) };
                                }
                                return { ...prev, [idx]: [...current, f.id] };
                              });
                            }}
                            className={cn(
                              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold transition-all",
                              isAssigned
                                ? "bg-primary text-primary-foreground"
                                : "bg-accent/50 text-muted-foreground hover:bg-accent"
                            )}
                          >
                            <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px]", isAssigned ? "bg-white/20" : "bg-accent")}>
                              {f.username.slice(0,1).toUpperCase()}
                            </span>
                            {f.username}
                          </button>
                        );
                      })}
                      {manualParticipants.map(m => {
                        const isAssigned = assigned.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setItemAssignments(prev => {
                                const current = prev[idx] || [];
                                if(current.includes(m.id)){
                                  return { ...prev, [idx]: current.filter(id => id !== m.id) };
                                }
                                return { ...prev, [idx]: [...current, m.id] };
                              });
                            }}
                            className={cn(
                              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold transition-all",
                              isAssigned
                                ? "bg-primary text-primary-foreground"
                                : "bg-accent/50 text-muted-foreground hover:bg-accent"
                            )}
                          >
                            <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px]", isAssigned ? "bg-white/20" : "bg-accent")}>
                              {m.name.slice(0,1).toUpperCase()}
                            </span>
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-border space-y-3">
          <button
            type="button"
            disabled={selectedFriends.length === 0 && manualParticipants.length === 0}
            onClick={() => {
              setShowAssignmentModal(false);
              setShowPreviewModal(true);
            }}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-60"
          >
            Review Final Split
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAssignmentModal(false);
              setShowReviewModal(true);
            }}
            className="w-full py-2.5 rounded-xl font-bold text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all active:scale-[0.98]"
          >
            Back to Items
          </button>
        </div>
      </Modal>

      {/* ===== PREVIEW MODAL ===== */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Final Split Preview"
        description="Review the summary and add a description before creating."
        zIndex={80}
      >
        <div className="space-y-5">
          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="sb-desc" className="text-sm font-bold text-foreground">
              Description
            </label>
            <input
              id="sb-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dinner at McDonalds"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base font-medium"
            />
          </div>

          {/* Calculated summary */}
          {(() => {
            const creatorId = userId || 'creator';
            const creatorName = user?.username || 'You';
            const allParticipantIds = [
              creatorId,
              ...selectedFriends.map(f => f.id),
              ...manualParticipants.map(m => m.id),
            ];
            const subtotals = new Map<string, { name: string; subtotal: number }>();
            const participantItems = new Map<string, { item: string; qty: number; price: number; share: number }[]>();
            scannedItems.forEach((item, idx) => {
              const assigned = itemAssignments[idx] || [];
              const itemTotal = item.price * item.quantity;
              const targets = assigned.length > 0 ? assigned : allParticipantIds;
              if(targets.length > 0){
                const share = itemTotal / targets.length;
                targets.forEach(id => {
                  const friend = selectedFriends.find(f => f.id === id);
                  const manual = manualParticipants.find(m => m.id === id);
                  const name = id === creatorId ? creatorName : (friend?.username || manual?.name || id);
                  const current = subtotals.get(id) || { name, subtotal: 0 };
                  subtotals.set(id, { name, subtotal: current.subtotal + share });
                  const items = participantItems.get(id) || [];
                  items.push({ item: item.item, qty: item.quantity, price: item.price, share });
                  participantItems.set(id, items);
                });
              }
            });
            if(!subtotals.has(creatorId)) subtotals.set(creatorId, { name: creatorName, subtotal: 0 });
            selectedFriends.forEach(f => {
              if(!subtotals.has(f.id)) subtotals.set(f.id, { name: f.username, subtotal: 0 });
            });
            manualParticipants.forEach(m => {
              if(!subtotals.has(m.id)) subtotals.set(m.id, { name: m.name, subtotal: 0 });
            });
            const totalSubtotal = Array.from(subtotals.values()).reduce((s, v) => s + v.subtotal, 0);
            const taxPct = parseFloat(taxRate) || 0;
            const servicePct = parseFloat(serviceChargeRate) || 0;
            const discountVal = Math.max(0, parseInt(discountAmount.replace(/\D/g, '')) || 0);
            const totalTax = Math.round(totalSubtotal * (taxPct / 100));
            const totalService = Math.round(totalSubtotal * (servicePct / 100));
            const grandTotal = totalSubtotal + totalTax + totalService - discountVal;
            const rawEntries = Array.from(subtotals.entries()).map(([id, v]) => ({
              id,
              name: v.name,
              subtotal: v.subtotal,
              rawTax: v.subtotal * (taxPct / 100),
              rawService: v.subtotal * (servicePct / 100),
              rawDiscount: totalSubtotal > 0 ? (v.subtotal / totalSubtotal) * discountVal : 0,
            }));
            const roundedTax = rawEntries.map(e => Math.round(e.rawTax));
            const roundedService = rawEntries.map(e => Math.round(e.rawService));
            const roundedDiscount = rawEntries.map(e => Math.round(e.rawDiscount));
            const taxDiff = totalTax - roundedTax.reduce((a, b) => a + b, 0);
            const serviceDiff = totalService - roundedService.reduce((a, b) => a + b, 0);
            const discountDiff = discountVal - roundedDiscount.reduce((a, b) => a + b, 0);
            if(rawEntries.length > 0){
              const lastIdx = rawEntries.length - 1;
              roundedTax[lastIdx] += taxDiff;
              roundedService[lastIdx] += serviceDiff;
              roundedDiscount[lastIdx] += discountDiff;
            }
            const entries = rawEntries.map((e, i) => ({
              id: e.id,
              name: e.name,
              subtotal: e.subtotal,
              tax: roundedTax[i],
              service: roundedService[i],
              discount: roundedDiscount[i],
              total: Math.round(e.subtotal + roundedTax[i] + roundedService[i] - roundedDiscount[i]),
              items: participantItems.get(e.id) || [],
            }));
            return (
              <div className="space-y-3">
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                  {entries.map(e => (
                    <div key={e.id} className="p-3 bg-accent/30 border border-border/60 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setExpandedPreviewParticipant(prev => prev === e.id ? null : e.id)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <span className="text-sm font-semibold text-foreground">{e.name}</span>
                        <span className="text-sm font-bold text-primary">{formatCurrency(e.total)}</span>
                      </button>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span>Sub {formatCurrency(Math.round(e.subtotal))}</span>
                        {e.tax > 0 && <span>+Tax {formatCurrency(e.tax)}</span>}
                        {e.service > 0 && <span>+Svc {formatCurrency(e.service)}</span>}
                        {e.discount > 0 && <span className="text-emerald-400">-Disc {formatCurrency(e.discount)}</span>}
                      </div>
                      {expandedPreviewParticipant === e.id && e.items.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/40 space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Items</p>
                          {e.items.map((it, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground truncate max-w-[60%]">{it.item} ({it.qty}x)</span>
                              <span className="font-medium text-foreground">{formatCurrency(Math.round(it.share))}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-border space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(Math.round(totalSubtotal))}</span>
                  </div>
                  {totalTax > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tax ({taxPct}%)</span>
                      <span className="font-semibold">+{formatCurrency(totalTax)}</span>
                    </div>
                  )}
                  {totalService > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Service ({servicePct}%)</span>
                      <span className="font-semibold">+{formatCurrency(totalService)}</span>
                    </div>
                  )}
                  {discountVal > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-semibold text-emerald-400">-{formatCurrency(discountVal)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-bold text-muted-foreground">Grand Total</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(Math.max(0, grandTotal))}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          <button
            type="button"
            onClick={() => {
              setShowPreviewModal(false);
              handleCreateSubmit();
            }}
            disabled={createMutation.isPending || !description.trim()}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-60"
          >
            {createMutation.isPending ? "Creating..." : "Create Split Bill"}
          </button>
        </div>
      </Modal>

    </div>
  );
}