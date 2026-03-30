"use client";

import { CATEGORY_COLOR_PRESETS } from "@/lib/tasks/constants";
import { normalizeHexColor } from "@/lib/tasks/validation";

export const DEFAULT_CATEGORY_HEX = "#71717a";

type Props = {
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
  idPrefix: string;
};

export function CategoryColorFields({
  value,
  onChange,
  disabled,
  idPrefix,
}: Props) {
  const safeForPicker = normalizeHexColor(value) ?? DEFAULT_CATEGORY_HEX;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORY_COLOR_PRESETS.map((h) => (
          <button
            key={h}
            type="button"
            disabled={disabled}
            onClick={() => onChange(h)}
            className="size-8 rounded-lg border border-neutral-700 transition hover:scale-105 disabled:opacity-40"
            style={{ backgroundColor: h }}
            title={h}
            aria-label={`Preset ${h}`}
          />
        ))}
      </div>
      <label className="flex flex-col gap-1 text-sm text-neutral-400">
        <span>Hex</span>
        <input
          type="text"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            const n = normalizeHexColor(value);
            if (n) onChange(n);
            else onChange(DEFAULT_CATEGORY_HEX);
          }}
          placeholder="#RRGGBB"
          spellCheck={false}
          className="h-10 w-full rounded-lg border border-neutral-700 bg-black px-3 font-mono text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-400">
        <span>Picker</span>
        <input
          id={`${idPrefix}-color`}
          type="color"
          disabled={disabled}
          value={safeForPicker}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full max-w-[5.5rem] cursor-pointer rounded-lg border border-neutral-700 bg-neutral-900 disabled:opacity-40"
          aria-label="Color picker"
        />
      </label>
    </div>
  );
}
