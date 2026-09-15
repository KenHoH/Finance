"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError, get } from "@/lib/api";
import {
  optimisticCreate,
  optimisticDelete,
  optimisticUpdate,
  rollbackOnError,
} from "@/lib/optimistic";
import type { Budget, Category } from "@/lib/types";
import { useToastStore } from "@/store/useToastStore";
import type {
  AggregatedBudget,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "../budget.types";

const budgetsQueryKey: unknown[] = ["budgets"];
const aggregatedBudgetsQueryKey: unknown[] = ["budgets", "aggregated"];

export function useBudgets() {
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const optimisticIdRef = useRef(0);
  const [createError, setCreateError] = useState("");
  const [updateError, setUpdateError] = useState("");

  const { data: aggregated = [], isLoading } = useQuery<AggregatedBudget[]>({
    queryKey: aggregatedBudgetsQueryKey,
    queryFn: () => get<AggregatedBudget[]>("/budgets/aggregated"),
  });

  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: budgetsQueryKey,
    queryFn: () => get<Budget[]>("/budgets"),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => get<Category[]>("/categories"),
  });

  const invalidateBudgets = () => {
    queryClient.invalidateQueries({ queryKey: budgetsQueryKey });
    queryClient.invalidateQueries({ queryKey: aggregatedBudgetsQueryKey });
  };

  const createMutation = useMutation({
    mutationFn: (input: CreateBudgetInput) => api.post("/budgets", input),
    onMutate: async (input) => {
      const optimisticBudget: Budget = {
        id: `opt-${++optimisticIdRef.current}`,
        amount: input.amount,
        startDate: input.startDate,
        endDate: input.endDate,
        categoryId: input.categoryId || null,
        category:
          categories.find((category) => category.id === input.categoryId) ||
          null,
        createdAt: new Date().toISOString(),
      };

      return optimisticCreate(
        queryClient,
        budgetsQueryKey,
        optimisticBudget,
      );
    },
    onError: (error, _input, context) => {
      rollbackOnError(queryClient, budgetsQueryKey, context);
      setCreateError(extractApiError(error, "Failed to create budget"));
    },
    onSuccess: () => setCreateError(""),
    onSettled: invalidateBudgets,
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateBudgetInput) => {
      const { id, ...body } = input;
      return api.put(`/budgets/${id}`, body);
    },
    onMutate: async (input) =>
      optimisticUpdate(queryClient, budgetsQueryKey, input.id, {
        amount: input.amount,
        startDate: input.startDate,
        endDate: input.endDate,
      }),
    onError: (error, _input, context) => {
      rollbackOnError(queryClient, budgetsQueryKey, context);
      setUpdateError(extractApiError(error, "Failed to update budget"));
    },
    onSuccess: () => {
      setUpdateError("");
      addToast("Budget updated", "success");
    },
    onSettled: invalidateBudgets,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/${id}`),
    onMutate: async (id) =>
      optimisticDelete(queryClient, budgetsQueryKey, id),
    onError: (error, _id, context) => {
      rollbackOnError(queryClient, budgetsQueryKey, context);
      addToast(extractApiError(error, "Failed to delete budget"), "error");
    },
    onSuccess: () => addToast("Budget deleted", "success"),
    onSettled: invalidateBudgets,
  });

  return {
    aggregated,
    budgets,
    categories,
    isLoading,
    createBudget: (input: CreateBudgetInput, onSuccess: () => void) =>
      createMutation.mutate(input, { onSuccess }),
    updateBudget: (input: UpdateBudgetInput, onSuccess: () => void) =>
      updateMutation.mutate(input, { onSuccess }),
    deleteBudget: (id: string) => deleteMutation.mutate(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError,
    updateError,
    clearCreateError: () => setCreateError(""),
    clearUpdateError: () => setUpdateError(""),
  };
}
