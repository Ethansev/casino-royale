export interface ChipStyle {
  fill: string;
  stroke: string;
  text: string;
}

/** Casino machine denominations: $1 white, $2 blue, $3 yellow, $5 red,
 *  $10 orange, $25 green, $50 steel blue, $100 black. */
export function chipStyle(denom: number): ChipStyle {
  if (denom >= 100) return { fill: "#18181b", stroke: "#3f3f46", text: "#fff" };
  if (denom >= 50) return { fill: "#1d4ed8", stroke: "#172554", text: "#fff" };
  if (denom >= 25) return { fill: "#16a34a", stroke: "#14532d", text: "#fff" };
  if (denom >= 10) return { fill: "#ea580c", stroke: "#7c2d12", text: "#fff" };
  if (denom >= 5) return { fill: "#dc2626", stroke: "#7f1d1d", text: "#fff" };
  if (denom >= 3) return { fill: "#eab308", stroke: "#854d0e", text: "#1c1917" };
  if (denom >= 2) return { fill: "#2563eb", stroke: "#1e3a8a", text: "#fff" };
  return { fill: "#e5e7eb", stroke: "#9ca3af", text: "#111827" };
}

export function formatMoney(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded)
    ? `$${rounded.toLocaleString()}`
    : `$${rounded.toFixed(2)}`;
}
