import type { BetDefId, Die, VariantConfig } from "@/engine/types";

export type ZoneShape =
  | { kind: "rect"; x: number; y: number; w: number; h: number; rx?: number }
  | { kind: "path"; d: string };

export interface ZoneText {
  text: string;
  x: number;
  y: number;
  size?: number;
  weight?: number;
  opacity?: number;
  color?: string;
}

export interface ZoneDicePair {
  x: number;
  y: number;
  size: number;
  d1: Die;
  d2: Die;
}

export interface ZoneCircle {
  cx: number;
  cy: number;
  r: number;
}

export interface BetZone {
  id: string;
  defId: BetDefId;
  number?: number;
  shape: ZoneShape;
  label: string;
  labelX: number;
  labelY: number;
  fontSize?: number;
  labelColor?: string;
  /** Stable accessibility name (display labels follow the casino layout). */
  aria?: string;
  /** Where chip stacks sit. */
  anchorX: number;
  anchorY: number;
  fill?: string;
  extraText?: readonly ZoneText[];
  dice?: readonly ZoneDicePair[];
  circles?: readonly ZoneCircle[];
  /** Rendered with a dashed outline (odds strips, hop picker). */
  dashed?: boolean;
}

/** Non-interactive board decoration (panel frames, section titles). */
export interface BoardDecor {
  shape: ZoneShape;
  fill?: string;
  stroke?: string;
  texts?: readonly ZoneText[];
}

export const BOARD_W = 1600;
export const BOARD_H = 800;

// Semantic color tokens — resolved against the active theme by renderers.
const BOX_FILL = "box";
const PANEL_FILL = "panel";
const RED = "red";
const BLUE = "blue";

const MAIN_X = 500;
const MAIN_W = 1080;

// Left panel: x 20..470, rows inset to x 28..462.
const L = 28;
const LW = 434;
const LMID = L + LW / 2; // 245

interface NumberBox {
  n: number;
  x: number;
  w: number;
}

export function numberBoxes(config: VariantConfig): NumberBox[] {
  const numbers = config.placeNumbers;
  const step = MAIN_W / numbers.length;
  return numbers.map((n, i) => ({ n, x: MAIN_X + i * step + 2, w: step - 4 }));
}

export function numberBoxTop(config: VariantConfig): number {
  return config.layNumbers.length > 0 ? 82 : 40;
}

export function puckPositionFor(
  config: VariantConfig,
  point: number | null,
): { x: number; y: number } | null {
  if (point === null) return null;
  const box = numberBoxes(config).find((b) => b.n === point);
  if (!box) return null;
  return { x: box.x + box.w / 2, y: numberBoxTop(config) + 26 };
}

function rect(x: number, y: number, w: number, h: number, rx = 8): ZoneShape {
  return { kind: "rect", x, y, w, h, rx };
}

function bigNumeral(n: number): string {
  if (n === 6) return "SIX";
  if (n === 9) return "NINE";
  return `${n}`;
}

const TRAVEL_KEY = /^(COME|DONT_COME|COME_ODDS|DONT_COME_ODDS):(\d+)$/;

const zoneCache = new Map<string, BetZone[]>();

export function zonesForCached(config: VariantConfig): BetZone[] {
  let zones = zoneCache.get(config.variant);
  if (!zones) {
    zones = zonesFor(config);
    zoneCache.set(config.variant, zones);
  }
  return zones;
}

/** Board-space chip position for any bet key, including traveled come bets and hops. */
export function chipPositionForBet(
  config: VariantConfig,
  bet: { key: string; hop?: readonly [number, number] },
  hopIndex = 0,
): { x: number; y: number } | null {
  const zone = zonesForCached(config).find((z) => z.id === bet.key);
  if (zone) return { x: zone.anchorX, y: zone.anchorY };
  const m = TRAVEL_KEY.exec(bet.key);
  if (m) {
    const box = numberBoxes(config).find((b) => b.n === Number(m[2]));
    if (!box) return null;
    const cx = box.x + box.w / 2;
    switch (m[1]) {
      case "COME":
        return { x: cx, y: 172 };
      case "COME_ODDS":
        return { x: cx, y: 208 };
      case "DONT_COME":
        return { x: cx, y: 136 };
      default:
        return { x: cx, y: 110 };
    }
  }
  if (bet.hop || bet.key.startsWith("HOP:"))
    return { x: 285 + (hopIndex % 4) * 44, y: 758 };
  return null;
}

