import { describe, expect, it } from "vitest";
import { CrapsEngine, replay, type EngineOptions } from "./engine";
import type { Die, GameEvent } from "./types";

const OPTS: EngineOptions = { variant: "standard", seed: 42 };

function setup(opts: EngineOptions = OPTS, bankroll = 1000) {
  const engine = new CrapsEngine(opts);
  engine.dispatch({
    type: "JOIN",
    player: { id: "p1", name: "Player", isAI: false, bankroll },
  });
  return engine;
}

function roll(engine: CrapsEngine, d1: Die, d2: Die): GameEvent[] {
  return engine.dispatch({ type: "ROLL", forcedRoll: [d1, d2] });
}

function bankroll(engine: CrapsEngine, id = "p1"): number {
  return engine.getState().players[id].bankroll;
}

describe("pass line", () => {
  it("wins even money on a come-out 7", () => {
    const engine = setup();
    engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "PASS", amount: 10 });
    expect(bankroll(engine)).toBe(990);
    roll(engine, 3, 4);
    expect(bankroll(engine)).toBe(1010);
    expect(engine.getState().bets).toHaveLength(0);
  });

  it("loses on come-out craps", () => {
    const engine = setup();
    engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "PASS", amount: 10 });
    roll(engine, 1, 1);
    expect(bankroll(engine)).toBe(990);
  });

  it("establishes a point, then wins when the point repeats", () => {
    const engine = setup();
    engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "PASS", amount: 10 });
    roll(engine, 2, 2);
    expect(engine.getState().phase).toBe("POINT_ON");
    expect(engine.getState().point).toBe(4);
    roll(engine, 1, 3);
    expect(bankroll(engine)).toBe(1010);
    expect(engine.getState().phase).toBe("COME_OUT");
  });

  it("loses on seven-out and the shooter rotates", () => {
    const engine = setup();
    engine.dispatch({
      type: "JOIN",
      player: { id: "p2", name: "Other", isAI: true, bankroll: 500 },
    });
    engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "PASS", amount: 10 });
    roll(engine, 2, 2);
    const events = roll(engine, 3, 4);
    expect(bankroll(engine)).toBe(990);
    expect(events.some((e) => e.type === "SEVEN_OUT")).toBe(true);
    expect(engine.getState().shooterIndex).toBe(1);
  });

  it("is a contract bet once the point is on", () => {
    const engine = setup();
    engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "PASS", amount: 10 });
    roll(engine, 2, 2);
    expect(() =>
      engine.dispatch({ type: "REMOVE_BET", playerId: "p1", key: "PASS" }),
    ).toThrow(/contract/i);
  });
});

describe("don't pass", () => {
  it("pushes on come-out 12", () => {
    const engine = setup();
    engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "DONT_PASS", amount: 10 });
    const events = roll(engine, 6, 6);
    const resolved = events.find((e) => e.type === "BET_RESOLVED");
    expect(resolved && resolved.outcome).toBe("PUSH");
    expect(bankroll(engine)).toBe(1000);
  });

  it("wins on seven-out", () => {
    const engine = setup();
    engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "DONT_PASS", amount: 10 });
    roll(engine, 2, 2);
    roll(engine, 3, 4);
    expect(bankroll(engine)).toBe(1010);
  });
});

describe("free odds", () => {
  it("pass odds on the 6 pay 6:5", () => {
    const engine = setup();
    engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "PASS", amount: 10 });
    roll(engine, 2, 4);
    engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "PASS_ODDS", amount: 50 });
    roll(engine, 3, 3);
    // 10 flat wins 10; 50 odds win 60.
    expect(bankroll(engine)).toBe(1070);
  });

  it("enforces 3-4-5x caps (3x on the 4)", () => {
    const engine = setup();
    engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "PASS", amount: 10 });
    roll(engine, 2, 2);
    expect(() =>
      engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "PASS_ODDS", amount: 31 }),
    ).toThrow(/max odds/i);
    engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "PASS_ODDS", amount: 30 });
  });

  it("rejects odds without a flat bet", () => {
    const engine = setup();
    engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "PASS", amount: 10 });
    roll(engine, 2, 2);
    expect(() =>
      engine.dispatch({
        type: "PLACE_BET",
        playerId: "p1",
        defId: "COME_ODDS",
        amount: 10,
        number: 4,
      }),
    ).toThrow(/requires/i);
  });
});

describe("come bets", () => {
  it("travels to the rolled number, then wins when it repeats", () => {
    const engine = setup();
    roll(engine, 2, 2);
    engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "COME", amount: 10 });
    roll(engine, 3, 3);
    const traveled = engine.getState().bets.find((b) => b.key === "COME:6");
    expect(traveled).toBeDefined();
    roll(engine, 2, 4);
    expect(bankroll(engine)).toBe(1010);
  });

  it("come odds are off on the come-out and returned when the flat loses", () => {
    const engine = setup();
    roll(engine, 2, 2);
    engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "COME", amount: 10 });
    roll(engine, 3, 3);
    engine.dispatch({
      type: "PLACE_BET",
      playerId: "p1",
      defId: "COME_ODDS",
      amount: 25,
      number: 6,
    });
    roll(engine, 1, 3); // point made (4): back to come-out
    expect(engine.getState().phase).toBe("COME_OUT");
    roll(engine, 3, 4); // come-out 7: come flat loses, odds returned
    expect(bankroll(engine)).toBe(1000 - 10 - 25 + 25);
    expect(engine.getState().bets).toHaveLength(0);
  });
});

