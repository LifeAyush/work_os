"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

type Props = {
  open: boolean;
  signingOut: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function SignOutDialog({
  open,
  signingOut,
  onClose,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !signingOut) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, signingOut, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <div
        className="absolute inset-0"
        aria-hidden
        onClick={() => !signingOut && onClose()}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sign-out-title"
        aria-describedby="sign-out-desc"
        className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2
            id="sign-out-title"
            className="text-lg font-semibold text-white"
          >
            Sign out?
          </h2>
          <button
            type="button"
            onClick={() => !signingOut && onClose()}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <p id="sign-out-desc" className="text-sm text-neutral-400">
          You will need to sign in again to access Work OS.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => !signingOut && onClose()}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={signingOut}
            onClick={onConfirm}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
