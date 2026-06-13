import { decide } from "./decide";
import { applyEvent } from "./reducer";
import { getVariantConfig } from "./variants";
import type {
  Command,
  EngineState,
  GameEvent,
  OddsPolicy,
  Variant,
  VariantConfig,
} from "./types";

export interface EngineOptions {
  variant: Variant;
  seed: number;
  oddsPolicy?: OddsPolicy;
  /** Restore a previously serialized session instead of starting fresh. */
  resumeState?: EngineState;
}

export function initialState(options: EngineOptions): EngineState {
  if (options.resumeState) return options.resumeState;
  return {
    variant: options.variant,
    oddsPolicy: options.oddsPolicy ?? { kind: "THREE_FOUR_FIVE" },
    phase: "COME_OUT",
    point: null,
    players: {},
    seatOrder: [],
    shooterIndex: 0,
    bets: [],
    rngState: options.seed | 0,
    rollHistory: [],
  };
}

export type EngineListener = (
  events: readonly GameEvent[],
  state: EngineState,
) => void;

export class CrapsEngine {
  readonly config: VariantConfig;
  private state: EngineState;
  private listeners = new Set<EngineListener>();

  constructor(options: EngineOptions) {
    this.config = getVariantConfig(options.variant);
    this.state = initialState(options);
  }

  getState(): EngineState {
    return this.state;
  }

  subscribe(listener: EngineListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Validates and executes a command. Throws EngineError on invalid commands. */
  dispatch(command: Command): GameEvent[] {
    const events = decide(this.state, command, this.config);
    let next = this.state;
    for (const event of events) next = applyEvent(next, event);
    this.state = next;
    for (const listener of this.listeners) listener(events, next);
    return events;
  }
}

/** Re-runs a command log from a seed; same inputs always produce the same outputs. */
export function replay(
  options: EngineOptions,
  commands: readonly Command[],
): { state: EngineState; events: GameEvent[] } {
  const engine = new CrapsEngine(options);
  const events: GameEvent[] = [];
  for (const command of commands) events.push(...engine.dispatch(command));
  return { state: engine.getState(), events };
}
