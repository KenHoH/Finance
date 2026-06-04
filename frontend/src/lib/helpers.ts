/**
 * General utility helpers for the FinPro frontend.
 * These reduce code duplication across pages and components.
 */

import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { id } from "date-fns/locale";

/** Debounce a function call by `ms` milliseconds. */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if(timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Throttle a function to run at most once every `ms` milliseconds. */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if(now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

/** Format a date as a relative string e.g. "2 hours ago", "Yesterday". */
export function formatDateRelative(dateInput: string | Date): string {
  const d = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
  if(!isValid(d)) return "";
  return formatDistanceToNow(d, { addSuffix: true, locale: id });
}

/** Centralized display formatter: "dd MMM yyyy" or "dd MMMM yyyy, HH:mm". */
export function formatDateDisplay(
  dateInput: string | Date,
  opts?: { withTime?: boolean; longMonth?: boolean }
): string {
  const d = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
  if(!isValid(d)) return "";
  if(opts?.withTime) {
    return format(d, opts.longMonth ? "dd MMMM yyyy, HH:mm" : "dd MMM yyyy, HH:mm", { locale: id });
  }
  return format(d, opts?.longMonth ? "dd MMMM yyyy" : "dd MMM yyyy", { locale: id });
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Calculate percentage safely (avoids division by zero). */
export function calculatePercentage(part: number, total: number, decimals = 0): number {
  if(!total || total <= 0) return 0;
  const pct = (part / total) * 100;
  return Number(pct.toFixed(decimals));
}

/** Group an array of objects by a key. */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const k = String(item[key]);
    if(!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/** Sort an array of objects by a date string key. */
export function sortByDate<T>(
  array: T[],
  key: keyof T,
  desc = true
): T[] {
  return [...array].sort((a, b) => {
    const da = new Date(String(a[key])).getTime();
    const db = new Date(String(b[key])).getTime();
    if(isNaN(da) || isNaN(db)) return 0;
    return desc ? db - da : da - db;
  });
}

/** Generate a CSV string from data and headers. */
export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: { key: keyof T; label: string }[]
): string {
  const headerRow = headers.map((h) => `"${h.label}"`).join(",");
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h.key];
        const str = val === null || val === undefined ? "" : String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",")
  );
  return [headerRow, ...rows].join("\n");
}

/** Trigger a file download in the browser. */
export function downloadFile(content: string, filename: string, type = "text/csv"): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Check if a date is in the past (overdue). */
export function isOverdue(dateInput: string | Date): boolean {
  const d = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
  if(!isValid(d)) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now;
}

/** Check if a date is due within `days` from now. */
export function isDueSoon(dateInput: string | Date, days = 3): boolean {
  const d = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
  if(!isValid(d)) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return d >= now && d <= threshold;
}

/** Truncate a string to `maxLength` with optional ellipsis. */
export function truncate(str: string, maxLength: number, suffix = "..."): string {
  if(str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/** Convert a string to a URL-friendly slug. */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Compact number formatting: 1200000 -> "1.2M". */
export function formatNumberCompact(n: number): string {
  const abs = Math.abs(n);
  if(abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "Mrd";
  if(abs >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if(abs >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "rb";
  return String(n);
}

/** Deep equality check for plain objects/arrays (not for class instances). */
export function deepEqual(a: unknown, b: unknown): boolean {
  if(a === b) return true;
  if(typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if(keysA.length !== keysB.length) return false;
  for(const key of keysA) {
    if(!keysB.includes(key)) return false;
    if(!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false;
  }
  return true;
}

/** Generate initials from a name. */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Pick a deterministic color class from a string. */
export function getColorFromString(str: string): string {
  const colors = [
    "bg-sky-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-violet-500",
    "bg-cyan-500",
    "bg-orange-500",
    "bg-lime-500",
  ];
  let hash = 0;
  for(let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}
