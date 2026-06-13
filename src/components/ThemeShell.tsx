"use client";

import { cssVarsFor } from "@/lib/themes";
import { useTheme } from "@/store/uiStore";

/** Applies the active theme's CSS variables app-wide. */
export function ThemeShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <div
      data-theme={theme.id}
      style={{ ...cssVarsFor(theme), background: "var(--mr-bg)", color: "var(--mr-text)" }}
      className="relative z-[1] min-h-screen font-sans"
    >
      {children}
    </div>
  );
}
