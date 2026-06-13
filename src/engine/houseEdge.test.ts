import { describe, expect, it } from "vitest";
import { CrapsEngine } from "./engine";
import { exactEdgePct } from "./info/exactEdge";
import { CRAPLESS } from "./variants/crapless";
import { STANDARD } from "./variants/standard";
import type { BetDefId, BetInstance } from "./types";

function b(
  defId: BetDefId,
  amount = 1,
  extra: Partial<Pick<BetInstance, "number" | "hop" | "workingOverride">> = {},
): BetInstance {
  return { key: defId, defId, playerId: "p1", amount, ...extra };
}

describe("standard craps house edges match published numbers", () => {
  const lineCases: Array<[string, BetInstance, number]> = [
    ["pass line", b("PASS"), -1.4141],
    ["don't pass", b("DONT_PASS"), -1.3636],
    ["come", b("COME"), -1.4141],
    ["don't come", b("DONT_COME"), -1.3636],
  ];
  for (const [name, bet, edge] of lineCases) {
    it(`${name}: ${edge}%`, () => {
      const trackTable = bet.defId === "PASS" || bet.defId === "DONT_PASS";
      const pct = trackTable
        ? exactEdgePct(bet, STANDARD, true, "COME_OUT", null)
        : exactEdgePct(bet, STANDARD);
      expect(pct).toBeCloseTo(edge, 3);
    });
  }

  const flatCases: Array<[string, BetInstance, number]> = [
    ["field", b("FIELD"), -2.7778],
    ["place 6", b("PLACE", 1, { number: 6, workingOverride: true }), -1.5152],
    ["place 5", b("PLACE", 1, { number: 5, workingOverride: true }), -4.0],
    ["place 4", b("PLACE", 1, { number: 4, workingOverride: true }), -6.6667],
    ["buy 4", b("BUY", 1, { number: 4, workingOverride: true }), -1.6667],
    ["buy 5", b("BUY", 1, { number: 5, workingOverride: true }), -2.0],
    ["buy 6", b("BUY", 1, { number: 6, workingOverride: true }), -2.2727],
    ["lay 4", b("LAY", 1, { number: 4 }), -1.6667],
    ["lay 5", b("LAY", 1, { number: 5 }), -2.0],
    ["lay 6", b("LAY", 1, { number: 6 }), -2.2727],
    ["big 6", b("BIG_6"), -9.0909],
    ["hard 8", b("HARDWAY", 1, { number: 8 }), -9.0909],
    ["hard 4", b("HARDWAY", 1, { number: 4 }), -11.1111],
    ["any seven", b("ANY_SEVEN"), -16.6667],
    ["any craps", b("ANY_CRAPS"), -11.1111],
    ["yo", b("YO"), -11.1111],
    ["aces", b("ACES"), -13.8889],
    ["twelve", b("TWELVE"), -13.8889],
    ["hop easy", b("HOP", 1, { hop: [2, 5] }), -11.1111],
    ["hop hard", b("HOP", 1, { hop: [3, 3] }), -13.8889],
    ["horn", b("HORN", 4), -12.5],
    ["C&E", b("CE", 2), -11.1111],
  ];
  for (const [name, bet, edge] of flatCases) {
    it(`${name}: ${edge}%`, () => {
      expect(exactEdgePct(bet, STANDARD)).toBeCloseTo(edge, 3);
    });
  }

  it("free odds carry zero edge on every point", () => {
    for (const point of STANDARD.pointNumbers) {
      expect(
        exactEdgePct(b("PASS_ODDS"), STANDARD, false, "POINT_ON", point),
      ).toBeCloseTo(0, 8);
      expect(
        exactEdgePct(b("DONT_PASS_ODDS"), STANDARD, false, "POINT_ON", point),
      ).toBeCloseTo(0, 8);
    }
  });
});

