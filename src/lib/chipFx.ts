import { chipStyle } from "./chips";

/** Spawn a DOM chip sprite that flies from a screen point to the CREDITS meter. */
export function flyChipSprite(
  startX: number,
  startY: number,
  amount: number,
  delay = 0,
): void {
  const bank = document.querySelector('[data-testid="bankroll"]');
  if (!bank) return;
  const t = bank.getBoundingClientRect();
  const targetX = t.left + t.width / 2;
  const targetY = t.top + t.height / 2;
  const style = chipStyle(amount);
  const el = document.createElement("div");
  el.style.cssText = `position:fixed;left:0;top:0;width:30px;height:30px;border-radius:9999px;z-index:60;pointer-events:none;background:${style.fill};border:3px dashed ${style.stroke};box-shadow:0 2px 8px rgba(0,0,0,.6)`;
  document.body.appendChild(el);
  const anim = el.animate(
    [
      { transform: `translate(${startX - 15}px, ${startY - 15}px) scale(1)`, opacity: 1 },
      { transform: `translate(${targetX - 15}px, ${targetY - 15}px) scale(0.55)`, opacity: 0.9 },
    ],
    {
      duration: 700,
      delay,
      easing: "cubic-bezier(0.45, -0.15, 0.65, 1)",
      fill: "backwards",
    },
  );
  anim.onfinish = () => el.remove();
  setTimeout(() => el.remove(), 2500 + delay);
}
