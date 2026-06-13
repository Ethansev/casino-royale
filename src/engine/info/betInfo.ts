import type { BetDefId, Ratio, VariantConfig } from "../types";
import { betEdgePct, type BetTarget } from "./exactEdge";

export interface BetInfo {
  name: string;
  description: string;
  winsWhen: string;
  losesWhen: string;
  payoutText: string;
  trueOddsText?: string;
  /** Positive percentage, e.g. 1.41 means the house keeps 1.41% long-run. */
  houseEdgePct: number;
  tip?: string;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function ratioText(r: Ratio): string {
  const g = gcd(r.num, r.den);
  return `${r.num / g}:${r.den / g}`;
}

function ways(total: number): number {
  return 6 - Math.abs(total - 7);
}

function oddsAgainstText(winWays: number, loseWays: number): string {
  const g = gcd(loseWays, winWays);
  return `${loseWays / g}:${winWays / g}`;
}

function listText(numbers: readonly number[]): string {
  if (numbers.length === 0) return "nothing";
  if (numbers.length === 1) return `${numbers[0]}`;
  return `${numbers.slice(0, -1).join(", ")} or ${numbers[numbers.length - 1]}`;
}

/** "2:1 on 4 & 10, 3:2 on 5 & 9, 6:5 on 6 & 8" */
function groupedRatioText(
  numbers: readonly number[],
  table: Readonly<Record<number, Ratio>>,
): string {
  const groups = new Map<string, number[]>();
  for (const n of numbers) {
    const text = ratioText(table[n]);
    const list = groups.get(text);
    if (list) list.push(n);
    else groups.set(text, [n]);
  }
  return [...groups.entries()]
    .map(([text, nums]) => `${text} on ${nums.join(" & ")}`)
    .join(", ");
}

const edgeCache = new Map<string, number>();

function edgeFor(
  defId: BetDefId,
  target: BetTarget,
  config: VariantConfig,
): number {
  const key = `${config.variant}|${defId}|${target.number ?? ""}|${
    target.hop ? target.hop.join("-") : ""
  }`;
  let edge = edgeCache.get(key);
  if (edge === undefined) {
    edge = Math.round(-betEdgePct(defId, target, config) * 100) / 100 || 0;
    edgeCache.set(key, edge);
  }
  return edge;
}

export function getBetInfo(
  defId: BetDefId,
  target: BetTarget,
  config: VariantConfig,
): BetInfo {
  const n = target.number;
  const crapless = config.variant === "crapless";
  const houseEdgePct = edgeFor(defId, target, config);
  const base = { houseEdgePct };

  switch (defId) {
    case "PASS":
      return {
        ...base,
        name: "Pass Line",
        description: crapless
          ? "The line bet, riding with the shooter. In crapless craps the come-out can't lose — 2, 3 and 12 become points — but 11 no longer wins instantly, which is why the house edge nearly quadruples."
          : "The fundamental craps bet, riding with the shooter.",
        winsWhen: `Come-out roll of ${listText(config.passComeOutWin)}, or the shooter makes the point before rolling a 7.`,
        losesWhen: crapless
          ? "A 7 before the point repeats."
          : `Come-out roll of ${listText(config.passComeOutLose)} (craps), or a 7 before the point repeats.`,
        payoutText: "1:1",
        tip: crapless
          ? "Feels safer since you can't crap out, but pays much worse long-run: 5.38% vs 1.41% in standard craps."
          : "One of the best bets on the table. Back it with free odds to lower the combined edge further.",
      };

    case "DONT_PASS":
      return {
        ...base,
        name: "Don't Pass",
        description:
          "The dark side: betting against the shooter. A come-out 12 is a push (bar 12) — that bar is where the house edge lives.",
        winsWhen: `Come-out roll of ${listText(config.dontComeOutWin)}, or a 7 before the point repeats.`,
        losesWhen: `Come-out roll of ${listText(config.passComeOutWin)}, or the shooter makes the point.`,
        payoutText: "1:1",
        tip: "Marginally better odds than the pass line, at the cost of rooting against the table.",
      };

    case "COME":
      return {
        ...base,
        name: "Come",
        description:
          "A private pass-line bet you can make once the point is on. The next roll is its own come-out; if a point number rolls, the bet travels to that number.",
        winsWhen: `Next roll is ${listText(config.passComeOutWin)}, or after traveling, your come number repeats before a 7.`,
        losesWhen: crapless
          ? "A 7 rolls before your traveled come number repeats."
          : `Next roll is ${listText(config.passComeOutLose)}, or after traveling, a 7 before your number repeats.`,
        payoutText: "1:1",
        tip: "The classic way to get more numbers working with the same low edge as the pass line.",
      };

    case "DONT_COME":
      return {
        ...base,
        name: "Don't Come",
        description:
          "Don't pass for the mid-hand: bets against the next number established after the point is on.",
        winsWhen: `Next roll is ${listText(config.dontComeOutWin)}, or after traveling, a 7 before your number repeats.`,
        losesWhen: `Next roll is ${listText(config.passComeOutWin)}, or your traveled number repeats.`,
        payoutText: "1:1",
      };

    case "PASS_ODDS":
    case "COME_ODDS": {
      const isCome = defId === "COME_ODDS";
      return {
        ...base,
        name: isCome ? "Come Odds" : "Pass Line Odds",
        description: `Extra money behind your ${isCome ? "come" : "pass line"} bet once it has a number, paid at true mathematical odds. The only zero-house-edge bet in the casino.${isCome ? " Off during the come-out unless you call it working." : ""}`,
        winsWhen: isCome
          ? "Your come number rolls before a 7."
          : "The shooter makes the point.",
        losesWhen: "A 7 rolls first.",
        payoutText:
          n !== undefined
            ? `${ratioText(config.trueOdds[n])} (true odds)`
            : groupedRatioText(config.pointNumbers, config.trueOdds),
        trueOddsText:
          n !== undefined ? ratioText(config.trueOdds[n]) : undefined,
        tip: "Always take the maximum odds you're comfortable with — it's free of house edge and dilutes the flat bet's edge.",
      };
    }

    case "DONT_PASS_ODDS":
    case "DONT_COME_ODDS": {
      const isCome = defId === "DONT_COME_ODDS";
      const inverseTable = Object.fromEntries(
        config.pointNumbers.map((p) => {
          const r = config.trueOdds[p];
          return [p, { num: r.den, den: r.num }];
        }),
      );
      return {
        ...base,
        name: isCome ? "Don't Come Odds" : "Don't Pass Odds",
        description:
          "Lay extra money behind your don't bet at true odds — you put up more to win less, because the 7 is the favorite.",
        winsWhen: "A 7 rolls before the number.",
        losesWhen: "The number repeats first.",
        payoutText:
          n !== undefined
            ? `${ratioText(inverseTable[n])} (true odds)`
            : groupedRatioText(config.pointNumbers, inverseTable),
        tip: "Zero house edge, same as taking odds — just inverted.",
      };
    }

    case "PLACE":
      return {
        ...base,
        name: n !== undefined ? `Place ${n}` : "Place Bet",
        description: `Bet that the ${n ?? "number"} rolls before a 7. Off during the come-out roll unless you call it working.`,
        winsWhen: `The ${n ?? "number"} rolls before a 7 (while working).`,
        losesWhen: "A 7 rolls while the bet is working.",
        payoutText: n !== undefined ? ratioText(config.placePayout[n]) : "varies",
        trueOddsText: n !== undefined ? ratioText(config.trueOdds[n]) : undefined,
        tip:
          n === 6 || n === 8
            ? "Place 6 and 8 are among the best non-line bets: 1.52% edge. Bet in multiples of $6 for full payouts."
            : undefined,
      };

    case "BUY":
      return {
        ...base,
        name: n !== undefined ? `Buy ${n}` : "Buy Bet",
        description: `Like a place bet on the ${n ?? "number"}, but paid at full true odds in exchange for a 5% commission on the win.`,
        winsWhen: `The ${n ?? "number"} rolls before a 7 (while working).`,
        losesWhen: "A 7 rolls while the bet is working.",
        payoutText:
          n !== undefined
            ? `${ratioText(config.trueOdds[n])} minus 5% vig on the win`
            : "true odds minus 5% vig",
        trueOddsText: n !== undefined ? ratioText(config.trueOdds[n]) : undefined,
        tip:
          n === 4 || n === 10
            ? "Buying beats placing on the 4 and 10 (1.67% vs 6.67%)."
            : crapless && (n === 2 || n === 3 || n === 11 || n === 12)
              ? "Buying the extreme numbers is one of crapless craps' few good deals."
              : "Only worth it where true odds beat the place payout by more than the vig — the 4, 10 and outer numbers.",
      };

    case "LAY":
      return {
        ...base,
        name: n !== undefined ? `Lay ${n}` : "Lay Bet",
        description: `Bet against the ${n ?? "number"}: you're backing the 7. Pays true odds minus a 5% commission on the win, and you put up the long side.`,
        winsWhen: `A 7 rolls before the ${n ?? "number"}.`,
        losesWhen: `The ${n ?? "number"} rolls first.`,
        payoutText:
          n !== undefined
            ? `${ratioText({ num: config.trueOdds[n].den, den: config.trueOdds[n].num })} minus 5% vig on the win`
            : "inverse true odds minus 5% vig",
      };

    case "BIG_6":
    case "BIG_8": {
      const num = defId === "BIG_6" ? 6 : 8;
      return {
        ...base,
        name: `Big ${num}`,
        description: `Even money that the ${num} rolls before a 7 — exactly the same proposition as Place ${num}, paid worse.`,
        winsWhen: `The ${num} rolls before a 7.`,
        losesWhen: "A 7 rolls first.",
        payoutText: "1:1",
        trueOddsText: "6:5",
        tip: `Never bet this: Place ${num} wins the identical event at 7:6 instead of 1:1 (1.52% vs 9.09% edge).`,
      };
    }

    case "FIELD":
      return {
        ...base,
        name: "Field",
        description:
          "One-roll bet on the outside numbers. Wins on 2, 3, 4, 9, 10, 11 or 12 — the 2 pays double and the 12 triple.",
        winsWhen: "Next roll is 2, 3, 4, 9, 10, 11 or 12.",
        losesWhen: "Next roll is 5, 6, 7 or 8.",
        payoutText: "1:1 (2 pays 2:1, 12 pays 3:1)",
        tip: "Covers 7 of 11 totals but the misses are the most common rolls. 2.78% edge — fine for action, worse than the line.",
      };

    case "HARDWAY": {
      const half = n !== undefined ? n / 2 : undefined;
      return {
        ...base,
        name: n !== undefined ? `Hard ${n}` : "Hardway",
        description: `The ${n ?? "number"} must roll as a pair (${half ?? "x"}-${half ?? "x"}) before any easy ${n ?? "number"} and before a 7.`,
        winsWhen: `${half ?? "x"}-${half ?? "x"} rolls before a 7 or an easy ${n ?? "number"}.`,
        losesWhen: `A 7 or an easy ${n ?? "number"} rolls first.`,
        payoutText: n === 4 || n === 10 ? "7:1" : "9:1",
        trueOddsText:
          n !== undefined ? oddsAgainstText(1, ways(n) - 1 + 6) : undefined,
        tip: "A staple for prop players, but the edge is 9–11%. Keep it small.",
      };
    }

    case "ANY_SEVEN":
      return {
        ...base,
        name: "Any Seven",
        description: "One-roll bet that the next roll is a 7, any way.",
        winsWhen: "Next roll totals 7.",
        losesWhen: "Anything else.",
        payoutText: "4:1",
        trueOddsText: oddsAgainstText(ways(7), 36 - ways(7)),
        tip: "The single worst bet on the table at 16.67% — true odds are 5:1, it pays 4:1.",
      };

    case "ANY_CRAPS":
      return {
        ...base,
        name: "Any Craps",
        description: "One-roll bet on craps: 2, 3 or 12.",
        winsWhen: "Next roll is 2, 3 or 12.",
        losesWhen: "Anything else.",
        payoutText: "7:1",
        trueOddsText: "8:1",
        tip: "Often used to 'hedge' a pass-line come-out — the math says don't bother.",
      };

    case "YO":
      return {
        ...base,
        name: "Yo (Eleven)",
        description: "One-roll bet on the 11. Called 'yo-leven' so it isn't misheard as seven.",
        winsWhen: "Next roll is 11.",
        losesWhen: "Anything else.",
        payoutText: "15:1",
        trueOddsText: "17:1",
      };

    case "THREE":
      return {
        ...base,
        name: "Ace-Deuce (3)",
        description: "One-roll bet on the 3.",
        winsWhen: "Next roll is 3.",
        losesWhen: "Anything else.",
        payoutText: "15:1",
        trueOddsText: "17:1",
      };

    case "ACES":
      return {
        ...base,
        name: "Aces (Snake Eyes)",
        description: "One-roll bet on the 2 — both dice showing 1.",
        winsWhen: "Next roll is 2.",
        losesWhen: "Anything else.",
        payoutText: "30:1",
        trueOddsText: "35:1",
      };

    case "TWELVE":
      return {
        ...base,
        name: "Twelve (Midnight)",
        description: "One-roll bet on the 12 — boxcars.",
        winsWhen: "Next roll is 12.",
        losesWhen: "Anything else.",
        payoutText: "30:1",
        trueOddsText: "35:1",
      };

    case "HOP": {
      if (!target.hop) {
        return {
          ...base,
          name: "Hop Bets",
          description:
            "One-roll bet on an exact dice combination of your choice — call any pair of faces.",
          winsWhen: "The dice land exactly on your called combination.",
          losesWhen: "Any other combination.",
          payoutText: "15:1 (pairs pay 30:1)",
          tip: "Pure lottery-ticket action. House edge 11–14%.",
        };
      }
      const hard = target.hop[0] === target.hop[1];
      const label = `${target.hop[0]}-${target.hop[1]}`;
      return {
        ...base,
        name: `Hop ${label}`,
        description: `One-roll bet that the next roll is exactly ${label}.`,
        winsWhen: `The dice land exactly ${label}.`,
        losesWhen: "Any other combination.",
        payoutText: hard ? "30:1" : "15:1",
        trueOddsText: hard ? "35:1" : "17:1",
        tip: "Pure lottery-ticket action. House edge 11–14%.",
      };
    }

    case "HORN":
      return {
        ...base,
        name: "Horn",
        description:
          "One bet split four ways across 2, 3, 11 and 12. A winner pays its number's rate on a quarter of the bet; the other three quarters lose.",
        winsWhen: "Next roll is 2, 3, 11 or 12.",
        losesWhen: "Next roll is 4 through 10.",
        payoutText: "30:1 on 2/12, 15:1 on 3/11 (¼ of the bet each)",
        tip: "Bet in multiples of 4 so the split is even.",
      };

    case "CE":
      return {
        ...base,
        name: "C & E",
        description:
          "Half on any craps (2, 3, 12), half on the yo (11). One roll.",
        winsWhen: "Next roll is 2, 3, 11 or 12.",
        losesWhen: "Anything else.",
        payoutText: "7:1 on craps, 15:1 on 11 (half the bet each)",
        tip: "Bet in even amounts so the halves split cleanly.",
      };
  }
}
