import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export function unwrapArray<T>(res: unknown): T[]{
  if(Array.isArray(res)) return res as T[];
  if(res && typeof res === "object"){
    const obj = res as Record<string, unknown>;
    if(Array.isArray(obj.data)) return obj.data as T[];
    if(Array.isArray(obj.transactions)) return obj.transactions as T[];
    if(Array.isArray(obj.allData)) return obj.allData as T[];
  }
  return [];
}

export function formatLocalDate(d: Date): string{
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dateToApiISO(dateStr: string): string{
  if(!dateStr) return new Date().toISOString();
  return new Date(`${dateStr}T12:00:00`).toISOString();
}

export function apiDateToInput(dateStr: string): string{
  if(!dateStr) return "";
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? match[0] : "";
}
