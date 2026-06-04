"use client";

import React, { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { cn, formatLocalDate } from "@/lib/utils";
import type { DatePickerProps } from "@/lib/types";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  setYear,
  setMonth,
  isToday,
} from "date-fns";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, placeholder, className, id, required }, ref) => {
    const [open, setOpen] = useState(false);
    const [pendingDate, setPendingDate] = useState<string | null>(value || null);
    const [viewDate, setViewDate] = useState(() => {
      if(value){
        const d = new Date(value);
        return !Number.isNaN(d.getTime()) ? d : new Date();
      }
      return new Date();
    });
    const [picker, setPicker] = useState<"days" | "months">("days");

    const selectedDate = pendingDate ? new Date(pendingDate) : null;

    const handleOpen = () => {
      setPendingDate(value || null);
      if(value){
        const d = new Date(value);
        if(!Number.isNaN(d.getTime())) setViewDate(d);
      }
      setPicker("days");
      setOpen(true);
    };
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    const handleConfirm = () => {
      if(pendingDate){
        onChange(pendingDate);
      }
      setOpen(false);
    };

    const handleCancel = () => {
      setOpen(false);
    };

    const handleSelect = (day: Date) => {
      setPendingDate(formatLocalDate(day));
    };

    const handleSelectMonth = (idx: number) => {
      setViewDate(setMonth(viewDate, idx));
      setPicker("days");
    };

    return (
      <>
        <div className={cn("relative", className)}>
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
          <input
            ref={ref}
            id={id}
            readOnly
            value={value}
            placeholder={placeholder}
            required={required}
            onClick={handleOpen}
            className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
          />
        </div>

        {/* Calendar Modal Overlay */}
        {open && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={handleCancel}
          >
            <div
              className="bg-card border border-border rounded-xl shadow-2xl p-5 w-80 select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setViewDate(picker === "days" ? subMonths(viewDate, 1) : setYear(viewDate, viewDate.getFullYear() - 1))}
                  className="p-1.5 rounded-lg hover:bg-sky-500/[0.03] text-muted-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPicker((p) => p === "days" ? "months" : "days")}
                  className="text-sm font-bold text-foreground flex items-center gap-1 hover:text-primary transition-colors"
                >
                  {picker === "days" ? format(viewDate, "MMMM yyyy") : viewDate.getFullYear()}
                  <ChevronUp className={cn("w-3 h-3 transition-transform", picker === "months" && "rotate-180")} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewDate(picker === "days" ? addMonths(viewDate, 1) : setYear(viewDate, viewDate.getFullYear() + 1))}
                  className="p-1.5 rounded-lg hover:bg-sky-500/[0.03] text-muted-foreground transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {picker === "days" && (
                <>
                  {/* Weekday labels */}
                  <div className="grid grid-cols-7 mb-1">
                    {weekDays.map((d) => (
                      <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Days */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {days.map((day) => {
                      const inMonth = isSameMonth(day, viewDate);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const today = isToday(day);
                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          onClick={() => handleSelect(day)}
                          className={cn(
                            "h-9 w-9 mx-auto rounded-lg text-xs font-medium transition-colors",
                            !inMonth && "text-slate-600",
                            inMonth && !isSelected && "text-foreground hover:bg-sky-500/[0.08]",
                            today && !isSelected && "text-primary border border-primary/30",
                            isSelected && "bg-primary text-primary-foreground"
                          )}
                        >
                          {format(day, "d")}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {picker === "months" && (
                <div className="grid grid-cols-3 gap-2">
                  {MONTHS.map((m, idx) => {
                    const isCurrent = viewDate.getMonth() === idx;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleSelectMonth(idx)}
                        className={cn(
                          "py-2 rounded-lg text-sm font-semibold transition-colors",
                          isCurrent ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-sky-500/[0.08]"
                        )}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-2 rounded-lg font-bold text-sm bg-accent text-foreground hover:bg-accent/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!pendingDate}
                  className="flex-1 py-2 rounded-lg font-bold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);
DatePicker.displayName = "DatePicker";
