import { create } from "zustand";
import { persist } from "zustand/middleware";
import { THEMES, type Theme, type ThemeId } from "@/lib/themes";

export type ViewMode = "2d" | "3d";

export const CHIP_DENOMS: readonly number[] = [1, 2, 3, 5, 10, 25, 50, 100];

interface UiStore {
  viewMode: ViewMode;
  chipDenom: number;
  helpMode: boolean;
  muted: boolean;
  volume: number;
  dealerVoice: boolean;
  /** Hover tooltips on bet zones (off by default — they cover the board). */
  showTooltips: boolean;
  theme: ThemeId;
  setTheme(theme: ThemeId): void;
  setViewMode(viewMode: ViewMode): void;
  setChipDenom(chipDenom: number): void;
  toggleHelpMode(): void;
  toggleMuted(): void;
  toggleDealerVoice(): void;
  toggleTooltips(): void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      viewMode: "3d",
      chipDenom: 5,
      helpMode: false,
      muted: false,
      volume: 0.7,
      dealerVoice: false,
      showTooltips: false,
      theme: "pop",
      setTheme: (theme) => set({ theme }),
      setViewMode: (viewMode) => set({ viewMode }),
      setChipDenom: (chipDenom) => set({ chipDenom }),
      toggleHelpMode: () => set((s) => ({ helpMode: !s.helpMode })),
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
      toggleDealerVoice: () => set((s) => ({ dealerVoice: !s.dealerVoice })),
      toggleTooltips: () => set((s) => ({ showTooltips: !s.showTooltips })),
    }),
    // v3: ChipCircle rebrand — Circle Pop becomes the default theme
    { name: "craps-ui-v3" },
  ),
);

export function useTheme(): Theme {
  return THEMES[useUiStore((s) => s.theme)];
}
