import { describe, expect, it } from "vitest";
import { CRAPLESS } from "../variants/crapless";
import { STANDARD } from "../variants/standard";
import { getBetInfo } from "./betInfo";
import type { BetTarget } from "./exactEdge";
import type { BetDefId } from "../types";

describe("getBetInfo", () => {
  it("pass line edge differs by variant", () => {
    expect(getBetInfo("PASS", {}, STANDARD).houseEdgePct).toBeCloseTo(1.41, 2);
    expect(getBetInfo("PASS", {}, CRAPLESS).houseEdgePct).toBeCloseTo(5.38, 2);
  });

  it("place 6 shows 7:6 payout, 6:5 true odds, 1.52% edge", () => {
    const info = getBetInfo("PLACE", { number: 6 }, STANDARD);
    expect(info.payoutText).toBe("7:6");
    expect(info.trueOddsText).toBe("6:5");
    expect(info.houseEdgePct).toBeCloseTo(1.52, 2);
  });

  it("odds bets show zero edge and grouped true-odds text", () => {
    const info = getBetInfo("PASS_ODDS", {}, STANDARD);
    expect(info.houseEdgePct).toBe(0);
    expect(info.payoutText).toContain("2:1 on 4 & 10");
    expect(info.payoutText).toContain("6:5 on 6 & 8");
  });

  it("crapless buy 2 is a bargain and says so", () => {
    const info = getBetInfo("BUY", { number: 2 }, CRAPLESS);
    expect(info.houseEdgePct).toBeCloseTo(0.71, 2);
    expect(info.payoutText).toContain("6:1");
  });

  it("yo shows the published gap between payout and true odds", () => {
    const info = getBetInfo("YO", {}, STANDARD);
    expect(info.payoutText).toBe("15:1");
    expect(info.trueOddsText).toBe("17:1");
    expect(info.houseEdgePct).toBeCloseTo(11.11, 2);
  });

  it("every bet type produces complete info in both variants", () => {
    const cases: ReadonlyArray<[BetDefId, BetTarget]> = [
      ["PASS", {}],
      ["COME", {}],
      ["PASS_ODDS", {}],
      ["COME_ODDS", { number: 6 }],
      ["PLACE", { number: 6 }],
      ["BUY", { number: 4 }],
      ["FIELD", {}],
      ["BIG_6", {}],
      ["BIG_8", {}],
      ["HARDWAY", { number: 8 }],
      ["ANY_SEVEN", {}],
      ["ANY_CRAPS", {}],
      ["YO", {}],
      ["THREE", {}],
      ["ACES", {}],
      ["TWELVE", {}],
      ["HOP", { hop: [2, 5] }],
      ["HORN", {}],
      ["CE", {}],
    ];
    const dontCases: ReadonlyArray<[BetDefId, BetTarget]> = [
      ["DONT_PASS", {}],
      ["DONT_COME", {}],
      ["DONT_PASS_ODDS", {}],
      ["DONT_COME_ODDS", { number: 6 }],
      ["LAY", { number: 4 }],
    ];

    for (const config of [STANDARD, CRAPLESS]) {
      const all = config.dontBetsAllowed ? [...cases, ...dontCases] : cases;
      for (const [defId, target] of all) {
        const info = getBetInfo(defId, target, config);
        expect(info.name.length).toBeGreaterThan(0);
        expect(info.description.length).toBeGreaterThan(0);
        expect(info.payoutText.length).toBeGreaterThan(0);
        expect(Number.isFinite(info.houseEdgePct)).toBe(true);
      }
    }
  });
});
