"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircle2, Clock, ChevronLeft,
  Loader2, Upload,
  AlertCircle, Trash2,
  User, X, Eye, Undo2, FileText, PenLine
} from "lucide-react";
import { api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn, formatCurrency } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import type { SplitBill, SplitParticipant } from "@/lib/types";

function getStatusBadge(status: SplitParticipant["status"]) {
  if(status === "CONFIRMED") return <span className="px-2 py-1 bg-sky-500/20 text-sky-300 text-xs font-bold rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Confirmed</span>;
  if(status === "PAID_PENDING_CONFIRMATION") return <span className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Awaiting confirmation</span>;
  return <span className="px-2 py-1 bg-slate-500/20 text-slate-300 text-xs font-bold rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
}

function getParticipantColor(name: string){
  const colors = [
    { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/30" },
    { bg: "bg-sky-500/20", text: "text-sky-400", border: "border-sky-500/30" },
    { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
    { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
    { bg: "bg-violet-500/20", text: "text-violet-400", border: "border-violet-500/30" },
    { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
  ];
  let hash = 0;
  for(let i = 0; i < name.length; i++){
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function SplitBillDetailPage() {
  const router = useRouter();
  const params = useParams();
  const billId = params.id as string;
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofForParticipant, setProofForParticipant] = useState<string | null>(null);
  const proofFileInputRef = useRef<HTMLInputElement>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  const [confirmParticipantId, setConfirmParticipantId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const { data: bill, isLoading } = useQuery<SplitBill>({
    queryKey: ["split-bills", billId],
    queryFn: async () => {
      const res = await api.get(`/split-bills/${billId}`);
      return res.data;
    },
  });

  const updateParticipantMutation = useMutation({
    mutationFn: (dto: { participantId: string; status?: string; rejectionReason?: string; notes?: string }) =>
      api.put(`/split-bills/${billId}/participants/${dto.participantId}`, { status: dto.status, rejectionReason: dto.rejectionReason, notes: dto.notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["split-bills", billId] });
      queryClient.invalidateQueries({ queryKey: ["split-bills"] });
      addToast("Participant updated", "success");
    },
    onError: (err) => addToast(extractApiError(err, "Failed to update participant"), "error"),
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (dto: { participantId: string }) =>
      api.post(`/split-bills/${billId}/confirm/${dto.participantId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["split-bills", billId] });
      queryClient.invalidateQueries({ queryKey: ["split-bills"] });
      addToast("Payment confirmed", "success");
    },
    onError: (err) => addToast(extractApiError(err, "Failed to confirm payment"), "error"),
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: (dto: { participantId: string; reason?: string }) =>
      api.post(`/split-bills/${billId}/reject/${dto.participantId}`, { reason: dto.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["split-bills", billId] });
      queryClient.invalidateQueries({ queryKey: ["split-bills"] });
      addToast("Payment rejected", "success");
      setRejectReason("");
    },
    onError: (err) => addToast(extractApiError(err, "Failed to reject payment"), "error"),
  });

  const uploadProofMutation = useMutation({
    mutationFn: async (dto: { participantId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", dto.file);
      const res = await api.post(`/split-bills/${billId}/participants/${dto.participantId}/proof`, formData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["split-bills", billId] });
      addToast("Proof uploaded", "success");
    },
    onError: (err) => addToast(extractApiError(err, "Failed to upload proof"), "error"),
  });

  const markAsPaidMutation = useMutation({
    mutationFn: (dto: { participantId: string }) =>
      api.post(`/split-bills/${billId}/participants/${dto.participantId}/pay`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["split-bills", billId] });
      queryClient.invalidateQueries({ queryKey: ["split-bills"] });
      addToast("Marked as paid.", "success");
    },
    onError: (err) => addToast(extractApiError(err, "Failed to mark as paid"), "error"),
  });

  const revertMarkAsPaidMutation = useMutation({
    mutationFn: (dto: { participantId: string }) =>
      api.post(`/split-bills/${billId}/participants/${dto.participantId}/revert`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["split-bills", billId] });
      queryClient.invalidateQueries({ queryKey: ["split-bills"] });
      addToast("Reverted to pending.", "success");
    },
    onError: (err) => addToast(extractApiError(err, "Failed to revert"), "error"),
  });

  const deleteBillMutation = useMutation({
    mutationFn: () => api.delete(`/split-bills/${billId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["split-bills"] });
      addToast("Split bill deleted", "success");
      router.push("/split-bills");
    },
    onError: (err) => addToast(extractApiError(err, "Failed to delete split bill"), "error"),
  });

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>, participantId: string) => {
    const f = e.target.files?.[0];
    if(!f) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if(!allowed.includes(f.type)){
      addToast("Only PNG/JPG/WEBP allowed", "error");
      return;
    }
    if(f.size > 5 * 1024 * 1024){
      addToast("File must be under 5MB", "error");
      return;
    }
    setProofFile(f);
    setProofPreview(URL.createObjectURL(f));
    setProofForParticipant(participantId);
  };

  const handleCancelProof = () => {
    if(proofPreview){
      URL.revokeObjectURL(proofPreview);
    }
    setProofFile(null);
    setProofPreview(null);
    setProofForParticipant(null);
    if(proofFileInputRef.current){
      proofFileInputRef.current.value = "";
    }
  };

  const handleConfirmProofUpload = () => {
    if(!proofFile || !proofForParticipant) return;
    uploadProofMutation.mutate({ participantId: proofForParticipant, file: proofFile });
    handleCancelProof();
  };

  if(isLoading){
    return (
      <div className="min-h-screen bg-background text-foreground p-6 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if(!bill){
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground font-medium">Bill not found</p>
          <button
            onClick={() => router.push("/split-bills")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isCreator = bill.creatorId === userId;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/split-bills")}
            className="p-2 rounded-xl bg-accent hover:bg-accent/80 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground truncate">{bill.description}</h1>
            <p className="text-sm text-muted-foreground">{format(new Date(bill.date), 'dd MMM yyyy')}</p>
          </div>
          {isCreator && (
            <button
              onClick={() => setBillToDelete(billId)}
              disabled={deleteBillMutation.isPending}
              className="p-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              aria-label="Delete bill"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Total card */}
        <div className="bg-accent/50 rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase">Total Amount</p>
            <p className="text-2xl font-extrabold text-primary">{formatCurrency(Number(bill.totalAmount))}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase">
              {bill.status === "SETTLED" ? "Settled" : bill.status === "PARTIALLY_PAID" ? "Partially Paid" : "Pending"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {bill.participants.filter(p => p.status === "CONFIRMED").length}/{bill.participants.length} paid
            </p>
          </div>
        </div>

        {/* Receipt Image */}
        {bill.receiptImageUrl && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-400 uppercase px-2">Original Receipt</h4>
            <div className="rounded-xl overflow-hidden border border-border bg-card">
              <img
                src={bill.receiptImageUrl}
                alt="Receipt"
                className="w-full h-96 object-contain bg-neutral-900 cursor-pointer"
                onClick={() => setLightboxImage(bill.receiptImageUrl || null)}
              />
            </div>
            <p className="text-[10px] text-muted-foreground text-center">Tap image to view full size</p>
          </div>
        )}

        {/* Participants */}
        <div>
          <h4 className="text-sm font-bold text-slate-400 uppercase mb-3 px-2">Participants</h4>
          <div className="space-y-2">
            {bill.participants.map((p) => {
              const isMe = p.userId === userId;
              const isCreatorParticipant = p.userId === bill.creatorId;
              const showProofPreview = proofPreview && proofFile && proofForParticipant === p.id;
              const canActAsParticipant = isMe && p.status === "PENDING";
              const canManageAsCreator = isCreator && (p.status === "PENDING" || p.status === "PAID_PENDING_CONFIRMATION");
              return (
                <div key={p.id} className="p-3 rounded-xl bg-accent/30 border border-border/60">
                  {/* Row 1: Avatar, Name, Status, Amount, Creator Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {(() => {
                        const color = getParticipantColor(p.name);
                        return p.user?.avatar ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border">
                            <img src={p.user.avatar} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                        ) : p.userId ? (
                          <div className={cn("w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center border", color.bg, color.border)}>
                            <span className={cn("text-base font-bold", color.text)}>{p.name.slice(0,2).toUpperCase()}</span>
                          </div>
                        ) : (
                          <div className={cn("w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center border", color.bg, color.border)}>
                            <User className={cn("w-5 h-5", color.text)} />
                          </div>
                        );
                      })()}
                      <div className="min-w-0">
                        <p className="text-base font-bold text-foreground truncate">
                          {p.name}
                          {isCreatorParticipant && <span className="text-emerald-400 text-xs font-medium ml-1">(Creator)</span>}
                          {isMe && !isCreatorParticipant && <span className="text-muted-foreground text-xs font-medium ml-1">(You)</span>}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(p.status)}
                          {p.paymentProofUrl && (
                            <button
                              type="button"
                              onClick={() => setLightboxImage(p.paymentProofUrl || null)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-accent hover:bg-accent/80 transition-colors text-foreground"
                            >
                              <Eye className="w-3 h-3" /> View Proof
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-foreground">{formatCurrency(Number(p.amountOwed))}</p>
                      {/* Creator confirm/reject inline */}
                      {isCreator && p.status === "PAID_PENDING_CONFIRMATION" && (
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => setConfirmParticipantId(p.id)}
                            disabled={confirmPaymentMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-500 text-white hover:brightness-110 transition-all disabled:opacity-50"
                            title="Confirm payment"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if(!rejectReason.trim()){
                                addToast("Please provide a reason for rejection", "error");
                                return;
                              }
                              rejectPaymentMutation.mutate({ participantId: p.id, reason: rejectReason });
                            }}
                            disabled={rejectPaymentMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-rose-500 text-white hover:brightness-110 transition-all disabled:opacity-50"
                            title="Reject payment"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rejection reason */}
                  {p.rejectionReason && p.status === "PENDING" && (
                    <div className="mt-2 ml-[52px] flex items-start gap-2 text-sm text-amber-400">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Payment rejected: {p.rejectionReason}</span>
                    </div>
                  )}

                  {/* Notes */}
                  {p.notes && (
                    <div className="mt-2 ml-[52px] flex items-start gap-2 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{p.notes}</span>
                    </div>
                  )}
                  {isCreator && editingNotes === p.id ? (
                    <div className="mt-2 ml-[52px] flex gap-2">
                      <input
                        type="text"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Add a note..."
                        className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateParticipantMutation.mutate({ participantId: p.id, notes: noteDraft });
                          setEditingNotes(null);
                          setNoteDraft("");
                        }}
                        disabled={updateParticipantMutation.isPending}
                        className="px-2 py-1.5 rounded-lg text-xs font-bold bg-sky-500 text-white hover:brightness-110 transition-all disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingNotes(null); setNoteDraft(""); }}
                        className="px-2 py-1.5 rounded-lg text-xs font-bold bg-accent text-foreground hover:bg-accent/80 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : isCreator ? (
                    <button
                      type="button"
                      onClick={() => { setEditingNotes(p.id); setNoteDraft(p.notes || ""); }}
                      className="mt-2 ml-[52px] flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <PenLine className="w-3 h-3" /> {p.notes ? "Edit note" : "Add note"}
                    </button>
                  ) : null}

                  {/* Reject reason input for creator */}
                  {isCreator && p.status === "PAID_PENDING_CONFIRMATION" && (
                    <div className="mt-2 ml-[52px]">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Rejection reason (required to reject)"
                        className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  )}

                  {/* Actions row: participant or creator */}
                  {(canActAsParticipant || canManageAsCreator) && (
                    <div className="mt-3 ml-[52px]">
                      {showProofPreview ? (
                        <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                          <p className="text-xs font-bold text-muted-foreground">Preview</p>
                          <img src={proofPreview} alt="Preview" className="w-full h-32 object-contain rounded-lg bg-neutral-900" />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleConfirmProofUpload}
                              disabled={uploadProofMutation.isPending}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500 text-white hover:brightness-110 transition-all disabled:opacity-50"
                            >
                              {uploadProofMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} OK
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelProof}
                              disabled={uploadProofMutation.isPending}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-accent text-foreground hover:bg-accent/80 transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {/* Upload Proof button - participant or creator */}
                          {(canActAsParticipant || (isCreator && p.status === "PENDING")) && (
                            <button
                              type="button"
                              onClick={() => proofFileInputRef.current?.click()}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-accent hover:bg-accent/80 transition-colors text-foreground"
                            >
                              <Upload className="w-3.5 h-3.5" /> Upload Proof
                            </button>
                          )}
                          <input
                            ref={proofFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleProofFileChange(e, p.id)}
                          />
                          {/* Mark as Paid button - participant or creator */}
                          {(canActAsParticipant || (isCreator && p.status === "PENDING")) && (
                            <button
                              type="button"
                              onClick={() => markAsPaidMutation.mutate({ participantId: p.id })}
                              disabled={markAsPaidMutation.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500 text-white hover:brightness-110 transition-all disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> {isCreator ? "Mark Paid" : "I Have Paid"}
                            </button>
                          )}
                          {/* Revert button */}
                          {(isMe || isCreator) && p.status === "PAID_PENDING_CONFIRMATION" && (
                            <button
                              type="button"
                              onClick={() => revertMarkAsPaidMutation.mutate({ participantId: p.id })}
                              disabled={revertMarkAsPaidMutation.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                            >
                              <Undo2 className="w-3.5 h-3.5" /> Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Full size"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!billToDelete}
        onConfirm={() => {
          if(billToDelete){
            deleteBillMutation.mutate();
            setBillToDelete(null);
          }
        }}
        onCancel={() => setBillToDelete(null)}
        title="Delete split bill?"
        description="Are you sure you want to delete this split bill? This action cannot be undone."
        confirmLabel={deleteBillMutation.isPending ? "Deleting..." : "Delete"}
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!confirmParticipantId}
        onConfirm={() => {
          if(confirmParticipantId){
            confirmPaymentMutation.mutate({ participantId: confirmParticipantId });
            setConfirmParticipantId(null);
          }
        }}
        onCancel={() => setConfirmParticipantId(null)}
        title="Confirm payment?"
        description="Are you sure you want to confirm this participant's payment?"
        confirmLabel={confirmPaymentMutation.isPending ? "Confirming..." : "Confirm Payment"}
        variant="primary"
      />
    </div>
  );
}
