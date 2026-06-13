import { BET_DEFINITIONS } from "./bets/definitions";
import { makeKey } from "./bets/keys";
import { maxOddsMultiplier } from "./bets/payouts";
import { resolveBet } from "./bets/resolvers";
import { makeRoll, rollDice } from "./rng";
import {
  EngineError,
  type BetInstance,
  type Command,
  type EngineState,
  type GameEvent,
  type PlayerId,
  type Roll,
  type VariantConfig,
} from "./types";

function findBet(
  state: EngineState,
  playerId: PlayerId,
  key: string,
): BetInstance | undefined {
  return state.bets.find((b) => b.playerId === playerId && b.key === key);
}

function requirePlayer(state: EngineState, playerId: PlayerId) {
  const player = state.players[playerId];
  if (!player) throw new EngineError("NO_PLAYER", `Unknown player ${playerId}`);
  return player;
}

const EPSILON = 1e-9;

function validateOddsCap(
  state: EngineState,
  config: VariantConfig,
  playerId: PlayerId,
  defId: "PASS_ODDS" | "DONT_PASS_ODDS" | "COME_ODDS" | "DONT_COME_ODDS",
  amount: number,
  number: number | undefined,
): void {
  const isCome = defId === "COME_ODDS" || defId === "DONT_COME_ODDS";
  const isDont = defId === "DONT_PASS_ODDS" || defId === "DONT_COME_ODDS";

  let point: number;
  let flatKey: string;
  if (isCome) {
    if (number === undefined)
      throw new EngineError("NEEDS_NUMBER", `${defId} requires a number`);
    point = number;
    flatKey = makeKey(isDont ? "DONT_COME" : "COME", number);
  } else {
    if (state.point === null)
      throw new EngineError("NO_POINT", "Odds require an established point");
    point = state.point;
    flatKey = isDont ? "DONT_PASS" : "PASS";
  }

  const flat = findBet(state, playerId, flatKey);
  if (!flat)
    throw new EngineError(
      "NO_FLAT_BET",
      `${defId} requires a ${flatKey} bet to back`,
    );

  const mult = maxOddsMultiplier(state.oddsPolicy, point);
  const odds = config.trueOdds[point];
  // Don't-side odds are capped by potential WIN (lay to win mult × flat).
  const maxBet = isDont
    ? mult * flat.amount * (odds.num / odds.den)
    : mult * flat.amount;

  const existing = findBet(state, playerId, makeKey(defId, isCome ? number : undefined));
  const total = (existing?.amount ?? 0) + amount;
  if (total > maxBet + EPSILON)
    throw new EngineError(
      "ODDS_CAP",
      `Max odds here is ${maxBet}, attempted total ${total}`,
    );
}

