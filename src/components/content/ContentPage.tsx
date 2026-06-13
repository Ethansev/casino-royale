import Link from "next/link";
import { ChipEmblem } from "@/components/ChipEmblem";

const GLASS =
  "rounded-2xl border border-[var(--mr-border)] bg-[var(--mr-surface)] shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md";

/** Shared shell for static content pages — brand header, themed prose column. */
export function ContentPage({
  title,
  eyebrow,
  updated,
  children,
}: {
  title: string;
  eyebrow?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute -left-40 top-[-10%] h-[34rem] w-[34rem] rounded-full opacity-15 blur-[140px]"
        style={{ background: "var(--mr-accent2)" }}
      />
      <div
        className="pointer-events-none absolute -right-40 top-[30%] h-[30rem] w-[30rem] rounded-full opacity-15 blur-[140px]"
        style={{ background: "var(--mr-accent)" }}
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-7 px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-marquee text-2xl font-extrabold tracking-tight transition hover:opacity-90"
          >
            <ChipEmblem size={30} />
            Chip<span style={{ color: "var(--mr-accent)" }}>Circle</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-[color:var(--mr-dim)] transition hover:text-[color:var(--mr-accent)]"
          >
            ← Back to lobby
          </Link>
        </header>

        <article className={`flex flex-col gap-5 p-7 sm:p-9 ${GLASS}`}>
          <div className="flex flex-col gap-2">
            {eyebrow && (
              <span
                className="text-xs font-bold uppercase tracking-[0.25em]"
                style={{ color: "var(--mr-accent)" }}
              >
                {eyebrow}
              </span>
            )}
            <h1 className="font-marquee text-4xl font-extrabold leading-tight">
              {title}
            </h1>
            {updated && (
              <p className="text-xs" style={{ color: "var(--mr-dim)" }}>
                Last updated {updated}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4 leading-relaxed [&_a]:text-[color:var(--mr-accent)] [&_a:hover]:underline [&_h2]:mt-3 [&_h2]:font-marquee [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-[color:var(--mr-text)] [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
            {children}
          </div>
        </article>

        <footer
          className="pb-2 text-center text-xs"
          style={{ color: "var(--mr-dim)" }}
        >
          ChipCircle is a free social casino — no real-money play, just bragging
          rights.
        </footer>
      </div>
    </main>
  );
}
