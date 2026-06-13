import { sounds, speak } from "@/audio/audioManager";
import { announceEvents } from "@/dealer/announcer";
import { BET_DEFINITIONS } from "@/engine/bets/definitions";
import { makeKey } from "@/engine/bets/keys";
import { CrapsEngine } from "@/engine/engine";
import {
  EngineError,
  type BetDefId,
  type Die,
  type EngineState,
  type GameEvent,
  type OddsPolicy,
  type Variant,
} from "@/engine/types";
import { useGameStore, YOU } from "./gameStore";
import { useStatsStore } from "./statsStore";

const BANKROLL_KEY = "craps-bankroll";
const DEFAULT_BANKROLL = 1000;

let engine: CrapsEngine | null = null;

interface PlacedBet {
  defId: BetDefId;
  amount: number;
  number?: number;
  hop?: readonly [Die, Die];
}

/** Bets placed since the last roll (the current betting window). */
let placedThisWindow: PlacedBet[] = [];
/** The previous window's bets, for REPEAT LAST BET. */
let lastWindowBets: PlacedBet[] = [];

function savedBankroll(): number {
  const raw =
    typeof window === "undefined" ? null : window.localStorage.getItem(BANKROLL_KEY);
  const value = raw === null ? NaN : Number(raw);
  return Number.isFinite(value) && value >= 1 ? value : DEFAULT_BANKROLL;
}

const sessionKey = (variant: Variant) => `craps-session-v1-${variant}`;

function isEngineState(value: unknown): value is EngineState {
  if (typeof value !== "object" || value === null) return false;
  const v: Record<string, unknown> = Object.create(null);
  Object.assign(v, value);
  return (
    typeof v.variant === "string" &&
    typeof v.phase === "string" &&
    typeof v.rngState === "number" &&
    Array.isArray(v.bets) &&
    Array.isArray(v.seatOrder) &&
    typeof v.players === "object" &&
    v.players !== null
  );
}

/** A previously saved session for this variant, with the bankroll reconciled
 *  to the shared wallet (lobby top-ups while away are honored). */
function savedSession(variant: Variant): EngineState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(sessionKey(variant));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isEngineState(parsed)) return null;
    if (parsed.variant !== variant || !parsed.players[YOU]) return null;
    const you = parsed.players[YOU];
    return {
      ...parsed,
      players: {
        ...parsed.players,
        [YOU]: { ...you, bankroll: savedBankroll() },
      },
    };
  } catch {
    return null;
  }
}

function persistSession() {
  if (!engine || typeof window === "undefined") return;
  const state = engine.getState();
  window.localStorage.setItem(sessionKey(state.variant), JSON.stringify(state));
}

function persistBankroll() {
  if (!engine || typeof window === "undefined") return;
  const player = engine.getState().players[YOU];
  if (player) window.localStorage.setItem(BANKROLL_KEY, String(player.bankroll));
}

function sync() {
  if (!engine) return;
  useGameStore.setState({ snapshot: engine.getState(), error: null });
  persistBankroll();
  persistSession();
}

function reportError(e: unknown) {
  const message = e instanceof EngineError ? e.message : "Something went wrong";
  useGameStore.setState({ error: message });
}

export function startSession(variant: Variant, oddsPolicy: OddsPolicy): void {
  placedThisWindow = [];
  lastWindowBets = [];
  // Returning players find the table exactly as they left it.
  const resumeState = savedSession(variant);
  engine = new CrapsEngine({
    variant,
    oddsPolicy,
    seed: Date.now() & 0x7fffffff,
    resumeState: resumeState ?? undefined,
  });
  if (!resumeState) {
    engine.dispatch({
      type: "JOIN",
      player: { id: YOU, name: "You", isAI: false, bankroll: savedBankroll() },
    });
  }
  useGameStore.setState({
    rolling: false,
    lastRoll: null,
    pendingRoll: null,
    lastResolutions: [],
    winTotal: 0,
    fxSeq: 0,
    banner:
      variant === "crapless"
        ? "Welcome to crapless craps — you can't crap out here!"
        : "New shooter coming out — place your bets!",
  });
  sync();
}

export function endSession(): void {
  persistBankroll();
  engine = null;
  useGameStore.setState({
    snapshot: null,
    lastRoll: null,
    rolling: false,
    error: null,
    pendingRoll: null,
    lastResolutions: [],
    winTotal: 0,
    fxSeq: 0,
  });
}

export function getEngineConfig() {
  return engine?.config ?? null;
}

function tryPlace(bet: PlacedBet, quiet: boolean): boolean {
  if (!engine) return false;
  try {
    engine.dispatch({ type: "PLACE_BET", playerId: YOU, ...bet });
    placedThisWindow.push(bet);
    if (!quiet) {
      sounds.chip();
      sync();
    }
    return true;
  } catch (e) {
    if (!quiet) reportError(e);
    return false;
  }
}

