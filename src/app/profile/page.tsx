"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChipEmblem } from "@/components/ChipEmblem";
import { CreditsBadge } from "@/components/lobby/CreditsBadge";
import { formatMoney } from "@/lib/chips";
import { useStatsStore } from "@/store/statsStore";

const GLASS =
  "rounded-2xl border border-[var(--mr-border)] bg-[var(--mr-surface)] shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md";

const GAME_LABELS: Record<string, string> = {
  craps: "Craps",
  crapless: "Crapless",
};

function gameLabel(game: string): string {
  return GAME_LABELS[game] ?? game;
}

function timeAgo(ts: number): string {
  const secs = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function netColor(net: number): string {
  return net > 0 ? "var(--mr-up)" : net < 0 ? "var(--mr-down)" : "var(--mr-dim)";
}

function signed(net: number): string {
  return `${net > 0 ? "+" : net < 0 ? "−" : ""}${formatMoney(Math.abs(net))}`;
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className={`flex flex-col gap-1 p-4 ${GLASS}`}>
      <span
        className="text-[11px] font-bold uppercase tracking-[0.2em]"
        style={{ color: "var(--mr-dim)" }}
      >
        {label}
      </span>
      <span
        className="font-marquee text-2xl font-extrabold tabular-nums"
        style={{ color: color ?? "var(--mr-text)" }}
      >
        {value}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const stats = useStatsStore();
  const decided = stats.wins + stats.losses;
  const winRate = decided > 0 ? Math.round((stats.wins / decided) * 100) : 0;
  const streak =
    stats.currentStreak > 0
      ? `${stats.currentStreak} W`
      : stats.currentStreak < 0
        ? `${-stats.currentStreak} L`
        : "—";
  const perGame = Object.entries(stats.perGame);

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

      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-7 px-6 py-8">
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

        <section className={`flex flex-wrap items-center justify-between gap-4 p-6 ${GLASS}`}>
          <div className="flex flex-col gap-1">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.25em]"
              style={{ color: "var(--mr-accent)" }}
            >
              Profile
            </span>
            <input
              value={mounted ? stats.name : ""}
              onChange={(e) => stats.setName(e.target.value)}
              aria-label="Display name"
              spellCheck={false}
              className="w-full max-w-xs rounded-lg border border-transparent bg-transparent font-marquee text-3xl font-extrabold outline-none transition focus:border-[var(--mr-border)] focus:px-2"
            />
          </div>
          <div className={`px-4 py-1 ${GLASS}`}>
            <CreditsBadge className="text-[var(--mr-accent)]" />
          </div>
        </section>

        {!mounted ? null : stats.rounds === 0 ? (
          <section className={`flex flex-col items-center gap-4 p-10 text-center ${GLASS}`}>
            <h2 className="font-marquee text-2xl font-extrabold">No rolls yet.</h2>
            <p style={{ color: "var(--mr-dim)" }}>
              Play a few rounds and your stats — win rate, streaks, biggest wins —
              will show up here.
            </p>
            <Link
              href="/craps"
              className="rounded-xl px-8 py-3 font-extrabold transition hover:brightness-110"
              style={{ background: "var(--mr-accent)", color: "var(--mr-accent-text)" }}
            >
              Play Craps
            </Link>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Net" value={signed(stats.net)} color={netColor(stats.net)} />
              <StatCard label="Rounds" value={String(stats.rounds)} />
              <StatCard label="Win rate" value={`${winRate}%`} />
              <StatCard label="Biggest win" value={formatMoney(stats.biggestWin)} color="var(--mr-up)" />
              <StatCard label="Streak" value={streak} />
            </section>

            {perGame.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="font-marquee text-xl font-bold">By game</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {perGame.map(([game, g]) => (
                    <div key={game} className={`flex items-center justify-between p-4 ${GLASS}`}>
                      <div className="flex flex-col">
                        <span className="font-marquee text-lg font-bold">{gameLabel(game)}</span>
                        <span className="text-xs" style={{ color: "var(--mr-dim)" }}>
                          {g.rounds} rounds · {g.wins}W / {g.losses}L
                        </span>
                      </div>
                      <span className="font-marquee text-xl font-extrabold tabular-nums" style={{ color: netColor(g.net) }}>
                        {signed(g.net)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-marquee text-xl font-bold">Recent activity</h2>
                <button
                  onClick={() => {
                    if (window.confirm("Reset all your stats and history?")) stats.reset();
                  }}
                  className="text-xs font-semibold text-[color:var(--mr-dim)] transition hover:text-[color:var(--mr-down)]"
                >
                  Reset stats
                </button>
              </div>
              <ul className={`flex flex-col divide-y divide-[var(--mr-border)] ${GLASS}`}>
                {stats.ledger.map((e) => (
                  <li key={e.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {e.kind === "topup" ? "Credit top-up" : gameLabel(e.game)}
                      </span>
                      <span className="text-xs" style={{ color: "var(--mr-dim)" }}>
                        {e.kind === "topup" ? "Wallet" : `Wager ${formatMoney(e.wager)}`} ·{" "}
                        {timeAgo(e.ts)}
                      </span>
                    </div>
                    <span className="font-semibold tabular-nums" style={{ color: netColor(e.net) }}>
                      {signed(e.net)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
