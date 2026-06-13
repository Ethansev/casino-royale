"use client";

import { useEffect, useRef, useState } from "react";
import { THEME_LIST } from "@/lib/themes";
import { addCredits } from "@/store/engineBridge";
import { useUiStore } from "@/store/uiStore";
import {
  BubbleIcon,
  GearIcon,
  HelpIcon,
  MicIcon,
  PlusIcon,
  VolumeIcon,
  VolumeOffIcon,
} from "./icons";

function ToggleRow({
  icon,
  label,
  on,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-white/8"
    >
      <span style={{ color: on ? "var(--mr-accent)" : "var(--mr-dim)" }}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      <span
        className="relative h-5 w-9 rounded-full transition-colors"
        style={{ background: on ? "var(--mr-accent)" : "rgba(255,255,255,0.15)" }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
          style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }}
        />
      </span>
    </button>
  );
}

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const muted = useUiStore((s) => s.muted);
  const dealerVoice = useUiStore((s) => s.dealerVoice);
  const showTooltips = useUiStore((s) => s.showTooltips);
  const helpMode = useUiStore((s) => s.helpMode);
  const themeId = useUiStore((s) => s.theme);
  const { toggleMuted, toggleDealerVoice, toggleTooltips, toggleHelpMode, setTheme } =
    useUiStore.getState();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseDown={(e) => e.preventDefault()}
        aria-expanded={open}
        aria-label="Settings"
        title="Settings"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 ring-1 ring-white/10 transition hover:bg-white/15 active:scale-95"
      >
        <GearIcon />
      </button>

      {open && (
        <div
          className="panel-l2 absolute right-0 top-11 z-50 w-64 p-2 motion-safe:[animation:dialog-pop_220ms_var(--ease-emph)]"
          role="menu"
        >
          <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--mr-dim)" }}>
            Table settings
          </p>
          <ToggleRow
            icon={muted ? <VolumeOffIcon /> : <VolumeIcon />}
            label="Sounds"
            on={!muted}
            onToggle={toggleMuted}
          />
          <ToggleRow
            icon={<MicIcon />}
            label="Dealer voice"
            on={dealerVoice}
            onToggle={toggleDealerVoice}
          />
          <ToggleRow
            icon={<BubbleIcon />}
            label="Hover hints"
            on={showTooltips}
            onToggle={toggleTooltips}
          />
          <ToggleRow
            icon={<HelpIcon />}
            label="Help mode"
            on={helpMode}
            onToggle={toggleHelpMode}
          />

          <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--mr-dim)" }}>
            Theme
          </p>
          <div className="flex items-center gap-2 px-3 pb-2" role="radiogroup" aria-label="App theme">
            {THEME_LIST.map((theme) => (
              <button
                key={theme.id}
                role="radio"
                aria-checked={theme.id === themeId}
                title={theme.name}
                onClick={() => setTheme(theme.id)}
                className="h-6 w-6 rounded-full ring-offset-2 transition hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${theme.css.accent} 50%, ${theme.css.bg} 50%)`,
                  boxShadow:
                    theme.id === themeId
                      ? `0 0 0 2px var(--mr-text)`
                      : `0 0 0 1px rgba(255,255,255,0.2)`,
                }}
              />
            ))}
          </div>

          <div className="mt-1 border-t border-white/10 pt-2">
            <button
              onClick={() => addCredits(1000)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-white/8"
              style={{ color: "var(--mr-accent)" }}
            >
              <PlusIcon />
              Add $1,000 <span className="text-[10px] font-normal" style={{ color: "var(--mr-dim)" }}>(testing)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
