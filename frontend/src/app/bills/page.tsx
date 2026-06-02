"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Edit2, CheckCircle2, AlertTriangle, Calendar, Loader2, Bell } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { cn, formatCurrency, dateToApiISO, apiDateToInput, unwrapArray } from "@/lib/utils";
import { validateString, validateNumber, runValidators } from "@/lib/validation";
import { Modal } from "@/components/ui/Modal";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Bill } from "@/lib/types";
import { optimisticCreate, optimisticUpdate, optimisticDelete, rollbackOnError } from "@/lib/optimistic";

export default function BillsPage(){
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);

  const { data: bills = [], isLoading } = useQuery<Bill[]>({
    queryKey: ["bills"],
    queryFn: async() => {
      const res = await get<unknown>("/bills");
      return unwrapArray<Bill>(res);
    },
  });

  const { data: reminders = [] } = useQuery<Bill[]>({
    queryKey: ["bills", "reminders"],
    queryFn: async() => {
      const res = await get<unknown>("/bills/reminders");
      return unwrapArray<Bill>(res);
    },
    enabled: !isLoading,
  });

  const { data: overdueCheck } = useQuery<{ updated: number }>({
    queryKey: ["bills", "check-overdue"],
    queryFn: () => get("/bills/check-overdue"),
    enabled: !isLoading,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { if(timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const createMutation = useMutation({
    mutationFn: (dto: { title: string; amount: number; dueDate: string }) =>
      api.post("/bills", dto),
    onMutate: async (dto) => {
      const temp: Bill = {
        id: `opt-${Date.now()}`,
        title: dto.title,
        amount: dto.amount,
        dueDate: dto.dueDate,
        status: "PENDING",
        categoryId: null,
        createdAt: new Date().toISOString(),
      };
      return optimisticCreate(queryClient, ["bills"], temp);
    },
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["bills"], context);
      addToast(extractApiError(err, "Failed to create bill"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["bills"] }),
    onSuccess: () => {
      setIsSuccess(true);
      setTitle("");
      setAmount("");
      setDueDate("");
      timeoutRef.current = setTimeout(() => {
        setIsSuccess(false);
        setIsModalOpen(false);
      }, 1500);
    },
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => api.post(`/bills/${id}/pay`),
    onMutate: async (id) => optimisticUpdate(queryClient, ["bills"], id, { status: "PAID" }),
    onError: (err, id, context) => {
      rollbackOnError(queryClient, ["bills"], context);
      addToast(extractApiError(err, "Failed to pay bill"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["bills"] }),
    onSuccess: () => {
      addToast("Bill marked as paid", "success");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bills/${id}`),
    onMutate: async (id) => optimisticDelete(queryClient, ["bills"], id),
    onError: (err, id, context) => {
      rollbackOnError(queryClient, ["bills"], context);
      addToast(extractApiError(err, "Failed to delete bill"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["bills"] }),
    onSuccess: () => {
      addToast("Bill deleted", "success");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (dto: { id: string; title: string; amount: number; dueDate: string }) =>
      api.put(`/bills/${dto.id}`, { title: dto.title, amount: dto.amount, dueDate: dto.dueDate }),
    onMutate: async (dto) => optimisticUpdate(queryClient, ["bills"], dto.id, { title: dto.title, amount: dto.amount, dueDate: dto.dueDate }),
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["bills"], context);
      addToast(extractApiError(err, "Failed to update bill"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["bills"] }),
    onSuccess: () => {
      setEditBill(null);
      setEditTitle("");
      setEditAmount("");
      setEditDueDate("");
      addToast("Bill updated", "success");
    },
  });

  const totalPending = bills
    .filter((b) => b.status === "PENDING" || b.status === "OVERDUE")
    .reduce((acc, b) => acc + Number(b.amount), 0);

  const overdueCount = bills.filter((b) => b.status === "OVERDUE").length;

  if(isLoading){
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-24">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-4">
          {[0,1,2,3,4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            Bills
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track your bills</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] hover:brightness-110"
        >
          <Plus className="w-5 h-5" /> New Bill
        </button>
      </header>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Bill"
        description="Add a bill to track."
        isSuccess={isSuccess}
        successMessage="Bill created successfully."
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const errors = runValidators(
              validateString(title, "Title", { min: 1, max: 100 }),
              validateNumber(amount, "Amount", { min: 0.01 }),
              validateString(dueDate, "Due Date")
            );
            if(errors.length > 0){
              addToast(errors[0].message, "error");
              return;
            }
            createMutation.mutate({
              title: title.trim(),
              amount: Number(amount),
              dueDate,
            });
          }}
        >
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Electricity Bill"
              required
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Amount</label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              placeholder="0"
              required
              className="[&_input]:px-4 [&_input]:py-3 [&_input]:text-base [&_input]:font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Due Date</label>
            <DatePicker value={dueDate} onChange={setDueDate} required className="[&_input]:px-4 [&_input]:py-3 [&_input]:text-base [&_input]:font-medium" />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] mt-6 shadow-md disabled:opacity-60"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Create Bill"
            )}
          </button>
        </form>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-7">
          <div className="text-sm font-medium text-slate-400 mb-1">Total Pending</div>
          <p className="text-3xl font-bold text-foreground">{formatCurrency(totalPending)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-7">
          <div className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-rose-400" /> Overdue</div>
          <p className="text-3xl font-bold text-foreground">{overdueCount}</p>
          {overdueCheck && overdueCheck.updated > 0 && (
            <p className="text-sm text-red-400 mt-1">{overdueCheck.updated} updated</p>
          )}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-7">
          <div className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-sky-400" /> Paid</div>
          <p className="text-3xl font-bold text-foreground">{bills.filter((b) => b.status === "PAID").length}</p>
        </motion.div>
      </div>

      {/* Reminders */}
      {reminders.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-400" />
            Upcoming Reminders
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {reminders.slice(0, 4).map((bill) => (
              <div key={bill.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{bill.title}</p>
                  <p className="text-sm text-muted-foreground">Due {format(new Date(bill.dueDate), "dd MMM yyyy")}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{formatCurrency(Number(bill.amount))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {bills.map((bill, i) => {
          const due = new Date(bill.dueDate);
          const isOverdue = bill.status === "OVERDUE" || (bill.status === "PENDING" && isPast(due) && !isToday(due));
          return (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border p-5 bg-card flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10"
            >
              <div className="flex items-center gap-5">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  bill.status === "PAID" ? "bg-sky-500/20 text-sky-400" :
                  isOverdue ? "bg-rose-500/20 text-rose-400" :
                  "bg-sky-500/20 text-sky-400"
                )}>
                  {bill.status === "PAID" ? <CheckCircle2 className="w-6 h-6" /> :
                   isOverdue ? <AlertTriangle className="w-6 h-6" /> :
                   <Calendar className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground">{bill.title}</p>
                    {bill.category && (
                      <span className="px-2 py-0.5 bg-accent text-muted-foreground text-sm font-bold rounded-full">{bill.category.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mt-0.5">
                    <span>Due {format(due, "dd MMM yyyy")}</span>
                    {isOverdue && <span className="text-rose-500 font-bold">Overdue</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <p className="text-xl font-extrabold text-foreground">{formatCurrency(Number(bill.amount))}</p>
                <div className="flex items-center gap-1">
                  {bill.status !== "PAID" && (
                    <button
                      onClick={() => payMutation.mutate(bill.id)}
                      disabled={payMutation.isPending}
                      className="px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-bold hover:bg-sky-400 transition-colors active:scale-95 disabled:opacity-60"
                    >
                      Pay
                    </button>
                  )}
                  <button
                    onClick={() => { setEditBill(bill); setEditTitle(bill.title); setEditAmount(String(bill.amount)); setEditDueDate(apiDateToInput(bill.dueDate)); }}
                    className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    aria-label="Edit bill"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => { setBillToDelete(bill.id); setShowDeleteConfirm(true); }}
                    className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    aria-label="Delete bill"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {bills.length === 0 && (
          <EmptyState
            image="/empty-bills.png"
            title="No bills yet"
            description="Create one to track payments."
          />
        )}
      </div>

      <Modal
        isOpen={!!editBill}
        onClose={() => setEditBill(null)}
        title="Edit Bill"
        description="Update bill details."
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="e.g. Rent"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Amount</label>
            <CurrencyInput
              value={editAmount}
              onChange={setEditAmount}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Due Date</label>
            <DatePicker
              value={editDueDate}
              onChange={(val) => setEditDueDate(val)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setEditBill(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors">Cancel</button>
          <button
            onClick={() => { if(editTitle && editAmount && editDueDate && editBill) updateMutation.mutate({ id: editBill.id, title: editTitle, amount: Number(editAmount), dueDate: dateToApiISO(editDueDate) }); }}
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={() => { if(billToDelete) deleteMutation.mutate(billToDelete); }}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete bill?"
        description="Are you sure you want to delete this bill? This action cannot be undone."
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </div>
  );
}