describe("working rules", () => {
  it("place bets are off during the come-out and survive a come-out 7", () => {
    const engine = setup();
    engine.dispatch({
      type: "PLACE_BET",
      playerId: "p1",
      defId: "PLACE",
      amount: 12,
      number: 6,
    });
    roll(engine, 3, 4);
    expect(engine.getState().bets).toHaveLength(1);
    expect(bankroll(engine)).toBe(988);
  });

  it("a place bet called on during the come-out is live", () => {
    const engine = setup();
    engine.dispatch({
      type: "PLACE_BET",
      playerId: "p1",
      defId: "PLACE",
      amount: 12,
      number: 6,
    });
    engine.dispatch({ type: "SET_WORKING", playerId: "p1", key: "PLACE:6", working: true });
    roll(engine, 3, 4);
    expect(engine.getState().bets).toHaveLength(0);
    expect(bankroll(engine)).toBe(988);
  });
});

describe("resume", () => {
  it("a serialized session restores bets, phase, and point exactly", () => {
    const engine = setup();
    engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "PASS", amount: 10 });
    roll(engine, 2, 2);
    engine.dispatch({
      type: "PLACE_BET",
      playerId: "p1",
      defId: "PLACE",
      amount: 12,
      number: 6,
    });
    const saved: unknown = JSON.parse(JSON.stringify(engine.getState()));
    if (typeof saved !== "object" || saved === null) throw new Error("bad save");

    const resumed = new CrapsEngine({
      variant: "standard",
      seed: 1,
      resumeState: engine.getState(),
    });
    expect(resumed.getState()).toEqual(engine.getState());
    expect(resumed.getState().point).toBe(4);
    expect(resumed.getState().bets).toHaveLength(2);
    // Play continues from the restored state: 4 makes the point, pass pays.
    roll(resumed, 1, 3);
    expect(resumed.getState().players.p1.bankroll).toBe(998);
  });
});

describe("add funds", () => {
  it("credits the bankroll", () => {
    const engine = setup();
    engine.dispatch({ type: "ADD_FUNDS", playerId: "p1", amount: 1000 });
    expect(bankroll(engine)).toBe(2000);
  });

  it("rejects non-positive amounts and unknown players", () => {
    const engine = setup();
    expect(() =>
      engine.dispatch({ type: "ADD_FUNDS", playerId: "p1", amount: 0 }),
    ).toThrow(/positive/i);
    expect(() =>
      engine.dispatch({ type: "ADD_FUNDS", playerId: "ghost", amount: 5 }),
    ).toThrow(/unknown/i);
  });
});

describe("determinism", () => {
  it("same seed and commands produce identical states and events", () => {
    const commands = [
      {
        type: "JOIN" as const,
        player: { id: "p1", name: "P", isAI: false, bankroll: 5000 },
      },
      { type: "PLACE_BET" as const, playerId: "p1", defId: "FIELD" as const, amount: 5 },
      ...Array.from({ length: 50 }, () => ({ type: "ROLL" as const })),
    ];
    const a = replay(OPTS, commands);
    const b = replay(OPTS, commands);
    expect(a.state).toEqual(b.state);
    expect(a.events).toEqual(b.events);
  });

  it("rolls are valid dice and advance the rng state", () => {
    const engine = setup();
    const before = engine.getState().rngState;
    const events = engine.dispatch({ type: "ROLL" });
    const diced = events.find((e) => e.type === "DICE_ROLLED");
    if (!diced || diced.type !== "DICE_ROLLED") throw new Error("no roll event");
    expect(diced.roll.d1).toBeGreaterThanOrEqual(1);
    expect(diced.roll.d1).toBeLessThanOrEqual(6);
    expect(engine.getState().rngState).not.toBe(before);
  });
});

describe("crapless rules", () => {
  it("11 establishes a point instead of winning", () => {
    const engine = setup({ variant: "crapless", seed: 7 });
    engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "PASS", amount: 10 });
    roll(engine, 5, 6);
    expect(engine.getState().phase).toBe("POINT_ON");
    expect(engine.getState().point).toBe(11);
    expect(bankroll(engine)).toBe(990);
  });

  it("2 cannot lose the come-out — it becomes a point", () => {
    const engine = setup({ variant: "crapless", seed: 7 });
    engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "PASS", amount: 10 });
    roll(engine, 1, 1);
    expect(engine.getState().point).toBe(2);
    roll(engine, 1, 1);
    expect(bankroll(engine)).toBe(1010);
  });

  it("does not offer don't pass", () => {
    const engine = setup({ variant: "crapless", seed: 7 });
    expect(() =>
      engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "DONT_PASS", amount: 10 }),
    ).toThrow(/not offered/i);
  });
});
