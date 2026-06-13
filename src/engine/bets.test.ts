import { describe, expect, it } from "vitest";
import { resolveBet, type ResolveCtx, type Resolution } from "./bets/resolvers";
import { makeRoll } from "./rng";
import { CRAPLESS } from "./variants/crapless";
import { STANDARD } from "./variants/standard";
import type { BetDefId, BetInstance, Die } from "./types";

function bet(
  defId: BetDefId,
  amount: number,
  extra: Partial<Pick<BetInstance, "number" | "hop" | "workingOverride">> = {},
): BetInstance {
  return { key: defId, defId, playerId: "p1", amount, ...extra };
}

function ctx(
  d1: Die,
  d2: Die,
  over: Partial<Omit<ResolveCtx, "roll">> = {},
): ResolveCtx {
  return {
    roll: makeRoll(d1, d2),
    phase: over.phase ?? "POINT_ON",
    point: over.point ?? 8,
    config: over.config ?? STANDARD,
    rolledSince7: over.rolledSince7 ?? new Set<number>(),
  };
}

function winProfit(r: Resolution): number {
  if (r.kind !== "WIN") throw new Error(`expected WIN, got ${r.kind}`);
  return r.profit;
}

describe("place bets", () => {
  const cases: Array<[number, Die, Die, number, number]> = [
    // number, d1, d2, amount, profit
    [4, 2, 2, 5, 9],
    [5, 2, 3, 5, 7],
    [6, 3, 3, 6, 7],
    [8, 4, 4, 6, 7],
    [9, 4, 5, 5, 7],
    [10, 5, 5, 5, 9],
  ];
  for (const [n, d1, d2, amount, profit] of cases) {
    it(`place ${n} pays ${profit}:${amount}`, () => {
      const r = resolveBet(bet("PLACE", amount, { number: n }), ctx(d1, d2));
      expect(winProfit(r)).toBeCloseTo(profit, 10);
    });
  }

  it("loses to the seven when working", () => {
    const r = resolveBet(bet("PLACE", 6, { number: 6 }), ctx(3, 4));
    expect(r.kind).toBe("LOSE");
  });

  it("is unaffected by the seven when off (come-out)", () => {
    const r = resolveBet(
      bet("PLACE", 6, { number: 6 }),
      ctx(3, 4, { phase: "COME_OUT", point: null }),
    );
    expect(r.kind).toBe("NONE");
  });
});

describe("buy and lay", () => {
  it("buy 4 pays true odds minus 5% vig on the win", () => {
    const r = resolveBet(bet("BUY", 20, { number: 4 }), ctx(2, 2));
    expect(winProfit(r)).toBeCloseTo(40 - 1, 10);
  });

  it("lay 4 pays 1:2 minus 5% of the win", () => {
    const r = resolveBet(bet("LAY", 40, { number: 4 }), ctx(3, 4));
    expect(winProfit(r)).toBeCloseTo(20 * 0.95, 10);
  });

  it("lay loses when the number rolls", () => {
    const r = resolveBet(bet("LAY", 40, { number: 4 }), ctx(2, 2));
    expect(r.kind).toBe("LOSE");
  });
});

describe("field", () => {
  it("pays even on 3,4,9,10,11", () => {
    for (const [d1, d2] of [
      [1, 2],
      [2, 2],
      [4, 5],
      [5, 5],
      [5, 6],
    ] satisfies Array<[Die, Die]>) {
      expect(winProfit(resolveBet(bet("FIELD", 5), ctx(d1, d2)))).toBe(5);
    }
  });

  it("pays double on 2 and triple on 12", () => {
    expect(winProfit(resolveBet(bet("FIELD", 5), ctx(1, 1)))).toBe(10);
    expect(winProfit(resolveBet(bet("FIELD", 5), ctx(6, 6)))).toBe(15);
  });

  it("loses on 5,6,7,8", () => {
    for (const [d1, d2] of [
      [2, 3],
      [3, 3],
      [3, 4],
      [4, 4],
    ] satisfies Array<[Die, Die]>) {
      expect(resolveBet(bet("FIELD", 5), ctx(d1, d2)).kind).toBe("LOSE");
    }
  });
});

describe("hardways", () => {
  it("hard 8 pays 9:1, hard 4 pays 7:1", () => {
    expect(winProfit(resolveBet(bet("HARDWAY", 5, { number: 8 }), ctx(4, 4)))).toBe(45);
    expect(winProfit(resolveBet(bet("HARDWAY", 5, { number: 4 }), ctx(2, 2)))).toBe(35);
  });

  it("loses the easy way and on seven", () => {
    expect(resolveBet(bet("HARDWAY", 5, { number: 8 }), ctx(5, 3)).kind).toBe("LOSE");
    expect(resolveBet(bet("HARDWAY", 5, { number: 8 }), ctx(3, 4)).kind).toBe("LOSE");
  });

  it("stays up on unrelated rolls and when called off", () => {
    expect(resolveBet(bet("HARDWAY", 5, { number: 8 }), ctx(2, 3)).kind).toBe("NONE");
    expect(
      resolveBet(bet("HARDWAY", 5, { number: 8, workingOverride: false }), ctx(3, 4)).kind,
    ).toBe("NONE");
  });
});

