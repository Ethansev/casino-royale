"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChipEmblem } from "@/components/ChipEmblem";
import { BRAND, Wordmark } from "@/components/Brand";
import { CreditsBadge } from "./CreditsBadge";
import { CATEGORY_LABELS, GAMES, type GameCategory } from "./games";

const GLASS =
  "rounded-2xl border border-[var(--mr-border)] bg-[var(--mr-surface)] shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md";

const FOOTER_COLUMNS: ReadonlyArray<{
  heading: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}> = [
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "How to Play", href: "/rules" },
    ],
  },
];

const FOOTER_LINK =
  "text-sm text-[color:var(--mr-dim)] transition hover:text-[color:var(--mr-accent)]";

function LiveDot() {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full motion-safe:[animation:live-dot_1.6s_ease-in-out_infinite]"
      style={{ background: "var(--mr-up)" }}
    />
  );
}

function GameCard({ game }: { game: (typeof GAMES)[number] }) {
  const body = (
    <div
      className={`group flex h-full flex-col overflow-hidden transition ${GLASS} ${
        game.live
          ? "motion-safe:hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_24px_var(--mr-glow)]"
          : ""
      }`}
    >
      <div className="relative overflow-hidden">
        <Image
          src={game.img}
          alt={game.title}
          width={1024}
          height={1024}
          className={`aspect-[4/3] w-full object-cover transition duration-300 ${
            game.live ? "group-hover:scale-105" : "opacity-50 saturate-50"
          }`}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 to-transparent" />
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            game.live
              ? "ring-1 ring-[var(--mr-border)] bg-[var(--mr-surface)] backdrop-blur"
              : "bg-black/60 ring-1 ring-white/10"
          }`}
          style={{ color: game.live ? "var(--mr-up)" : "var(--mr-dim)" }}
        >
          {game.live && <LiveDot />}
          {game.live ? "LIVE" : "COMING SOON"}
        </span>
        <h3 className="absolute bottom-2.5 left-3.5 font-marquee text-xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
          {game.title}
        </h3>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="flex-1 text-sm" style={{ color: "var(--mr-dim)" }}>
          {game.desc}
        </p>
        {game.live ? (
          <span
            className="mt-2 rounded-xl py-2 text-center font-bold transition group-hover:brightness-110"
            style={{ background: "var(--mr-accent)", color: "var(--mr-accent-text)" }}
          >
            Play now
          </span>
        ) : (
          <span
            className="mt-2 rounded-xl border border-white/10 py-2 text-center text-sm font-semibold"
            style={{ color: "var(--mr-dim)" }}
          >
            On the way
          </span>
        )}
      </div>
    </div>
  );
  return game.live && game.href ? (
    <Link href={game.href} aria-label={`Open ${game.title}`} className="h-full">
      {body}
    </Link>
  ) : (
    <div className="h-full">{body}</div>
  );
}

export function GlassLobby() {
  const [filter, setFilter] = useState<GameCategory | "all">("all");
  const visible = GAMES.filter((g) => filter === "all" || g.category === filter);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-40 top-[-10%] h-[34rem] w-[34rem] rounded-full opacity-15 blur-[140px]" style={{ background: "var(--mr-accent2)" }} />
      <div className="pointer-events-none absolute -right-40 top-[30%] h-[30rem] w-[30rem] rounded-full opacity-15 blur-[140px]" style={{ background: "var(--mr-accent)" }} />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-7 px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2.5 font-marquee text-2xl font-extrabold tracking-tight">
            <ChipEmblem size={30} />
            <Wordmark />
          </h1>
          <div className={`px-4 py-1 ${GLASS}`}>
            <CreditsBadge className="text-[var(--mr-accent)]" />
          </div>
        </header>

        <section className={`relative overflow-hidden ${GLASS}`}>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] md:block">
            <Image
              src="/marketing/hero-table.png"
              alt=""
              fill
              sizes="(min-width: 768px) 46vw, 0vw"
              className="object-cover [mask-image:linear-gradient(to_right,transparent,black_45%)]"
              priority
            />
            <div
              className="absolute inset-0 opacity-40 [mask-image:linear-gradient(to_right,transparent,black_45%)]"
              style={{ background: "var(--mr-accent2)", mixBlendMode: "color" }}
            />
          </div>
          <div className="relative flex flex-col items-start gap-4 p-7 sm:p-9 md:max-w-[58%]">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-[var(--mr-border)]"
              style={{ color: "var(--mr-up)", background: "var(--mr-surface)" }}
            >
              <LiveDot />2 tables open now
            </span>
            <h2 className="font-marquee text-4xl font-extrabold leading-tight sm:text-5xl">
              Pull up a seat.
            </h2>
            <p className="max-w-xl" style={{ color: "var(--mr-dim)" }}>
              Physics dice, every real bet on the felt, and odds you can
              actually see. Free social play — your credits work across every
              game.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/craps"
                aria-label="Play Craps"
                className="rounded-xl px-8 py-3 font-extrabold transition hover:brightness-110 active:scale-[0.98]"
                style={{ background: "var(--mr-accent)", color: "var(--mr-accent-text)" }}
              >
                Play Craps
              </Link>
              <Link
                href="/craps?variant=crapless"
                aria-label="Play Crapless Craps"
                className="rounded-xl border px-8 py-3 font-extrabold transition hover:bg-white/5 active:scale-[0.98]"
                style={{ borderColor: "var(--mr-accent)", color: "var(--mr-accent)" }}
              >
                Play Crapless
              </Link>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-0.5 overflow-x-auto rounded-full bg-black/30 p-0.5 ring-1 ring-white/8"
              role="radiogroup"
              aria-label="Game filter"
            >
              {CATEGORY_LABELS.map((cat) => (
                <button
                  key={cat.id}
                  role="radio"
                  aria-checked={filter === cat.id}
                  onClick={() => setFilter(cat.id)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    filter === cat.id ? "" : "hover:bg-white/10"
                  }`}
                  style={
                    filter === cat.id
                      ? { background: "var(--mr-accent)", color: "var(--mr-accent-text)" }
                      : { color: "var(--mr-dim)" }
                  }
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <span
              className="ml-auto hidden shrink-0 text-xs sm:block"
              style={{ color: "var(--mr-dim)" }}
            >
              {visible.length} game{visible.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>

        <footer className="mt-2 border-t border-[var(--mr-border)] pt-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
              <h2 className="flex items-center gap-2 font-marquee text-lg font-extrabold">
                <ChipEmblem size={24} />
                <Wordmark />
              </h2>
              <p
                className="max-w-xs text-xs leading-relaxed"
                style={{ color: "var(--mr-dim)" }}
              >
                Physics dice, every real bet on the felt, and odds you can
                actually see — free social play.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <h3
                className="text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ color: "var(--mr-dim)" }}
              >
                Games
              </h3>
              {GAMES.map((game) => (
                <Link
                  key={game.id}
                  href={game.href ?? `/${game.id}`}
                  className={FOOTER_LINK}
                >
                  {game.title}
                </Link>
              ))}
            </div>

            {FOOTER_COLUMNS.map((col) => (
              <div key={col.heading} className="flex flex-col gap-2.5">
                <h3
                  className="text-[11px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: "var(--mr-dim)" }}
                >
                  {col.heading}
                </h3>
                {col.links.map((link) => (
                  <Link key={link.href} href={link.href} className={FOOTER_LINK}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          <div
            className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/5 pt-5 text-xs sm:flex-row"
            style={{ color: "var(--mr-dim)" }}
          >
            <span>
              {BRAND} is a free social casino — no real-money play, just
              bragging rights.
            </span>
            <span>© {new Date().getFullYear()} {BRAND}</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
