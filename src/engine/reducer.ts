import type { BetInstance, EngineState, GameEvent } from "./types";

const HISTORY_CAP = 200;

function adjustBankroll(
  state: EngineState,
  playerId: string,
  delta: number,
): EngineState["players"] {
  const player = state.players[playerId];
  return {
    ...state.players,
    [playerId]: { ...player, bankroll: player.bankroll + delta },
  };
}

export function applyEvent(state: EngineState, event: GameEvent): EngineState {
  switch (event.type) {
    case "PLAYER_JOINED":
      return {
        ...state,
        players: { ...state.players, [event.player.id]: event.player },
        seatOrder: [...state.seatOrder, event.player.id],
      };

    case "BET_PLACED": {
      const players = adjustBankroll(state, event.playerId, -event.amount);
      const idx = state.bets.findIndex(
        (b) => b.playerId === event.playerId && b.key === event.key,
      );
      if (idx >= 0) {
        const existing = state.bets[idx];
        const bets = [...state.bets];
        bets[idx] = { ...existing, amount: existing.amount + event.amount };
        return { ...state, players, bets };
      }
      const bet: BetInstance = {
        key: event.key,
        defId: event.defId,
        playerId: event.playerId,
        amount: event.amount,
        number: event.number,
        hop: event.hop,
      };
      return { ...state, players, bets: [...state.bets, bet] };
    }

    case "BET_REMOVED":
      return {
        ...state,
        players: adjustBankroll(state, event.playerId, event.returned),
        bets: state.bets.filter(
          (b) => !(b.playerId === event.playerId && b.key === event.key),
        ),
      };

    case "FUNDS_ADDED":
      return {
        ...state,
        players: adjustBankroll(state, event.playerId, event.amount),
      };

    case "BET_WORKING_SET":
      return {
        ...state,
        bets: state.bets.map((b) =>
          b.playerId === event.playerId && b.key === event.key
            ? { ...b, workingOverride: event.working }
            : b,
        ),
      };

    case "DICE_ROLLED": {
      const record = {
        d1: event.roll.d1,
        d2: event.roll.d2,
        total: event.roll.total,
        phase: event.phase,
        point: event.point,
      };
      const rollHistory =
        state.rollHistory.length >= HISTORY_CAP
          ? [...state.rollHistory.slice(1), record]
          : [...state.rollHistory, record];
      return { ...state, rngState: event.rngState, rollHistory };
    }

    case "BET_RESOLVED":
      return {
        ...state,
        players: adjustBankroll(state, event.playerId, event.returned),
        bets: state.bets.filter(
          (b) => !(b.playerId === event.playerId && b.key === event.key),
        ),
      };

    case "BET_MOVED": {
      const moving = state.bets.find(
        (b) => b.playerId === event.playerId && b.key === event.fromKey,
      );
      if (!moving) return state;
      const existing = state.bets.find(
        (b) => b.playerId === event.playerId && b.key === event.toKey,
      );
      const remaining = state.bets.filter(
        (b) =>
          !(
            b.playerId === event.playerId &&
            (b.key === event.fromKey || b.key === event.toKey)
          ),
      );
      const merged: BetInstance = existing
        ? { ...existing, amount: existing.amount + moving.amount }
        : { ...moving, key: event.toKey, number: event.number };
      return { ...state, bets: [...remaining, merged] };
    }

    case "POINT_ESTABLISHED":
      return { ...state, phase: "POINT_ON", point: event.point };

    case "POINT_MADE":
      return { ...state, phase: "COME_OUT", point: null };

    case "SEVEN_OUT":
      return { ...state, phase: "COME_OUT", point: null };

    case "SHOOTER_CHANGED":
      return { ...state, shooterIndex: state.seatOrder.indexOf(event.shooterId) };
  }
}