export function placeBet(
  defId: BetDefId,
  amount: number,
  number?: number,
  hop?: readonly [Die, Die],
): void {
  if (!engine) return;
  // Short stack? Put whatever credits remain on the bet instead of refusing.
  const available = engine.getState().players[YOU]?.bankroll ?? 0;
  if (available <= 0) {
    useGameStore.setState({
      error: "Out of credits — click CREDITS to top up",
    });
    return;
  }
  tryPlace({ defId, amount: Math.min(amount, available), number, hop }, false);
}

/** Testing cheat: top up the bankroll (engine-authoritative). */
export function addCredits(amount = 1000): void {
  if (!engine) return;
  try {
    engine.dispatch({ type: "ADD_FUNDS", playerId: YOU, amount });
    useStatsStore.getState().recordTopUp(amount);
    sounds.chipCascade();
    sync();
  } catch (e) {
    reportError(e);
  }
}

/** Take down everything placed since the last roll (contract bets stay). */
export function clearLastBets(): void {
  if (!engine || useGameStore.getState().rolling) return;
  const keys = new Set(
    placedThisWindow.map((b) =>
      makeKey(b.defId, BET_DEFINITIONS[b.defId].needsNumber ? b.number : undefined, b.hop),
    ),
  );
  for (const key of keys) {
    try {
      engine.dispatch({ type: "REMOVE_BET", playerId: YOU, key });
    } catch {
      // contract bets can't come down — leave them
    }
  }
  placedThisWindow = [];
  sounds.chip();
  sync();
}

/** Take down every bet of mine that can come down (contract bets stay). */
export function clearAllBets(): void {
  if (!engine || useGameStore.getState().rolling) return;
  const mine = engine.getState().bets.filter((b) => b.playerId === YOU);
  let removed = false;
  for (const bet of mine) {
    try {
      engine.dispatch({ type: "REMOVE_BET", playerId: YOU, key: bet.key });
      removed = true;
    } catch {
      // contract bets can't come down — leave them
    }
  }
  placedThisWindow = [];
  if (removed) sounds.chip();
  sync();
}

/** Press every one of my bets by its current amount. */
export function doubleBets(): void {
  if (!engine || useGameStore.getState().rolling) return;
  // Traveled come bets are contracts and can't be pressed by re-placing.
  const mine = engine
    .getState()
    .bets.filter(
      (b) =>
        b.playerId === YOU &&
        !((b.defId === "COME" || b.defId === "DONT_COME") && b.number !== undefined),
    );
  let placed = false;
  for (const bet of mine) {
    placed =
      tryPlace(
        { defId: bet.defId, amount: bet.amount, number: bet.number, hop: bet.hop },
        true,
      ) || placed;
  }
  if (placed) {
    sounds.chipCascade();
    sync();
  }
}

/** Move a bet to another zone (drag & drop). Returns true on success. */
export function moveBet(
  key: string,
  targetDefId: BetDefId,
  targetNumber?: number,
): boolean {
  if (!engine || useGameStore.getState().rolling) return false;
  const bet = engine
    .getState()
    .bets.find((b) => b.playerId === YOU && b.key === key);
  if (!bet) return false;
  try {
    engine.dispatch({ type: "REMOVE_BET", playerId: YOU, key });
  } catch (e) {
    reportError(e);
    return false;
  }
  try {
    engine.dispatch({
      type: "PLACE_BET",
      playerId: YOU,
      defId: targetDefId,
      amount: bet.amount,
      number: targetNumber,
    });
    placedThisWindow.push({
      defId: targetDefId,
      amount: bet.amount,
      number: targetNumber,
    });
    sounds.chip();
    sync();
    return true;
  } catch (e) {
    // Roll the removal back so the chips never vanish.
    try {
      engine.dispatch({
        type: "PLACE_BET",
        playerId: YOU,
        defId: bet.defId,
        amount: bet.amount,
        number: bet.number,
        hop: bet.hop,
      });
    } catch {
      // bankroll was credited by the removal; nothing lost
    }
    reportError(e);
    sync();
    return false;
  }
}

/** Reset the felt to the previous betting window's exact configuration. */
export function repeatLastBets(): void {
  if (!engine || useGameStore.getState().rolling) return;
  // Take down everything removable first so repeat doesn't stack.
  const mine = engine.getState().bets.filter((b) => b.playerId === YOU);
  for (const bet of mine) {
    try {
      engine.dispatch({ type: "REMOVE_BET", playerId: YOU, key: bet.key });
    } catch {
      // contract bets stay
    }
  }
  placedThisWindow = [];
  let placed = false;
  for (const bet of lastWindowBets) placed = tryPlace(bet, true) || placed;
  if (placed) sounds.chipCascade();
  sync();
}

