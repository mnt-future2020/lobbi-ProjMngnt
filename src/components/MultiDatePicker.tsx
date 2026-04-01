"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiDatePickerProps {
  selectedDates: string[]; // ["2026-04-20", "2026-04-21"]
  onChange: (dates: string[]) => void;
  className?: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function MultiDatePicker({
  selectedDates,
  onChange,
  className,
}: MultiDatePickerProps) {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleDate = (dateStr: string) => {
    if (selectedDates.includes(dateStr)) {
      onChange(selectedDates.filter((d) => d !== dateStr));
    } else {
      onChange([...selectedDates, dateStr].sort());
    }
  };

  const removeDate = (dateStr: string) => {
    onChange(selectedDates.filter((d) => d !== dateStr));
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const todayStr = formatYMD(now.getFullYear(), now.getMonth(), now.getDate());

  // Format selected dates for display
  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm",
          "hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors",
          "bg-white min-w-[140px]",
          selectedDates.length > 0 ? "text-gray-900" : "text-gray-400"
        )}
      >
        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
        {selectedDates.length === 0 ? (
          <span>Select dates</span>
        ) : selectedDates.length === 1 ? (
          <span>{formatDisplayDate(selectedDates[0])}</span>
        ) : (
          <span>{selectedDates.length} dates</span>
        )}
      </button>

      {/* Selected date pills (shown below the button) */}
      {selectedDates.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selectedDates.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-medium"
            >
              {formatDisplayDate(d)}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeDate(d);
                }}
                className="hover:text-brand-dark"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl border border-gray-200 shadow-lg p-3 w-[280px]">
          {/* Month/Year nav */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-semibold text-gray-400 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells for days before the 1st */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatYMD(viewYear, viewMonth, day);
              const isSelected = selectedDates.includes(dateStr);
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDate(dateStr)}
                  className={cn(
                    "w-8 h-8 mx-auto rounded-lg text-sm font-medium transition-colors",
                    isSelected
                      ? "bg-brand text-white hover:bg-brand-dark"
                      : isToday
                        ? "bg-brand/10 text-brand hover:bg-brand/20"
                        : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          {selectedDates.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {selectedDates.length} date{selectedDates.length > 1 ? "s" : ""} selected
              </span>
              <button
                type="button"
                onClick={() => {
                  onChange([]);
                  setOpen(false);
                }}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
