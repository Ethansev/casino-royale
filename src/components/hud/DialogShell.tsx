"use client";

import { useEffect } from "react";

/** Shared dialog chrome: blurred overlay, floating L2 panel, pop-in, Escape close. */
export function DialogShell({
  label,
  onClose,
  fixed = false,
  maxWidth = "max-w-md",
  children,
}: {
  label: string;
  onClose: () => void;
  /** Use fixed positioning (full-viewport dialogs like the odds chart). */
  fixed?: boolean;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={`${fixed ? "fixed" : "absolute"} inset-0 z-30 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px] motion-safe:[animation:overlay-in_150ms_linear]`}
      onClick={onClose}
    >
      <div
        className={`panel-l2 max-h-[85vh] w-full overflow-y-auto p-6 motion-safe:[animation:dialog-pop_220ms_var(--ease-emph)] ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={label}
      >
        {children}
      </div>
    </div>
  );
}