describe("crapless craps house edges", () => {
  it("pass line: -5.3824% (the variant's defining trap)", () => {
    expect(exactEdgePct(b("PASS"), CRAPLESS, true, "COME_OUT", null)).toBeCloseTo(
      -5.3824,
      3,
    );
  });

  it("come matches pass", () => {
    expect(exactEdgePct(b("COME"), CRAPLESS)).toBeCloseTo(-5.3824, 3);
  });

  const cases: Array<[string, BetInstance, number]> = [
    ["place 2", b("PLACE", 1, { number: 2, workingOverride: true }), -7.1429],
    ["place 3", b("PLACE", 1, { number: 3, workingOverride: true }), -6.25],
    ["buy 2", b("BUY", 1, { number: 2, workingOverride: true }), -0.7143],
    ["buy 3", b("BUY", 1, { number: 3, workingOverride: true }), -1.25],
  ];
  for (const [name, bet, edge] of cases) {
    it(`${name}: ${edge}%`, () => {
      expect(exactEdgePct(bet, CRAPLESS)).toBeCloseTo(edge, 3);
    });
  }

  it("extra-point odds are still free", () => {
    for (const point of [2, 3, 11, 12]) {
      expect(
        exactEdgePct(b("PASS_ODDS"), CRAPLESS, false, "POINT_ON", point),
      ).toBeCloseTo(0, 8);
    }
  });
});

describe("long seeded session", () => {
  it("conserves chips: bankroll delta equals event-log net for every player", () => {
    const engine = new CrapsEngine({ variant: "standard", seed: 1234 });
    const start = 1_000_000;
    for (const id of ["p1", "p2"]) {
      engine.dispatch({
        type: "JOIN",
        player: { id, name: id, isAI: id === "p2", bankroll: start },
      });
    }

    const net = new Map<string, number>([
      ["p1", 0],
      ["p2", 0],
    ]);
    const track = (playerId: string, delta: number) =>
      net.set(playerId, (net.get(playerId) ?? 0) + delta);

    const tryBet = (
      playerId: string,
      defId: BetDefId,
      amount: number,
      number?: number,
    ) => {
      const state = engine.getState();
      const key = number === undefined ? defId : `${defId}:${number}`;
      if (state.bets.some((x) => x.playerId === playerId && x.key === key)) return;
      try {
        const events = engine.dispatch({ type: "PLACE_BET", playerId, defId, amount, number });
        for (const e of events)
          if (e.type === "BET_PLACED") track(e.playerId, -e.amount);
      } catch {
        // wrong phase etc. — fine, this is a randomized soak
      }
    };

    for (let i = 0; i < 20_000; i++) {
      tryBet("p1", "PASS", 10);
      tryBet("p1", "FIELD", 5);
      tryBet("p1", "PLACE", 12, 6);
      tryBet("p2", "DONT_PASS", 10);
      tryBet("p2", "HARDWAY", 1, 8);
      tryBet("p2", "COME", 5);
      const events = engine.dispatch({ type: "ROLL" });
      for (const e of events) {
        if (e.type === "BET_RESOLVED") track(e.playerId, e.returned);
        if (e.type === "BET_REMOVED") track(e.playerId, e.returned);
      }
    }

    const state = engine.getState();
    for (const id of ["p1", "p2"]) {
      const onFelt = state.bets
        .filter((x) => x.playerId === id)
        .reduce((sum, x) => sum + x.amount, 0);
      expect(state.players[id].bankroll + onFelt - start).toBeCloseTo(
        net.get(id) ?? 0,
        6,
      );
    }
  });

  it("pass-line empirical edge lands near 1.41% over 400k rolls", () => {
    const engine = new CrapsEngine({ variant: "standard", seed: 99 });
    engine.dispatch({
      type: "JOIN",
      player: { id: "p1", name: "P", isAI: false, bankroll: 100_000_000 },
    });
    let staked = 0;
    let profit = 0;
    for (let i = 0; i < 400_000; i++) {
      const state = engine.getState();
      if (
        state.phase === "COME_OUT" &&
        !state.bets.some((x) => x.key === "PASS")
      ) {
        engine.dispatch({ type: "PLACE_BET", playerId: "p1", defId: "PASS", amount: 1 });
      }
      for (const e of engine.dispatch({ type: "ROLL" })) {
        if (e.type === "BET_RESOLVED") {
          staked += e.staked;
          profit += e.profit;
        }
      }
    }
    const edgePct = (profit / staked) * 100;
    expect(edgePct).toBeGreaterThan(-2.5);
    expect(edgePct).toBeLessThan(-0.5);
  });
});
