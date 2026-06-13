export type ThemeId = "pop" | "neon" | "walnut" | "holo" | "toon";

export interface ThemeCss {
  bg: string;
  surface: string;
  border: string;
  text: string;
  dim: string;
  accent: string;
  accentText: string;
  accent2: string;
  glow: string;
}

export interface ThemeBoard {
  feltTop: string;
  feltMid: string;
  feltBottom: string;
  box: string;
  line: string;
  red: string;
  blue: string;
  text: string;
  panel: string;
}

export interface ThemeScene {
  rail: {
    color: string;
    roughness: number;
    metalness: number;
    emissive?: string;
    emissiveIntensity?: number;
  };
  body: string;
  floor: string;
  ambient: number;
  spot: { color: string; intensity: number };
  points: ReadonlyArray<{
    position: readonly [number, number, number];
    color: string;
    intensity: number;
  }>;
  dice: { body: string; pip: string; pipEmissive?: string };
  chipRing: string;
  neonTrim?: string;
  bloom?: boolean;
  scanlines?: boolean;
  toon?: boolean;
}

export interface Theme {
  id: ThemeId;
  name: string;
  css: ThemeCss;
  board: ThemeBoard;
  scene: ThemeScene;
}

export const THEMES: Readonly<Record<ThemeId, Theme>> = {
  pop: {
    id: "pop",
    name: "Circle Pop",
    css: {
      bg: "#141a2e",
      surface: "rgba(30, 40, 68, 0.55)",
      border: "rgba(255, 194, 51, 0.25)",
      text: "#fdf9ef",
      dim: "#97a3c6",
      accent: "#ffc233",
      accentText: "#2b1d02",
      accent2: "#ff5e9b",
      glow: "rgba(255, 194, 51, 0.4)",
    },
    board: {
      feltTop: "#1fae9b",
      feltMid: "#15897a",
      feltBottom: "#0d6356",
      box: "#4f4c74",
      line: "rgba(255, 252, 240, 0.95)",
      red: "#ff5e7a",
      blue: "#5fd2ff",
      text: "#fffdf5",
      panel: "rgba(20, 15, 50, 0.35)",
    },
    scene: {
      rail: { color: "#3b2d7a", roughness: 0.6, metalness: 0.1 },
      body: "#2a2058",
      floor: "#171234",
      ambient: 0.9,
      spot: { color: "#fff4dd", intensity: 260 },
      points: [
        { position: [-6, 4, -4], color: "#ff5e9b", intensity: 50 },
        { position: [6, 4, 4], color: "#5fd2ff", intensity: 50 },
      ],
      dice: { body: "#ffffff", pip: "#2b2161" },
      chipRing: "#ffc233",
    },
  },
  neon: {
    id: "neon",
    name: "Neon Noir",
    css: {
      bg: "#060609",
      surface: "rgba(18, 20, 30, 0.65)",
      border: "rgba(103, 232, 249, 0.25)",
      text: "#e6fbff",
      dim: "#7e93a3",
      accent: "#22d3ee",
      accentText: "#04141a",
      accent2: "#e879f9",
      glow: "rgba(34, 211, 238, 0.45)",
    },
    board: {
      feltTop: "#101720",
      feltMid: "#0b1118",
      feltBottom: "#06090e",
      box: "#1b2230",
      line: "rgba(103, 232, 249, 0.85)",
      red: "#ff2d78",
      blue: "#22d3ee",
      text: "#dffaff",
      panel: "rgba(6, 14, 22, 0.6)",
    },
    scene: {
      rail: { color: "#0b0b14", roughness: 0.35, metalness: 0.6 },
      body: "#08080f",
      floor: "#050507",
      ambient: 0.55,
      spot: { color: "#9be8ff", intensity: 220 },
      points: [
        { position: [-6, 4, -4], color: "#e879f9", intensity: 70 },
        { position: [6, 4, 4], color: "#22d3ee", intensity: 70 },
      ],
      dice: { body: "#16181f", pip: "#67e8f9", pipEmissive: "#22d3ee" },
      chipRing: "#22d3ee",
      neonTrim: "#22d3ee",
      bloom: true,
    },
  },
  walnut: {
    id: "walnut",
    name: "Walnut & Brass",
    css: {
      bg: "#160f09",
      surface: "rgba(52, 34, 20, 0.55)",
      border: "rgba(217, 164, 65, 0.3)",
      text: "#f4e9d4",
      dim: "#a8916e",
      accent: "#d9a441",
      accentText: "#241303",
      accent2: "#8c2f24",
      glow: "rgba(217, 164, 65, 0.4)",
    },
    board: {
      feltTop: "#7a1d1d",
      feltMid: "#621414",
      feltBottom: "#3f0c0c",
      box: "#3c2c1f",
      line: "rgba(238, 218, 170, 0.9)",
      red: "#ffb86b",
      blue: "#e9c46a",
      text: "#f7eeda",
      panel: "rgba(34, 18, 10, 0.55)",
    },
    scene: {
      rail: { color: "#5a3a22", roughness: 0.55, metalness: 0.15 },
      body: "#2d1a10",
      floor: "#120b07",
      ambient: 0.7,
      spot: { color: "#ffd9a0", intensity: 280 },
      points: [
        { position: [-6, 4, -4], color: "#ffbf69", intensity: 60 },
        { position: [6, 4, 4], color: "#ffd9a0", intensity: 40 },
      ],
      dice: { body: "#f5ead2", pip: "#3a2417" },
      chipRing: "#d9a441",
    },
  },
  holo: {
    id: "holo",
    name: "Holo Table",
    css: {
      bg: "#020610",
      surface: "rgba(12, 36, 64, 0.45)",
      border: "rgba(56, 232, 255, 0.3)",
      text: "#dbf6ff",
      dim: "#6f93ad",
      accent: "#38e8ff",
      accentText: "#02141c",
      accent2: "#8b5cf6",
      glow: "rgba(56, 232, 255, 0.5)",
    },
    board: {
      feltTop: "#0a2a48",
      feltMid: "#061a2e",
      feltBottom: "#030d18",
      box: "#163048",
      line: "rgba(56, 232, 255, 0.85)",
      red: "#ff5ad1",
      blue: "#7dd3fc",
      text: "#e4f8ff",
      panel: "rgba(10, 40, 70, 0.4)",
    },
    scene: {
      rail: {
        color: "#0a2236",
        roughness: 0.2,
        metalness: 0.8,
        emissive: "#0a4a66",
        emissiveIntensity: 0.35,
      },
      body: "#051422",
      floor: "#02040a",
      ambient: 0.6,
      spot: { color: "#bdf3ff", intensity: 220 },
      points: [
        { position: [-6, 4, -4], color: "#8b5cf6", intensity: 70 },
        { position: [6, 4, 4], color: "#38e8ff", intensity: 70 },
      ],
      dice: { body: "#9be8ff", pip: "#ffffff", pipEmissive: "#38e8ff" },
      chipRing: "#38e8ff",
      bloom: true,
      scanlines: true,
    },
  },
  toon: {
    id: "toon",
    name: "Stylized Toon",
    css: {
      bg: "#15233b",
      surface: "rgba(36, 60, 99, 0.6)",
      border: "rgba(255, 183, 3, 0.35)",
      text: "#f8f9fa",
      dim: "#9fb3cd",
      accent: "#ffb703",
      accentText: "#231b02",
      accent2: "#ef476f",
      glow: "rgba(255, 183, 3, 0.4)",
    },
    board: {
      feltTop: "#2a9d8f",
      feltMid: "#23857a",
      feltBottom: "#1a6258",
      box: "#34466a",
      line: "rgba(255, 255, 255, 0.95)",
      red: "#ef476f",
      blue: "#4cc9f0",
      text: "#ffffff",
      panel: "rgba(20, 33, 61, 0.5)",
    },
    scene: {
      rail: { color: "#e76f51", roughness: 0.9, metalness: 0 },
      body: "#264653",
      floor: "#0f1a2e",
      ambient: 1.0,
      spot: { color: "#ffffff", intensity: 240 },
      points: [
        { position: [-6, 4, -4], color: "#ffffff", intensity: 30 },
        { position: [6, 4, 4], color: "#ffffff", intensity: 30 },
      ],
      dice: { body: "#ffffff", pip: "#14213d" },
      chipRing: "#ffb703",
      toon: true,
    },
  },
};

export const THEME_LIST: readonly Theme[] = [
  THEMES.pop,
  THEMES.neon,
  THEMES.walnut,
  THEMES.holo,
  THEMES.toon,
];

/** Resolves a betZones semantic color token against a theme's board palette. */
export function boardColor(
  theme: Theme,
  token: string | undefined,
): string | undefined {
  switch (token) {
    case "box":
      return theme.board.box;
    case "panel":
      return theme.board.panel;
    case "red":
      return theme.board.red;
    case "blue":
      return theme.board.blue;
    default:
      return token;
  }
}

export function cssVarsFor(theme: Theme): Record<string, string> {
  return {
    "--mr-bg": theme.css.bg,
    "--mr-surface": theme.css.surface,
    "--mr-border": theme.css.border,
    "--mr-text": theme.css.text,
    "--mr-dim": theme.css.dim,
    "--mr-accent": theme.css.accent,
    "--mr-accent-text": theme.css.accentText,
    "--mr-accent2": theme.css.accent2,
    "--mr-glow": theme.css.glow,
    "--felt": `radial-gradient(130% 150% at 50% -10%, ${theme.board.feltTop} 0%, ${theme.board.feltMid} 48%, ${theme.board.feltBottom} 100%)`,
  };
}