export function removeBet(key: string): void {
  if (!engine) return;
  try {
    engine.dispatch({ type: "REMOVE_BET", playerId: YOU, key });
    sounds.chip();
    sync();
  } catch (e) {
    reportError(e);
  }
}

export function setWorking(key: string, working: boolean): void {
  if (!engine) return;
  try {
    engine.dispatch({ type: "SET_WORKING", playerId: YOU, key, working });
    sync();
  } catch (e) {
    reportError(e);
  }
}

/** Dice animations call notifyDiceSettled() when they land; this is the failsafe. */
const REVEAL_FALLBACK_MS = 7000;

let pendingReveal: (() => void) | null = null;
let revealTimer: ReturnType<typeof setTimeout> | null = null;

export function roll(): void {
  if (!engine || useGameStore.getState().rolling) return;
  try {
    const events = engine.dispatch({ type: "ROLL" });
    const snapshot = engine.getState();
    const rolled = events.find((e) => e.type === "DICE_ROLLED");
    const rollResult =
      rolled && rolled.type === "DICE_ROLLED" ? rolled.roll : null;
    const banner = announceEvents(events).join(" ") || "No roll.";
    if (placedThisWindow.length > 0) {
      lastWindowBets = placedThisWindow;
      placedThisWindow = [];
    }
    sounds.diceRattle();
    useGameStore.setState((s) => ({
      rolling: true,
      banner: "Dice are out!",
      error: null,
      pendingRoll: rollResult,
      rollSeq: s.rollSeq + 1,
    }));

    const resolutions = events.flatMap((e) =>
      e.type === "BET_RESOLVED" && e.playerId === YOU
        ? [
            {
              key: e.key,
              defId: e.defId,
              number: e.number,
              outcome: e.outcome,
              staked: e.staked,
              profit: e.profit,
            },
          ]
        : [],
    );
    const winTotal = resolutions.reduce(
      (sum, r) => (r.profit > 0 ? sum + r.profit : sum),
      0,
    );

    pendingReveal = () => {
      pendingReveal = null;
      if (revealTimer !== null) {
        clearTimeout(revealTimer);
        revealTimer = null;
      }
      useGameStore.setState((s) => ({
        rolling: false,
        snapshot,
        lastRoll: rollResult,
        pendingRoll: null,
        banner,
        lastResolutions: resolutions,
        winTotal,
        fxSeq: s.fxSeq + 1,
      }));
      persistBankroll();
      if (resolutions.length > 0) {
        useStatsStore.getState().recordRound({
          game: snapshot.variant,
          wager: resolutions.reduce((sum, r) => sum + r.staked, 0),
          net: resolutions.reduce((sum, r) => sum + r.profit, 0),
          biggestProfit: resolutions.reduce(
            (max, r) => Math.max(max, r.profit),
            0,
          ),
        });
      }
      sounds.diceLand();
      playOutcomeSounds(events);
      speak(banner);
      // Like a real table, winning multi-roll bets stay up: the pass line
      // rides into the next come-out, and place/buy/lay/hardways keep working.
      // One-roll props and come bets come down.
      for (const r of resolutions) {
        if (r.outcome !== "WIN") continue;
        if (
          r.defId === "PASS" ||
          r.defId === "PLACE" ||
          r.defId === "BUY" ||
          r.defId === "LAY" ||
          r.defId === "HARDWAY"
        ) {
          tryPlace({ defId: r.defId, amount: r.staked, number: r.number }, true);
        }
      }
      sync();
    };
    revealTimer = setTimeout(() => pendingReveal?.(), REVEAL_FALLBACK_MS);
  } catch (e) {
    useGameStore.setState({ rolling: false });
    reportError(e);
  }
}

/** Called by the 3D view when the dice animation settles (or is abandoned). */
export function notifyDiceSettled(): void {
  pendingReveal?.();
}

function playOutcomeSounds(events: readonly GameEvent[]): void {
  let myProfit = 0;
  let sevenOut = false;
  let pointMade = false;
  for (const e of events) {
    if (e.type === "BET_RESOLVED" && e.playerId === YOU) myProfit += e.profit;
    if (e.type === "SEVEN_OUT") sevenOut = true;
    if (e.type === "POINT_MADE") pointMade = true;
  }
  if (sevenOut) sounds.sevenOut();
  else if (pointMade) sounds.pointMade();
  if (myProfit > 0) {
    sounds.chipCascade();
    sounds.celebrate();
  } else if (myProfit < 0 && !sevenOut) {
    sounds.lose();
  }
}
