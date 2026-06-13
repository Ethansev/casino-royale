import type { GameEvent, Roll } from "../engine/types";

function rollCall(roll: Roll, comeOut: boolean): string {
  const t = roll.total;
  const hard = roll.isHard;
  switch (t) {
    case 2:
      return "Two, craps! Snake eyes!";
    case 3:
      return "Three, craps! Ace-deuce!";
    case 4:
      return hard ? "Four, the hard way!" : "Four, easy four!";
    case 5:
      return "Five, no-field five!";
    case 6:
      return hard ? "Six, the hard way!" : "Six, easy six!";
    case 7:
      return comeOut ? "Seven! Front-line winner!" : "Seven!";
    case 8:
      return hard ? "Eight, the hard way!" : "Eight, easy eight!";
    case 9:
      return "Nine, center field!";
    case 10:
      return hard ? "Ten, the hard way!" : "Ten, easy ten!";
    case 11:
      return "Yo-leven!";
    default:
      return "Twelve, craps! Boxcars!";
  }
}

/** Stickman calls for one dispatched roll's event batch. */
export function announceEvents(events: readonly GameEvent[]): string[] {
  const calls: string[] = [];
  for (const e of events) {
    switch (e.type) {
      case "DICE_ROLLED":
        calls.push(rollCall(e.roll, e.phase === "COME_OUT"));
        break;
      case "POINT_ESTABLISHED":
        calls.push(`The point is ${e.point}. Dice are out!`);
        break;
      case "POINT_MADE":
        calls.push("Winner! Pay the line!");
        break;
      case "SEVEN_OUT":
        calls.push("Seven out! Line away.");
        break;
      default:
        break;
    }
  }
  return calls;
}
