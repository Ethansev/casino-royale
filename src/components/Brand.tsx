export const BRAND = "Casino Royale";

const PRIMARY = "Casino ";
const ACCENT = "Royale";

/** Two-tone brand wordmark (accent-colored second half), wrapped in a single
 *  inline span so flex `gap` containers don't split it. No hooks — usable in
 *  both server and client components. */
export function Wordmark() {
  return (
    <span>
      {PRIMARY}
      <span style={{ color: "var(--mr-accent)" }}>{ACCENT}</span>
    </span>
  );
}
