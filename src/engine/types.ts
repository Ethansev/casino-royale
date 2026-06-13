export type Variant = "standard" | "crapless";

export type Phase = "COME_OUT" | "POINT_ON";

export type PlayerId = string;

export type Die = 1 | 2 | 3 | 4 | 5 | 6;

export interface Roll {
  d1: Die;
  d2: Die;
  total: number;
  isHard: boolean;
}

/** Profit ratio: a winning bet of `den` units profits `num` units. */
export interface Ratio {
  num: number;
  den: number;
}

export type OddsPolicy =
  | { kind: "THREE_FOUR_FIVE" }
  | { kind: "FLAT"; multiplier: number };

export type BetDefId =
  | "PASS"
  | "DONT_PASS"
  | "COME"
  | "DONT_COME"
  | "PASS_ODDS"
  | "DONT_PASS_ODDS"
  | "COME_ODDS"
  | "DONT_COME_ODDS"
  | "PLACE"
  | "BUY"
  | "LAY"
  | "BIG_6"
  | "BIG_8"
  | "FIELD"
  | "HARDWAY"
  | "ANY_SEVEN"
  | "ANY_CRAPS"
  | "YO"
  | "THREE"
  | "ACES"
  | "TWELVE"
  | "HOP"
  | "HORN"
  | "CE"
  | "ALL_SMALL"
  | "ALL_TALL"
  | "ALL";

export interface BetInstance {
  /** Unique per player, e.g. "PASS", "PLACE:6", "COME:8", "HOP:2-5". */
  key: string;
  defId: BetDefId;
  playerId: PlayerId;
  amount: number;
  /** Box/point number for numbered bets; undefined for a come/don't-come flat still in the box. */
  number?: number;
  hop?: readonly [Die, Die];
  /** Player's explicit on/off call; defaults per bet type when undefined. */
  workingOverride?: boolean;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  isAI: boolean;
  bankroll: number;
}

export interface RollRecord {
  d1: Die;
  d2: Die;
  total: number;
  /** Phase/point at the time the dice were thrown. */
  phase: Phase;
  point: number | null;
}

export interface EngineState {
  variant: Variant;
  oddsPolicy: OddsPolicy;
  phase: Phase;
  point: number | null;
  players: Readonly<Record<PlayerId, PlayerState>>;
  seatOrder: readonly PlayerId[];
  shooterIndex: number;
  bets: readonly BetInstance[];
  rngState: number;
  rollHistory: readonly RollRecord[];
}

export interface VariantConfig {
  variant: Variant;
  pointNumbers: readonly number[];
  passComeOutWin: readonly number[];
  passComeOutLose: readonly number[];
  dontComeOutWin: readonly number[];
  dontComeOutPush: readonly number[];
  dontBetsAllowed: boolean;
  placeNumbers: readonly number[];
  buyNumbers: readonly number[];
  layNumbers: readonly number[];
  /** True odds of the number rolling before a 7, as profit ratio for betting WITH the number. */
  trueOdds: Readonly<Record<number, Ratio>>;
  placePayout: Readonly<Record<number, Ratio>>;
  /** Winning field totals and their profit ratio. */
  fieldPayout: Readonly<Record<number, Ratio>>;
}

export type Command =
  | {
      type: "JOIN";
      player: { id: PlayerId; name: string; isAI: boolean; bankroll: number };
    }
  | {
      type: "PLACE_BET";
      playerId: PlayerId;
      defId: BetDefId;
      amount: number;
      number?: number;
      hop?: readonly [Die, Die];
    }
  | { type: "REMOVE_BET"; playerId: PlayerId; key: string }
  | { type: "SET_WORKING"; playerId: PlayerId; key: string; working: boolean }
  | { type: "ADD_FUNDS"; playerId: PlayerId; amount: number }
  | { type: "ROLL"; forcedRoll?: readonly [Die, Die] };

export type BetOutcome = "WIN" | "LOSE" | "PUSH";

export type GameEvent =
  | { type: "PLAYER_JOINED"; player: PlayerState }
  | {
      type: "BET_PLACED";
      playerId: PlayerId;
      key: string;
      defId: BetDefId;
      amount: number;
      number?: number;
      hop?: readonly [Die, Die];
    }
  | { type: "BET_REMOVED"; playerId: PlayerId; key: string; returned: number }
  | { type: "BET_WORKING_SET"; playerId: PlayerId; key: string; working: boolean }
  | { type: "FUNDS_ADDED"; playerId: PlayerId; amount: number }
  | {
      type: "DICE_ROLLED";
      shooterId: PlayerId;
      roll: Roll;
      rngState: number;
      phase: Phase;
      point: number | null;
    }
  | {
      type: "BET_RESOLVED";
      playerId: PlayerId;
      key: string;
      defId: BetDefId;
      number?: number;
      outcome: BetOutcome;
      staked: number;
      returned: number;
      profit: number;
    }
  | {
      type: "BET_MOVED";
      playerId: PlayerId;
      fromKey: string;
      toKey: string;
      number: number;
    }
  | { type: "POINT_ESTABLISHED"; point: number }
  | { type: "POINT_MADE"; point: number }
  | { type: "SEVEN_OUT"; shooterId: PlayerId }
  | { type: "SHOOTER_CHANGED"; shooterId: PlayerId };

export class EngineError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "EngineError";
    this.code = code;
  }
}
