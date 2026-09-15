"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  runValidators,
  validateNumber,
  validateString,
} from "@/lib/validation";
import type { CreateBudgetInput } from "../budget.types";

interface CreateBudgetModalProps {
  isOpen: boolean;
  categories: Category[];
  isCreating: boolean;
  error: string;
  onClose: () => void;
  onClearError: () => void;
  onCreate: (input: CreateBudgetInput, onSuccess: () => void) => void;
}

export function CreateBudgetModal({
  isOpen,
  categories,
  isCreating,
  error,
  onClose,
  onClearError,
  onCreate,
}: CreateBudgetModalProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const clearFieldError = (field: string) => {
    setFieldErrors((previous) => {
      const next = { ...previous };
      delete next[field];
      return next;
    });
    onClearError();
  };

  const handleClose = () => {
    onClose();
    onClearError();
    setFieldErrors({});
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = runValidators(
      validateNumber(amount, "Amount", { min: 0.01 }),
      validateString(startDate, "Start Date"),
      validateString(endDate, "End Date"),
    );
    const mapped: Record<string, string> = {};
    errors.forEach((validationError) => {
      mapped[validationError.field] = validationError.message;
    });
    if (new Date(startDate) > new Date(endDate)) {
      mapped.endDate = "Start date must be before end date";
    }

    setFieldErrors(mapped);
    onClearError();
    if (Object.keys(mapped).length > 0) return;

    onCreate(
      {
        amount: Number(amount),
        startDate,
        endDate,
        categoryId: categoryId || undefined,
      },
      () => {
        setIsSuccess(true);
        setCategoryId("");
        setAmount("");
        setStartDate("");
        setEndDate("");
        timeoutRef.current = setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 1500);
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Budget"
      description="Set a spending limit for a specific category."
      isSuccess={isSuccess}
      successMessage="Budget successfully created!"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField
          label="Category"
          htmlFor="budget-category"
          error={fieldErrors.Category}
        >
          <select
            id="budget-category"
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              clearFieldError("Category");
            }}
            className={cn(
              "w-full px-4 py-3 bg-background border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary transition-all text-base font-medium",
              fieldErrors.Category
                ? "border-rose-500 focus:border-rose-500"
                : "border-border focus:border-primary",
            )}
          >
            <option value="">Overall (no category)</option>
            {categories
              .filter((category) => category.type === "EXPENSE")
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </FormField>

        <FormField
          label="Monthly Limit"
          htmlFor="budget-amount"
          error={fieldErrors.Amount}
        >
          <CurrencyInput
            id="budget-amount"
            value={amount}
            onChange={(value: string) => {
              setAmount(value);
              clearFieldError("Amount");
            }}
            placeholder="0"
            className={cn(
              fieldErrors.Amount
                ? "[&_input]:border-rose-500 [&_input]:focus:border-rose-500"
                : "",
            )}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Start Date"
            htmlFor="budget-start"
            error={fieldErrors["Start Date"]}
          >
            <DatePicker
              id="budget-start"
              value={startDate}
              onChange={(value) => {
                setStartDate(value);
                clearFieldError("Start Date");
              }}
              className={cn(
                fieldErrors["Start Date"]
                  ? "border-rose-500 focus:border-rose-500"
                  : "",
              )}
            />
          </FormField>
          <FormField
            label="End Date"
            htmlFor="budget-end"
            error={fieldErrors["End Date"]}
          >
            <DatePicker
              id="budget-end"
              value={endDate}
              onChange={(value) => {
                setEndDate(value);
                clearFieldError("End Date");
              }}
              className={cn(
                fieldErrors["End Date"]
                  ? "border-rose-500 focus:border-rose-500"
                  : "",
              )}
            />
          </FormField>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        <button
          type="submit"
          disabled={isCreating}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] mt-6 shadow-md disabled:opacity-60"
        >
          {isCreating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Save Budget"
          )}
        </button>
      </form>
    </Modal>
  );
}
