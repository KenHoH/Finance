import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { api, extractApiError, get } from "@/lib/api";
import { optimisticCreate, rollbackOnError } from "@/lib/optimistic";
import { Category, Transaction } from "@/lib/types";
import { dateToApiISO } from "@/lib/utils";
import {
  runValidators,
  validateNumber,
  validateString,
} from "@/lib/validation";
import { useToastStore } from "@/store/useToastStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useRef, useState } from "react";

export default function FormExpenses({
  setIsAddOpen,
  setIsAddSuccess,
}: {
  setIsAddOpen: Dispatch<SetStateAction<boolean>>;
  setIsAddSuccess: Dispatch<SetStateAction<boolean>>;
}) {
  const queryClient = useQueryClient();
  const optimisticIdRef = useRef(0);
  const addSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const createMutation = useMutation({
    mutationFn: (dto: {
      description: string;
      amount: number;
      type: "EXPENSE";
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
        type: "EXPENSE",
        date: dto.date,
        categoryId: dto.categoryId || null,
        category:
          expenseCategories.find((c) => c.id === dto.categoryId) || null,
        source: "manual",
        isAutoTracked: false,
        createdAt: new Date().toISOString(),
      };
      await optimisticCreate(queryClient, ["transactions", "EXPENSE"], temp);
      await optimisticCreate(queryClient, ["transactions"], temp);
      return {};
    },
    onError: (err) => {
      rollbackOnError(queryClient, ["transactions", "EXPENSE"], undefined);
      rollbackOnError(queryClient, ["transactions"], undefined);
      addToast(extractApiError(err, "Failed to add expense"), "error");
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
        setAddInterval("none");
      }, 1500);
    },
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    const err = runValidators(
      validateString(addDesc, "Description", { min: 1, max: 100 }),
      validateNumber(addAmount, "Amount", { min: 0.01 }),
    );
    if (err.length > 0) {
      addToast(err[0].message, "error");
      return;
    }
    createMutation.mutate({
      description: addDesc.trim(),
      amount: Number(addAmount),
      type: "EXPENSE",
      date: addDate ? dateToApiISO(addDate) : new Date().toISOString(),
      categoryId: addCategoryId || undefined,
      interval: addInterval === "none" ? undefined : addInterval,
    });
  };
  const addToast = useToastStore((s) => s.addToast);
  const [addDesc, setAddDesc] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addDate, setAddDate] = useState("");
  const [addCategoryId, setAddCategoryId] = useState("");
  const [addInterval, setAddInterval] = useState<
    "none" | "daily" | "weekly" | "monthly" | "yearly"
  >("none");

  const { data: expenseCategories = [] } = useQuery<Category[]>({
    queryKey: ["categories", "EXPENSE"],
    queryFn: () => get<Category[]>("/categories?type=EXPENSE"),
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Description
        </label>
        <input
          type="text"
          value={addDesc}
          onChange={(e) => setAddDesc(e.target.value)}
          placeholder="e.g. Grocery shopping"
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
          onChange={(e) => setAddCategoryId(e.target.value)}
          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">Select category</option>
          {expenseCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Repeat
        </label>
        <select
          value={addInterval}
          onChange={(e) =>
            setAddInterval(
              e.target.value as
                "none" | "daily" | "weekly" | "monthly" | "yearly",
            )
          }
          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="none">One-time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
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
          {createMutation.isPending ? "Adding..." : "Add Expense"}
        </button>
      </div>
    </form>
  );
}
