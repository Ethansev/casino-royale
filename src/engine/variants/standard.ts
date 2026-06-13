import type { VariantConfig } from "../types";

export const STANDARD: VariantConfig = {
  variant: "standard",
  pointNumbers: [4, 5, 6, 8, 9, 10],
  passComeOutWin: [7, 11],
  passComeOutLose: [2, 3, 12],
  dontComeOutWin: [2, 3],
  dontComeOutPush: [12],
  dontBetsAllowed: true,
  placeNumbers: [4, 5, 6, 8, 9, 10],
  buyNumbers: [4, 5, 6, 8, 9, 10],
  layNumbers: [4, 5, 6, 8, 9, 10],
  trueOdds: {
    4: { num: 2, den: 1 },
    5: { num: 3, den: 2 },
    6: { num: 6, den: 5 },
    8: { num: 6, den: 5 },
    9: { num: 3, den: 2 },
    10: { num: 2, den: 1 },
  },
  placePayout: {
    4: { num: 9, den: 5 },
    5: { num: 7, den: 5 },
    6: { num: 7, den: 6 },
    8: { num: 7, den: 6 },
    9: { num: 7, den: 5 },
    10: { num: 9, den: 5 },
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
