import type { VariantConfig } from "../types";

/**
 * Crapless craps: the come-out can't lose (2,3,12 become points) and 11
 * doesn't win (it's a point too). Pass wins only on 7. No dark side.
 */
export const CRAPLESS: VariantConfig = {
  variant: "crapless",
  pointNumbers: [2, 3, 4, 5, 6, 8, 9, 10, 11, 12],
  passComeOutWin: [7],
  passComeOutLose: [],
  dontComeOutWin: [],
  dontComeOutPush: [],
  dontBetsAllowed: false,
  placeNumbers: [2, 3, 4, 5, 6, 8, 9, 10, 11, 12],
  buyNumbers: [2, 3, 4, 5, 6, 8, 9, 10, 11, 12],
  layNumbers: [],
  trueOdds: {
    2: { num: 6, den: 1 },
    3: { num: 3, den: 1 },
    4: { num: 2, den: 1 },
    5: { num: 3, den: 2 },
    6: { num: 6, den: 5 },
    8: { num: 6, den: 5 },
    9: { num: 3, den: 2 },
    10: { num: 2, den: 1 },
    11: { num: 3, den: 1 },
    12: { num: 6, den: 1 },
  },
  placePayout: {
    2: { num: 11, den: 2 },
    3: { num: 11, den: 4 },
    4: { num: 9, den: 5 },
    5: { num: 7, den: 5 },
    6: { num: 7, den: 6 },
    8: { num: 7, den: 6 },
    9: { num: 7, den: 5 },
    10: { num: 9, den: 5 },
    11: { num: 11, den: 4 },
    12: { num: 11, den: 2 },
  },
  fieldPayout: {
    2: { num: 2, den: 1 },
    3: { num: 1, den: 1 },
    4: { num: 1, den: 1 },
    9: { num: 1, den: 1 },
    10: { num: 1, den: 1 },
    11: { num: 1, den: 1 },
    12: { num: 3, den: 1 },
  },
};
