import { create } from "zustand";
import { persist } from "zustand/middleware";

const LEDGER_CAP = 50;

export interface LedgerEntry {
  id: number;
  kind: "round" | "topup";
  /** Game variant for rounds, "wallet" for top-ups. */
  game: string;
  wager: number;
  /** Round profit (±) or top-up amount (+). */
  net: number;
  ts: number;
}

export interface PerGameStats {
  rounds: number;
  net: number;
  wins: number;
  losses: number;
}

interface StatsStore {
  name: string;
  net: number;
  rounds: number;
  wins: number;
  losses: number;
  biggestWin: number;
  /** Signed run length: positive = win streak, negative = loss streak. */
  currentStreak: number;
  longestStreak: number;
  perGame: Record<string, PerGameStats>;
  ledger: LedgerEntry[];
  nextId: number;

  setName(name: string): void;
  recordRound(r: {
    game: string;
    wager: number;
    net: number;
    biggestProfit: number;
  }): void;
  recordTopUp(amount: number): void;
  reset(): void;
}

const FRESH = {
  net: 0,
  rounds: 0,
  wins: 0,
  losses: 0,
  biggestWin: 0,
  currentStreak: 0,
  longestStreak: 0,
  perGame: {} as Record<string, PerGameStats>,
  ledger: [] as LedgerEntry[],
  nextId: 1,
};

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
      name: "Player",
      ...FRESH,

      setName: (name) => set({ name: name.slice(0, 24) }),

      recordRound: ({ game, wager, net, biggestProfit }) =>
        set((s) => {
          const won = net > 0;
          const lost = net < 0;
          const currentStreak = won
            ? s.currentStreak > 0
              ? s.currentStreak + 1
              : 1
            : lost
              ? s.currentStreak < 0
                ? s.currentStreak - 1
                : -1
              : s.currentStreak;
          const prev = s.perGame[game] ?? {
            rounds: 0,
            net: 0,
            wins: 0,
            losses: 0,
          };
          const entry: LedgerEntry = {
            id: s.nextId,
            kind: "round",
            game,
            wager,
            net,
            ts: Date.now(),
          };
          return {
            net: s.net + net,
            rounds: s.rounds + 1,
            wins: s.wins + (won ? 1 : 0),
            losses: s.losses + (lost ? 1 : 0),
            biggestWin: Math.max(s.biggestWin, biggestProfit),
            currentStreak,
            longestStreak: Math.max(s.longestStreak, currentStreak),
            perGame: {
              ...s.perGame,
              [game]: {
                rounds: prev.rounds + 1,
                net: prev.net + net,
                wins: prev.wins + (won ? 1 : 0),
                losses: prev.losses + (lost ? 1 : 0),
              },
            },
            ledger: [entry, ...s.ledger].slice(0, LEDGER_CAP),
            nextId: s.nextId + 1,
          };
        }),

      recordTopUp: (amount) =>
        set((s) => {
          const entry: LedgerEntry = {
            id: s.nextId,
            kind: "topup",
            game: "wallet",
            wager: 0,
            net: amount,
            ts: Date.now(),
          };
          return {
            ledger: [entry, ...s.ledger].slice(0, LEDGER_CAP),
            nextId: s.nextId + 1,
          };
        }),

      reset: () => set({ ...FRESH }),
    }),
    { name: "chipcircle-stats-v1" },
  ),
);
