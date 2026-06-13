/** The ChipCircle logo mark — a casino chip drawn in CSS, themed by tokens. */
export function ChipEmblem({ size = 26 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "var(--mr-accent)",
        boxShadow: "0 0 12px var(--mr-glow)",
      }}
    >
      <span
        className="rounded-full"
        style={{
          width: size * 0.72,
          height: size * 0.72,
          border: `${Math.max(2, size * 0.09)}px dashed var(--mr-accent-text)`,
          opacity: 0.85,
        }}
      />
    </span>
  );
}
