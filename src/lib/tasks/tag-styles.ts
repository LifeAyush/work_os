import type { CSSProperties } from "react";

import { hexColorOrDefault, normalizeHexColor } from "./validation";

export type CategoryAccent = {
  label: string;
  lineStyle: CSSProperties;
  pillStyle: CSSProperties;
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = normalizeHexColor(hex);
  const s = (n ?? "#71717a").slice(1);
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  };
}

/** WCAG relative luminance (sRGB). */
function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const lin = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  const r = lin(rgb.r);
  const g = lin(rgb.g);
  const b = lin(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Inline styles from a category color (validated hex). Safe for user-provided values
 * after normalizeHexColor / hexColorOrDefault.
 */
export function accentFromHex(rawHex: string, displayLabel: string): CategoryAccent {
  const safe = hexColorOrDefault(rawHex);
  const rgb = hexToRgb(safe);
  const lum = relativeLuminance(rgb);
  const textColor = lum > 0.55 ? "#171717" : "#f4f4f5";
  return {
    label: displayLabel,
    lineStyle: { backgroundColor: safe },
    pillStyle: {
      backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22)`,
      borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.55)`,
      borderWidth: 1,
      borderStyle: "solid",
      color: textColor,
    },
  };
}
