"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  size?: "default" | "sm";
  triggerClassName?: string;
  "aria-label"?: string;
};

const triggerBase =
  "inline-flex w-full items-center justify-between gap-2 rounded-lg border border-neutral-700 bg-black text-left text-white outline-none transition hover:border-neutral-600 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-600/40 data-[placeholder]:text-neutral-500";

export function SelectField({
  value,
  onValueChange,
  options,
  placeholder = "Choose…",
  id,
  size = "default",
  triggerClassName,
  "aria-label": ariaLabel,
}: Props) {
  const triggerSize =
    size === "sm"
      ? "h-8 px-2 py-1 text-xs"
      : "h-10 px-3 py-2 text-sm";

  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(triggerBase, triggerSize, triggerClassName)}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-neutral-400" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          className="z-[70] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl"
        >
          <Select.Viewport className="p-1.5">
            {options.map((o) => (
              <Select.Item
                key={o.value}
                value={o.value}
                className="relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-9 pr-3 text-sm text-white outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-neutral-800 data-[state=checked]:bg-neutral-800/60"
              >
                <span className="absolute left-2 flex size-4 items-center justify-center">
                  <Select.ItemIndicator>
                    <Check className="size-4 text-white" strokeWidth={2.5} />
                  </Select.ItemIndicator>
                </span>
                <Select.ItemText>{o.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