/** The zone (if any) under a board-space point. */
export function zoneAtBoardPoint(
  config: VariantConfig,
  bx: number,
  by: number,
): BetZone | null {
  return (
    zonesForCached(config).find(
      (z) =>
        z.shape.kind === "rect" &&
        bx >= z.shape.x &&
        bx <= z.shape.x + z.shape.w &&
        by >= z.shape.y &&
        by <= z.shape.y + z.shape.h,
    ) ?? null
  );
}

function hardwaysZones(): BetZone[] {
  const cells: ReadonlyArray<{
    n: number;
    pair: Die;
    pays: string;
    x: number;
    w: number;
    y: number;
  }> = [
    { n: 4, pair: 2, pays: "7 TO 1", x: L, w: 211, y: 74 },
    { n: 10, pair: 5, pays: "7 TO 1", x: 249, w: 213, y: 74 },
    { n: 6, pair: 3, pays: "9 TO 1", x: L, w: 211, y: 198 },
    { n: 8, pair: 4, pays: "9 TO 1", x: 249, w: 213, y: 198 },
  ];
  return cells.map(({ n, pair, pays, x, w, y }) => ({
    id: `HARDWAY:${n}`,
    defId: "HARDWAY",
    number: n,
    shape: rect(x, y, w, 120, 10),
    label: "",
    labelX: 0,
    labelY: 0,
    aria: `HARD ${n}`,
    anchorX: x + 152,
    anchorY: y + 50,
    fill: BOX_FILL,
    dice: [{ x: x + 16, y: y + 20, size: 38, d1: pair, d2: pair }],
    extraText: [
      { text: pays, x: x + 152, y: y + 106, size: 18, opacity: 0.9 },
      { text: `HARD ${n}`, x: x + 58, y: y + 106, size: 17, opacity: 0.75 },
    ],
  }));
}

function oneRollZones(): BetZone[] {
  return [
    {
      id: "ANY_SEVEN",
      defId: "ANY_SEVEN",
      shape: rect(L, 354, LW, 70, 10),
      label: "SEVEN",
      labelX: LMID,
      labelY: 400,
      fontSize: 34,
      labelColor: RED,
      aria: "ANY SEVEN",
      anchorX: LMID,
      anchorY: 372,
      fill: BOX_FILL,
      extraText: [
        { text: "4 TO 1", x: 95, y: 398, size: 20 },
        { text: "4 TO 1", x: 395, y: 398, size: 20 },
      ],
    },
    {
      id: "ACES",
      defId: "ACES",
      shape: rect(L, 432, 211, 88, 10),
      label: "",
      labelX: 0,
      labelY: 0,
      aria: "ACES (2)",
      anchorX: 178,
      anchorY: 460,
      fill: BOX_FILL,
      dice: [{ x: 42, y: 450, size: 34, d1: 1, d2: 1 }],
      extraText: [{ text: "30 TO 1", x: 168, y: 506, size: 16, opacity: 0.85 }],
    },
    {
      id: "THREE",
      defId: "THREE",
      shape: rect(249, 432, 213, 88, 10),
      label: "",
      labelX: 0,
      labelY: 0,
      aria: "THREE",
      anchorX: 312,
      anchorY: 460,
      fill: BOX_FILL,
      dice: [{ x: 372, y: 450, size: 34, d1: 1, d2: 2 }],
      extraText: [{ text: "15 TO 1", x: 322, y: 506, size: 16, opacity: 0.85 }],
    },
    {
      id: "TWELVE",
      defId: "TWELVE",
      shape: rect(L, 524, 211, 88, 10),
      label: "",
      labelX: 0,
      labelY: 0,
      aria: "TWELVE",
      anchorX: 178,
      anchorY: 552,
      fill: BOX_FILL,
      dice: [{ x: 42, y: 542, size: 34, d1: 6, d2: 6 }],
      extraText: [{ text: "30 TO 1", x: 168, y: 598, size: 16, opacity: 0.85 }],
    },
    {
      id: "YO",
      defId: "YO",
      shape: rect(249, 524, 213, 88, 10),
      label: "",
      labelX: 0,
      labelY: 0,
      aria: "YO (11)",
      anchorX: 312,
      anchorY: 552,
      fill: BOX_FILL,
      dice: [{ x: 372, y: 542, size: 34, d1: 5, d2: 6 }],
      extraText: [{ text: "15 TO 1", x: 322, y: 598, size: 16, opacity: 0.85 }],
    },
    {
      id: "HORN",
      defId: "HORN",
      shape: rect(145, 496, 200, 52, 26),
      label: "HORN BET",
      labelX: LMID,
      labelY: 529,
      fontSize: 22,
      aria: "HORN",
      anchorX: LMID,
      anchorY: 522,
      fill: BOX_FILL,
    },
    {
      id: "ANY_CRAPS",
      defId: "ANY_CRAPS",
      shape: rect(L, 620, LW, 70, 10),
      label: "ANY CRAPS",
      labelX: LMID,
      labelY: 666,
      fontSize: 30,
      labelColor: RED,
      aria: "ANY CRAPS",
      anchorX: LMID,
      anchorY: 632,
      fill: BOX_FILL,
      extraText: [
        { text: "7 TO 1", x: 90, y: 664, size: 20 },
        { text: "7 TO 1", x: 400, y: 664, size: 20 },
      ],
    },
    {
      id: "CE",
      defId: "CE",
      shape: rect(L, 698, 205, 70, 10),
      label: "C & E",
      labelX: 130,
      labelY: 736,
      fontSize: 26,
      aria: "C & E",
      anchorX: 190,
      anchorY: 730,
      fill: BOX_FILL,
      extraText: [{ text: "7 TO 1 / 15 TO 1", x: 130, y: 758, size: 13, opacity: 0.8 }],
    },
    {
      id: "HOP",
      defId: "HOP",
      shape: rect(243, 698, 219, 70, 10),
      label: "HOP BETS",
      labelX: 352,
      labelY: 740,
      fontSize: 24,
      aria: "HOP BETS",
      anchorX: 352,
      anchorY: 730,
      dashed: true,
    },
  ];
}

