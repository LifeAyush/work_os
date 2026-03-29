import type { PrimaryTag } from "./constants";

/** Accent line + pill: breathe=blue, freelance=green, general=purple */
export const tagAccent = {
  breathe: {
    line: "bg-[#3b82f6]",
    pill: "bg-[#3b82f6]/20 text-[#93c5fd] border border-[#3b82f6]/40",
    label: "breathe",
  },
  freelance: {
    line: "bg-[#22c55e]",
    pill: "bg-[#22c55e]/20 text-[#86efac] border border-[#22c55e]/40",
    label: "freelance",
  },
  general: {
    line: "bg-[#a855f7]",
    pill: "bg-[#c084fc]/20 text-[#e9d5ff] border border-[#a855f7]/40",
    label: "general",
  },
} as const satisfies Record<
  PrimaryTag,
  { line: string; pill: string; label: string }
>;

export function isPrimaryTag(v: string): v is PrimaryTag {
  return v === "breathe" || v === "freelance" || v === "general";
}
