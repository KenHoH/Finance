"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, del, extractApiError, get, post } from "@/lib/api";
import {
  optimisticDelete,
  optimisticUpdate,
  rollbackOnError,
} from "@/lib/optimistic";
import type {
  Budget,
  Category,
  DebtPoint,
  Goal,
  SavingPoint,
} from "@/lib/types";
import { useToastStore } from "@/store/useToastStore";

export function useSavingPoints() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  const { data: points = [], isLoading } = useQuery<SavingPoint[]>({
    queryKey: ["saving-points"],
    queryFn: async () => {
      const response = await get<unknown>("/saving-points");
      return Array.isArray(response) ? response : [];
    },
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      const response = await get<unknown>("/goals");
      return Array.isArray(response) ? response : [];
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await get<unknown>("/categories");
      return Array.isArray(response)
        ? response.filter((category: Category) => category.type === "INVESTMENT")
        : [];
    },
  });

  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: async () => {
      const response = await get<unknown>("/budgets");
      return Array.isArray(response) ? response : [];
    },
  });

  const { data: debtPoints = [] } = useQuery<DebtPoint[]>({
    queryKey: ["debt-points", budgets.map((budget) => budget.id)],
    queryFn: async () => {
      if (budgets.length === 0) return [];
      const response = await post<unknown>(
        "/debt/budget-ids",
        budgets.map((budget) => budget.id),
      );
      return Array.isArray(response) ? response : [];
    },
    enabled: budgets.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/saving-points/${id}`),
    onMutate: async (id) =>
      optimisticDelete(queryClient, ["saving-points"], id),
    onError: (error, _id, context) => {
      rollbackOnError(queryClient, ["saving-points"], context);
      addToast(
        extractApiError(error, "Failed to delete saving point"),
        "error",
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["saving-points"] }),
    onSuccess: () => {
      addToast("Saving point deleted", "success");
    },
  });

  const allocateGoalMutation = useMutation({
    mutationFn: (dto: {
      id: string;
      goalId: string;
      amount: number;
      note?: string;
    }) =>
      api.post(`/saving-points/${dto.id}/allocate-to-goal`, {
        goalId: dto.goalId,
        amount: dto.amount,
        note: dto.note,
      }),
    onMutate: async (dto) => {
      const point = points.find((item) => item.id === dto.id);
      const previousAmount = Number(point?.savingAmount || 0);
      await optimisticUpdate(queryClient, ["saving-points"], dto.id, {
        savingAmount: Math.max(0, previousAmount - dto.amount),
      });
      const goal = goals.find((item) => item.id === dto.goalId);
      const previousCurrentAmount = Number(goal?.currentAmount || 0);
      await optimisticUpdate(queryClient, ["goals"], dto.goalId, {
        currentAmount: previousCurrentAmount + dto.amount,
      });
      return {};
    },
    onError: (error) => {
      rollbackOnError(queryClient, ["saving-points"], undefined);
      rollbackOnError(queryClient, ["goals"], undefined);
      addToast(extractApiError(error, "Failed to allocate"), "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["saving-points"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onSuccess: () => {
      addToast("Allocated to goal", "success");
    },
  });

  const allocateInvestmentMutation = useMutation({
    mutationFn: (dto: {
      id: string;
      categoryId: string;
      amount: number;
      note?: string;
    }) =>
      api.post(`/saving-points/${dto.id}/allocate-to-investment`, {
        categoryId: dto.categoryId,
        amount: dto.amount,
        note: dto.note,
      }),
    onError: (error) => {
      addToast(
        extractApiError(error, "Failed to allocate to investment"),
        "error",
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["saving-points"] });
      queryClient.invalidateQueries({ queryKey: ["investments"] });
    },
    onSuccess: () => {
      addToast("Allocated to investment", "success");
    },
  });

  const payDebtMutation = useMutation({
    mutationFn: (dto: {
      id: string;
      debtPointId: string;
      amount: number;
      note?: string;
    }) =>
      api.post(`/saving-points/${dto.id}/pay-debt`, {
        debtPointId: dto.debtPointId,
        amount: dto.amount,
        note: dto.note,
      }),
    onError: (error) => {
      addToast(extractApiError(error, "Failed to pay debt"), "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["saving-points"] });
      queryClient.invalidateQueries({ queryKey: ["debt-points"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    },
    onSuccess: () => {
      addToast("Debt paid", "success");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (dto: { id: string; savingAmount: number }) =>
      api.put(`/saving-points/${dto.id}`, {
        savingAmount: dto.savingAmount,
      }),
    onMutate: async (dto) =>
      optimisticUpdate(queryClient, ["saving-points"], dto.id, {
        savingAmount: dto.savingAmount,
      }),
    onError: (error, _dto, context) => {
      rollbackOnError(queryClient, ["saving-points"], context);
      addToast(
        extractApiError(error, "Failed to update saving point"),
        "error",
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["saving-points"] }),
    onSuccess: () => {
      addToast("Saving point updated", "success");
    },
  });

  return {
    points,
    goals,
    categories,
    debtPoints,
    isLoading,
    deleteMutation,
    allocateGoalMutation,
    allocateInvestmentMutation,
    payDebtMutation,
    updateMutation,
  };
}

export type SavingPointsFeature = ReturnType<typeof useSavingPoints>;