function numberStripZones(config: VariantConfig): BetZone[] {
  const zones: BetZone[] = [];
  const hasLay = config.layNumbers.length > 0;
  const boxTop = numberBoxTop(config);
  const compact = config.placeNumbers.length > 6;

  for (const { n, x, w } of numberBoxes(config)) {
    const cx = x + w / 2;
    if (hasLay) {
      zones.push({
        id: `LAY:${n}`,
        defId: "LAY",
        number: n,
        shape: rect(x, 40, w, 38, 5),
        label: "LAY",
        labelX: cx,
        labelY: 65,
        fontSize: 19,
        aria: `LAY ${n}`,
        anchorX: cx + w / 4,
        anchorY: 59,
      });
    }
    // The black number box is split horizontally: BUY on top, PLACE below.
    // The big numeral rides on the PLACE zone (rendered second) so it paints
    // across both halves; it's pointer-events:none, so clicks hit the halves.
    const numeral = bigNumeral(n);
    const boxH = 324 - boxTop;
    const halfH = boxH / 2;
    const numeralY = boxTop + boxH / 2 + (numeral.length > 2 ? 12 : 24);
    const labelSize = compact ? 16 : 19;
    zones.push(
      {
        id: `BUY:${n}`,
        defId: "BUY",
        number: n,
        shape: rect(x, boxTop, w, halfH, 10),
        label: "BUY",
        labelX: cx,
        labelY: boxTop + 30,
        fontSize: labelSize,
        aria: `BUY ${n}`,
        anchorX: cx,
        anchorY: boxTop + halfH / 2 + 10,
        fill: BOX_FILL,
      },
      {
        id: `PLACE:${n}`,
        defId: "PLACE",
        number: n,
        shape: rect(x, boxTop + halfH, w, halfH, 10),
        label: "PLACE",
        labelX: cx,
        labelY: 308,
        fontSize: labelSize,
        aria: `${n}`,
        anchorX: cx,
        anchorY: boxTop + halfH + halfH / 2 - 8,
        fill: BOX_FILL,
        extraText: [
          {
            text: numeral,
            x: cx,
            y: numeralY,
            size: numeral.length > 2 ? (compact ? 30 : 44) : compact ? 60 : 72,
            weight: 800,
          },
        ],
      },
    );
  }
  return zones;
}