export function decide(
  state: EngineState,
  command: Command,
  config: VariantConfig,
): GameEvent[] {
  switch (command.type) {
    case "JOIN": {
      const { player } = command;
      if (state.players[player.id])
        throw new EngineError("DUPLICATE_PLAYER", `${player.id} already seated`);
      return [
        {
          type: "PLAYER_JOINED",
          player: {
            id: player.id,
            name: player.name,
            isAI: player.isAI,
            bankroll: player.bankroll,
          },
        },
      ];
    }

    case "PLACE_BET": {
      const { playerId, defId, amount, number, hop } = command;
      const player = requirePlayer(state, playerId);
      if (!(amount > 0))
        throw new EngineError("BAD_AMOUNT", "Bet amount must be positive");
      if (amount > player.bankroll + EPSILON)
        throw new EngineError("INSUFFICIENT_FUNDS", "Not enough bankroll");

      const def = BET_DEFINITIONS[defId];
      if (!def.availableIn(config))
        throw new EngineError(
          "NOT_AVAILABLE",
          `${defId} is not offered in ${config.variant}`,
        );
      if (def.placeablePhases !== "ANY" && !def.placeablePhases.includes(state.phase))
        throw new EngineError(
          "WRONG_PHASE",
          `${defId} cannot be placed during ${state.phase}`,
        );
      if (def.needsNumber) {
        if (number === undefined || !def.validNumbers(config).includes(number))
          throw new EngineError("BAD_NUMBER", `Invalid number for ${defId}`);
      }
      if (def.needsHop && !hop)
        throw new EngineError("NEEDS_HOP", "Hop bets need a dice pair");

      if (
        defId === "PASS_ODDS" ||
        defId === "DONT_PASS_ODDS" ||
        defId === "COME_ODDS" ||
        defId === "DONT_COME_ODDS"
      ) {
        validateOddsCap(state, config, playerId, defId, amount, number);
      }

      const key = makeKey(defId, def.needsNumber ? number : undefined, hop);
      return [
        { type: "BET_PLACED", playerId, key, defId, amount, number, hop },
      ];
    }

    case "REMOVE_BET": {
      const { playerId, key } = command;
      requirePlayer(state, playerId);
      const bet = findBet(state, playerId, key);
      if (!bet) throw new EngineError("NO_BET", `No bet ${key}`);
      const def = BET_DEFINITIONS[bet.defId];
      if (!def.removable(bet, state.phase))
        throw new EngineError(
          "CONTRACT_BET",
          `${key} is a contract bet and cannot be taken down`,
        );
      return [{ type: "BET_REMOVED", playerId, key, returned: bet.amount }];
    }

    case "SET_WORKING": {
      const { playerId, key, working } = command;
      requirePlayer(state, playerId);
      const bet = findBet(state, playerId, key);
      if (!bet) throw new EngineError("NO_BET", `No bet ${key}`);
      if (!BET_DEFINITIONS[bet.defId].canToggleWorking)
        throw new EngineError("NOT_TOGGLEABLE", `${key} cannot be called on/off`);
      return [{ type: "BET_WORKING_SET", playerId, key, working }];
    }

    case "ADD_FUNDS": {
      const { playerId, amount } = command;
      requirePlayer(state, playerId);
      if (!(amount > 0))
        throw new EngineError("BAD_AMOUNT", "Amount must be positive");
      return [{ type: "FUNDS_ADDED", playerId, amount }];
    }

    case "ROLL": {
      if (state.seatOrder.length === 0)
        throw new EngineError("NO_SHOOTER", "No players seated");
      const shooterId = state.seatOrder[state.shooterIndex];

      let roll: Roll;
      let rngState: number;
      if (command.forcedRoll) {
        roll = makeRoll(command.forcedRoll[0], command.forcedRoll[1]);
        rngState = state.rngState;
      } else {
        const r = rollDice(state.rngState);
        roll = r.roll;
        rngState = r.next;
      }

      const events: GameEvent[] = [
        {
          type: "DICE_ROLLED",
          shooterId,
          roll,
          rngState,
          phase: state.phase,
          point: state.point,
        },
      ];

      // Numbers rolled since the last 7 (for Bonus Craps), including this roll.
      const rolledSince7 = new Set<number>();
      for (let i = state.rollHistory.length - 1; i >= 0; i--) {
        if (state.rollHistory[i].total === 7) break;
        rolledSince7.add(state.rollHistory[i].total);
      }
      rolledSince7.add(roll.total);

      const ctx = {
        roll,
        phase: state.phase,
        point: state.point,
        config,
        rolledSince7,
      };
      for (const bet of state.bets) {
        const res = resolveBet(bet, ctx);
        switch (res.kind) {
          case "WIN":
            events.push({
              type: "BET_RESOLVED",
              playerId: bet.playerId,
              key: bet.key,
              defId: bet.defId,
              number: bet.number,
              outcome: "WIN",
              staked: bet.amount,
              returned: bet.amount + res.profit,
              profit: res.profit,
            });
            break;
          case "LOSE":
            events.push({
              type: "BET_RESOLVED",
              playerId: bet.playerId,
              key: bet.key,
              defId: bet.defId,
              number: bet.number,
              outcome: "LOSE",
              staked: bet.amount,
              returned: 0,
              profit: -bet.amount,
            });
            break;
          case "PUSH":
            events.push({
              type: "BET_RESOLVED",
              playerId: bet.playerId,
              key: bet.key,
              defId: bet.defId,
              number: bet.number,
              outcome: "PUSH",
              staked: bet.amount,
              returned: bet.amount,
              profit: 0,
            });
            break;
          case "MOVE":
            events.push({
              type: "BET_MOVED",
              playerId: bet.playerId,
              fromKey: bet.key,
              toKey: makeKey(bet.defId, res.toNumber),
              number: res.toNumber,
            });
            break;
          case "NONE":
            break;
        }
      }

      const t = roll.total;
      if (state.phase === "COME_OUT") {
        if (config.pointNumbers.includes(t))
          events.push({ type: "POINT_ESTABLISHED", point: t });
      } else if (t === state.point) {
        events.push({ type: "POINT_MADE", point: t });
      } else if (t === 7) {
        events.push({ type: "SEVEN_OUT", shooterId });
        const next =
          state.seatOrder[(state.shooterIndex + 1) % state.seatOrder.length];
        events.push({ type: "SHOOTER_CHANGED", shooterId: next });
      }

      return events;
    }
  }
}