describe("one-roll props", () => {
  it("pays published ratios", () => {
    expect(winProfit(resolveBet(bet("ANY_SEVEN", 5), ctx(3, 4)))).toBe(20);
    expect(winProfit(resolveBet(bet("ANY_CRAPS", 5), ctx(1, 2)))).toBe(35);
    expect(winProfit(resolveBet(bet("YO", 5), ctx(5, 6)))).toBe(75);
    expect(winProfit(resolveBet(bet("THREE", 5), ctx(1, 2)))).toBe(75);
    expect(winProfit(resolveBet(bet("ACES", 5), ctx(1, 1)))).toBe(150);
    expect(winProfit(resolveBet(bet("TWELVE", 5), ctx(6, 6)))).toBe(150);
  });

  it("loses on any other roll", () => {
    expect(resolveBet(bet("YO", 5), ctx(3, 4)).kind).toBe("LOSE");
    expect(resolveBet(bet("ACES", 5), ctx(1, 2)).kind).toBe("LOSE");
  });

  it("hop bets pay 15:1 easy, 30:1 hard, and match exact dice", () => {
    expect(winProfit(resolveBet(bet("HOP", 5, { hop: [2, 5] }), ctx(5, 2)))).toBe(75);
    expect(winProfit(resolveBet(bet("HOP", 5, { hop: [3, 3] }), ctx(3, 3)))).toBe(150);
    expect(resolveBet(bet("HOP", 5, { hop: [2, 5] }), ctx(3, 4)).kind).toBe("LOSE");
  });

  it("horn splits four ways", () => {
    expect(winProfit(resolveBet(bet("HORN", 4), ctx(1, 1)))).toBe(27);
    expect(winProfit(resolveBet(bet("HORN", 4), ctx(1, 2)))).toBe(12);
    expect(resolveBet(bet("HORN", 4), ctx(2, 3)).kind).toBe("LOSE");
  });

  it("C&E splits craps and eleven", () => {
    expect(winProfit(resolveBet(bet("CE", 2), ctx(1, 1)))).toBe(6);
    expect(winProfit(resolveBet(bet("CE", 2), ctx(5, 6)))).toBe(14);
    expect(resolveBet(bet("CE", 2), ctx(2, 2)).kind).toBe("LOSE");
  });
});

describe("come box resolution", () => {
  const comeBox = () => bet("COME", 10);

  it("standard: 11 wins, 3 loses, 5 travels", () => {
    expect(winProfit(resolveBet(comeBox(), ctx(5, 6)))).toBe(10);
    expect(resolveBet(comeBox(), ctx(1, 2)).kind).toBe("LOSE");
    const r = resolveBet(comeBox(), ctx(2, 3));
    expect(r).toEqual({ kind: "MOVE", toNumber: 5 });
  });

  it("crapless: 11 travels instead of winning, 2 travels instead of losing", () => {
    const c = { config: CRAPLESS };
    expect(resolveBet(comeBox(), ctx(5, 6, c))).toEqual({ kind: "MOVE", toNumber: 11 });
    expect(resolveBet(comeBox(), ctx(1, 1, c))).toEqual({ kind: "MOVE", toNumber: 2 });
    expect(winProfit(resolveBet(comeBox(), ctx(3, 4, c)))).toBe(10);
  });
});

describe("odds payouts by point", () => {
  const points: Array<[number, Die, Die, number]> = [
    // point, d1, d2, profit on 100
    [4, 2, 2, 200],
    [5, 2, 3, 150],
    [6, 3, 3, 120],
    [8, 4, 4, 120],
    [9, 4, 5, 150],
    [10, 5, 5, 200],
  ];
  for (const [point, d1, d2, profit] of points) {
    it(`pass odds on ${point} pay ${profit}:100`, () => {
      const r = resolveBet(bet("PASS_ODDS", 100), ctx(d1, d2, { point }));
      expect(winProfit(r)).toBeCloseTo(profit, 10);
    });
  }

  it("don't pass odds lay the inverse", () => {
    const r = resolveBet(bet("DONT_PASS_ODDS", 200), ctx(3, 4, { point: 4 }));
    expect(winProfit(r)).toBeCloseTo(100, 10);
  });

  it("crapless: place and buy the 2 and 12", () => {
    const c = { config: CRAPLESS };
    expect(
      winProfit(resolveBet(bet("PLACE", 10, { number: 2 }), ctx(1, 1, c))),
    ).toBeCloseTo(55, 10);
    expect(
      winProfit(resolveBet(bet("BUY", 10, { number: 12 }), ctx(6, 6, c))),
    ).toBeCloseTo(60 - 0.5, 10);
  });
});
