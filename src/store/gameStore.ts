import { create } from "zustand";
import type {
  BetDefId,
  BetInstance,
  BetOutcome,
  EngineState,
  PlayerId,
  Roll,
} from "@/engine/types";

export const YOU: PlayerId = "you";

export interface BetResolution {
  key: string;
  defId: BetDefId;
  number?: number;
  outcome: BetOutcome;
  staked: number;
  profit: number;
}

export interface GameStore {
  snapshot: EngineState | null;
  rolling: boolean;
  lastRoll: Roll | null;
  /** The in-flight roll's result while the dice animation plays. */
  pendingRoll: Roll | null;
  /** Increments per roll so views can detect a new throw. */
  rollSeq: number;
  /** My bet resolutions from the last revealed roll, for win FX. */
  lastResolutions: readonly BetResolution[];
  /** Sum of winning profits from the last revealed roll. */
  winTotal: number;
  /** Increments at each reveal so FX layers can re-trigger. */
  fxSeq: number;
  banner: string;
  error: string | null;
}

export const useGameStore = create<GameStore>(() => ({
  snapshot: null,
  rolling: false,
  lastRoll: null,
  pendingRoll: null,
  rollSeq: 0,
  lastResolutions: [],
  winTotal: 0,
  fxSeq: 0,
  banner: "Place your bets!",
  error: null,
}));

export function useMyBankroll(): number {
  return useGameStore((s) => s.snapshot?.players[YOU]?.bankroll ?? 0);
}

export function useMyBet(key: string): BetInstance | undefined {
  return useGameStore((s) =>
    s.snapshot?.bets.find((b) => b.playerId === YOU && b.key === key),
  );
}

export function useMyTotalOnFelt(): number {
  return useGameStore(
    (s) =>
      s.snapshot?.bets.reduce(
        (sum, b) => (b.playerId === YOU ? sum + b.amount : sum),
        0,
      ) ?? 0,
  );
}