export function zonesFor(config: VariantConfig): BetZone[] {
  const dont = config.dontBetsAllowed;
  const zones: BetZone[] = [
    ...hardwaysZones(),
    ...oneRollZones(),
    ...numberStripZones(config),
  ];

  const comeW = dont ? 680 : MAIN_W;
  zones.push({
    id: "COME",
    defId: "COME",
    shape: rect(MAIN_X, 346, comeW, 118, 10),
    label: "COME",
    labelX: MAIN_X + comeW / 2,
    labelY: 422,
    fontSize: 54,
    labelColor: RED,
    aria: "COME",
    anchorX: MAIN_X + comeW / 2 - 130,
    anchorY: 400,
  });

  if (dont) {
    zones.push({
      id: "DONT_COME",
      defId: "DONT_COME",
      shape: rect(1190, 346, 390, 118, 10),
      label: "DON'T COME",
      labelX: 1385,
      labelY: 414,
      fontSize: 32,
      aria: "DON'T COME",
      anchorX: 1385,
      anchorY: 434,
    });
  }

  zones.push({
    id: "FIELD",
    defId: "FIELD",
    shape: rect(MAIN_X, 484, MAIN_W, 122, 10),
    label: "FIELD",
    labelX: 1040,
    labelY: 580,
    fontSize: 44,
    aria: "FIELD",
    anchorX: 1040,
    anchorY: 516,
    circles: [
      { cx: 570, cy: 545, r: 42 },
      { cx: 1510, cy: 545, r: 42 },
    ],
    extraText: [
      { text: "2", x: 570, y: 556, size: 32, weight: 700 },
      { text: "PAYS DOUBLE", x: 570, y: 598, size: 10, opacity: 0.85 },
      { text: "3  ·  4  ·  9  ·  10  ·  11", x: 1040, y: 534, size: 28, weight: 600 },
      { text: "12", x: 1510, y: 556, size: 32, weight: 700 },
      { text: "PAYS TRIPLE", x: 1510, y: 598, size: 10, opacity: 0.85 },
    ],
  });

  if (dont) {
    zones.push({
      id: "DONT_PASS",
      defId: "DONT_PASS",
      shape: rect(MAIN_X, 614, MAIN_W, 44, 6),
      label: "DON'T PASS BAR ⚅⚅",
      labelX: 1040,
      labelY: 643,
      fontSize: 21,
      aria: "DON'T PASS BAR",
      anchorX: 800,
      anchorY: 636,
    });
  }

  const passTop = dont ? 666 : 620;
  const passH = 780 - passTop;
  zones.push(
    {
      id: "PASS_ODDS",
      defId: "PASS_ODDS",
      shape: rect(MAIN_X, passTop, 200, passH, 10),
      label: "TAKE ODDS",
      labelX: MAIN_X + 100,
      labelY: passTop + passH / 2 + 7,
      fontSize: 22,
      aria: "PASS LINE ODDS",
      anchorX: MAIN_X + 100,
      anchorY: passTop + passH / 2 - 28,
      dashed: true,
    },
    {
      id: "PASS",
      defId: "PASS",
      shape: rect(MAIN_X + 208, passTop, MAIN_W - 208, passH, 10),
      label: "PASS LINE",
      labelX: MAIN_X + 208 + (MAIN_W - 208) / 2,
      labelY: passTop + passH / 2 + 18,
      fontSize: 52,
      labelColor: BLUE,
      aria: "PASS LINE",
      anchorX: 880,
      anchorY: passTop + passH / 2,
    },
  );

  return zones;
}

const decorCache = new Map<string, BoardDecor[]>();

export function boardDecorFor(config: VariantConfig): BoardDecor[] {
  let decor = decorCache.get(config.variant);
  if (decor) return decor;
  decor = [
    {
      shape: rect(20, 30, 450, 296, 14),
      fill: PANEL_FILL,
      texts: [{ text: "HARD WAYS", x: LMID, y: 60, size: 19, weight: 700 }],
    },
    {
      shape: rect(20, 334, 450, 444, 14),
      fill: PANEL_FILL,
      texts: [{ text: "ONE ROLL BETS", x: LMID, y: 348, size: 17, weight: 700 }],
    },
  ];
  decorCache.set(config.variant, decor);
  return decor;
}
