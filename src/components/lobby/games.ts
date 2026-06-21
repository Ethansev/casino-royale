export type GameCategory = "dice" | "cards" | "tables" | "slots";

export interface LobbyGame {
  id: string;
  title: string;
  img: string;
  href?: string;
  live: boolean;
  category: GameCategory;
  desc: string;
  /** Short "how it works" blurb shown on hover. */
  howTo?: string;
  /** Headline bets/payouts or features shown on hover. */
  highlights?: readonly string[];
}

export const CATEGORY_LABELS: ReadonlyArray<{
  id: GameCategory | "all";
  label: string;
}> = [
  { id: "all", label: "All games" },
  { id: "dice", label: "Dice" },
  { id: "cards", label: "Cards" },
  { id: "tables", label: "Tables" },
  { id: "slots", label: "Slots" },
];

export const GAMES: readonly LobbyGame[] = [
  {
    id: "craps",
    title: "Craps",
    img: "/marketing/card-craps.png",
    href: "/craps",
    live: true,
    category: "dice",
    desc: "The classic. Pass line, full odds, every bet on the felt.",
    howTo:
      "Bet the pass line, the shooter rolls a point, then aim to repeat it before a 7. Back it with free odds — the only zero-edge bet on the table.",
    highlights: ["Pass line 1:1", "3-4-5x free odds", "Place, field, hardways & props"],
  },
  {
    id: "crapless",
    title: "Crapless Craps",
    img: "/marketing/card-crapless.png",
    href: "/craps?variant=crapless",
    live: true,
    category: "dice",
    desc: "You can't crap out — 2, 3, 11 and 12 become points.",
    howTo:
      "Same as craps, but you can never crap out on the come-out: 2, 3, 11 and 12 all become points instead of losing.",
    highlights: ["No come-out loss", "Extra point numbers", "Higher house edge than craps"],
  },
  {
    id: "blackjack",
    title: "Blackjack",
    img: "/marketing/card-blackjack.png",
    live: false,
    category: "cards",
    desc: "Hit, stand, double. Coming soon.",
    howTo: "Beat the dealer to 21 without busting. Hit, stand, double down, split.",
    highlights: ["Blackjack pays 3:2", "Dealer stands on 17", "Coming soon"],
  },
  {
    id: "roulette",
    title: "Roulette",
    img: "/marketing/card-roulette.png",
    live: false,
    category: "tables",
    desc: "Spin the wheel. Coming soon.",
    howTo: "Bet on numbers, colors, or ranges, then spin the wheel and watch it land.",
    highlights: ["Straight up 35:1", "Red/black even money", "Coming soon"],
  },
  {
    id: "slots",
    title: "Slots",
    img: "/marketing/card-slots.png",
    live: false,
    category: "slots",
    desc: "Neon reels. Coming soon.",
    howTo: "Set your bet, spin the reels, and line up symbols across the paylines.",
    highlights: ["Multiple paylines", "Bonus spins", "Coming soon"],
  },
];
