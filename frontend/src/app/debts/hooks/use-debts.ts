"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError, get, post } from "@/lib/api";
import { optimisticDelete, optimisticUpdate, rollbackOnError } from "@/lib/optimistic";
import type { Budget, DebtPoint } from "@/lib/types";
import { useToastStore } from "@/store/useToastStore";

interface UseDebtsOptions {
  onUpdateSuccess?: () => void;
}

interface UpdateDebtDto {
  id: string;
  debtAmount: number;
}

export function useDebts({ onUpdateSuccess }: UseDebtsOptions = {}) {
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();

  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: () => get<Budget[]>("/budgets"),
  });

  const debtQueryKey = ["debts", budgets.map((budget) => budget.id)];
  const { data: debts = [], isLoading } = useQuery<DebtPoint[]>({
    queryKey: debtQueryKey,
    queryFn: async () => {
      if(budgets.length === 0) return [];
      return post<DebtPoint[]>("/debt/budget-ids", budgets.map((budget) => budget.id));
    },
    enabled: budgets.length > 0,
  });

  const updateMutation = useMutation({
    mutationFn: (dto: UpdateDebtDto) =>
      api.put(`/debt/update/${dto.id}`, { debtAmount: dto.debtAmount }),
    onMutate: async (dto) =>
      optimisticUpdate(queryClient, debtQueryKey, dto.id, { debtAmount: dto.debtAmount }),
    onError: (error, dto, context) => {
      rollbackOnError(queryClient, debtQueryKey, context);
      addToast(extractApiError(error, "Failed to update debt"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["debts"] }),
    onSuccess: () => {
      onUpdateSuccess?.();
      addToast("Debt updated", "success");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/debt/delete/${id}`),
    onMutate: async (id) => optimisticDelete(queryClient, debtQueryKey, id),
    onError: (error, id, context) => {
      rollbackOnError(queryClient, debtQueryKey, context);
      addToast(extractApiError(error, "Failed to delete debt"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["debts"] }),
    onSuccess: () => {
      addToast("Debt deleted", "success");
    },
  });

  return {
    budgets,
    debts,
    totalDebt: debts.reduce((total, debt) => total + Number(debt.debtAmount), 0),
    isLoading,
    updateDebt: updateMutation.mutate,
    deleteDebt: deleteMutation.mutate,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
