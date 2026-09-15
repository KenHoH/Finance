"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { api, extractApiError, get } from "@/lib/api";
import { optimisticCreate, rollbackOnError } from "@/lib/optimistic";
import type { Category, Transaction } from "@/lib/types";
import { dateToApiISO } from "@/lib/utils";
import {
  runValidators,
  validateNumber,
  validateString,
} from "@/lib/validation";
import { useToastStore } from "@/store/useToastStore";

interface FormIncomeProps {
  setIsAddOpen: Dispatch<SetStateAction<boolean>>;
  setIsAddSuccess: Dispatch<SetStateAction<boolean>>;
}

export default function FormIncome({
  setIsAddOpen,
  setIsAddSuccess,
}: FormIncomeProps) {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const optimisticIdRef = useRef(0);
  const addSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [addDesc, setAddDesc] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addDate, setAddDate] = useState("");
  const [addCategoryId, setAddCategoryId] = useState("");

  const { data: incomeCategories = [] } = useQuery<Category[]>({
    queryKey: ["categories", "INCOME"],
    queryFn: () => get<Category[]>("/categories?type=INCOME"),
  });

  const createMutation = useMutation({
    mutationFn: (dto: {
      description: string;
      amount: number;
      type: "INCOME";
      date: string;
      categoryId?: string;
      interval?: string;
    }) => api.post("/transactions", dto),
    onMutate: async (dto) => {
      optimisticIdRef.current += 1;
      const temp: Transaction = {
        id: `opt-${optimisticIdRef.current}`,
        description: dto.description,
        amount: dto.amount,
        type: "INCOME",
        date: dto.date,
        categoryId: dto.categoryId || null,
        category:
          incomeCategories.find((category) => category.id === dto.categoryId) ||
          null,
        source: "manual",
        isAutoTracked: false,
        createdAt: new Date().toISOString(),
      };
      await optimisticCreate(queryClient, ["transactions", "INCOME"], temp);
      await optimisticCreate(queryClient, ["transactions"], temp);
      return {};
    },
    onError: (error) => {
      rollbackOnError(queryClient, ["transactions", "INCOME"], undefined);
      rollbackOnError(queryClient, ["transactions"], undefined);
      addToast(extractApiError(error, "Failed to add income"), "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onSuccess: () => {
      setIsAddSuccess(true);
      addSuccessTimeoutRef.current = setTimeout(() => {
        setIsAddSuccess(false);
        setIsAddOpen(false);
        setAddDesc("");
        setAddAmount("");
        setAddDate("");
        setAddCategoryId("");
      }, 1500);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = runValidators(
      validateString(addDesc, "Description", { min: 1, max: 100 }),
      validateNumber(addAmount, "Amount", { min: 0.01 }),
    );
    if (errors.length > 0) {
      addToast(errors[0].message, "error");
      return;
    }
    createMutation.mutate({
      description: addDesc.trim(),
      amount: Number(addAmount),
      type: "INCOME",
      date: addDate ? dateToApiISO(addDate) : new Date().toISOString(),
      categoryId: addCategoryId || undefined,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Description
        </label>
        <input
          type="text"
          value={addDesc}
          onChange={(event) => setAddDesc(event.target.value)}
          placeholder="e.g. Freelance payment"
          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Amount
        </label>
        <CurrencyInput
          value={addAmount}
          onChange={setAddAmount}
          placeholder="0"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Date
        </label>
        <DatePicker value={addDate} onChange={setAddDate} />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Category
        </label>
        <select
          value={addCategoryId}
          onChange={(event) => setAddCategoryId(event.target.value)}
          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">Select category</option>
          {incomeCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => setIsAddOpen(false)}
          className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
        >
          {createMutation.isPending ? "Adding..." : "Add Income"}
        </button>
      </div>
    </form>
  );
}
