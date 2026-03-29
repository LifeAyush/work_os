"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { DayPicker } from "react-day-picker";

import { startOfTodayLocal } from "@/lib/tasks/validation";
import { cn } from "@/lib/utils";

import { Popover, PopoverContent, PopoverTrigger } from "./popover";

function parseYMD(s: string): Date | undefined {
  if (!s) return undefined;
  const parts = s.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Props = {
  value: string;
  onChange: (ymd: string) => void;
  id?: string;
  placeholder?: string;
};

export function DateField({
  value,
  onChange,
  id,
  placeholder = "Pick a date",
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = parseYMD(value);
  const todayStart = startOfTodayLocal();
  const defaultMonth =
    selected && selected >= todayStart ? selected : todayStart;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          className={cn(
            "flex h-10 min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-neutral-700 bg-black px-3 py-2 text-left text-sm outline-none transition hover:border-neutral-600 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-600/40",
            !value && "text-neutral-500",
            value && "text-white",
          )}
        >
          <span>
            {selected
              ? selected.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : placeholder}
          </span>
          <CalendarIcon className="size-4 shrink-0 text-neutral-400" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-3">
        <DayPicker
          mode="single"
          selected={selected}
          defaultMonth={defaultMonth}
          captionLayout="dropdown"
          startMonth={todayStart}
          endMonth={new Date(2036, 11)}
          disabled={{ before: todayStart }}
          onSelect={(d) => {
            if (d) {
              onChange(toYMD(d));
              setOpen(false);
            }
          }}
          showOutsideDays
          className="work-os-calendar"
        />
      </PopoverContent>
    </Popover>
  );
}
