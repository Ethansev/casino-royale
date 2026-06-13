"use client";

import { useUiStore, type ViewMode } from "@/store/uiStore";

const MODES: ReadonlyArray<[ViewMode, string]> = [
  ["2d", "2D"],
  ["3d", "3D"],
];

function preload3d() {
  void import("../table3d/Table3D");
}

export function ViewToggle() {
  const viewMode = useUiStore((s) => s.viewMode);
  const setViewMode = useUiStore((s) => s.setViewMode);

  return (
    <div
      className="flex items-center rounded-full bg-black/30 p-0.5 ring-1 ring-white/10"
      role="radiogroup"
      aria-label="Table view"
    >
      {MODES.map(([mode, label]) => (
        <button
          key={mode}
          role="radio"
          aria-checked={viewMode === mode}
          onClick={() => setViewMode(mode)}
          onMouseDown={(e) => e.preventDefault()}
          onMouseEnter={mode === "3d" ? preload3d : undefined}
          onFocus={mode === "3d" ? preload3d : undefined}
          className="rounded-full px-3.5 py-1 text-sm font-bold transition"
          style={
            viewMode === mode
              ? { background: "var(--mr-accent)", color: "var(--mr-accent-text)" }
              : { color: "var(--mr-dim)" }
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
