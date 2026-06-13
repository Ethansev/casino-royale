export type GameCategory = "dice" | "cards" | "tables" | "slots";

export interface LobbyGame {
  id: string;
  title: string;
  img: string;
  href?: string;
  live: boolean;
  category: GameCategory;
  desc: string;
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
  },
  {
    id: "crapless",
    title: "Crapless Craps",
    img: "/marketing/card-crapless.png",
    href: "/craps?variant=crapless",
    live: true,
    category: "dice",
    desc: "You can't crap out — 2, 3, 11 and 12 become points.",
  },
  {
    id: "blackjack",
    title: "Blackjack",
    img: "/marketing/card-blackjack.png",
    live: false,
    category: "cards",
    desc: "Hit, stand, double. Coming soon.",
  },
  {
    id: "roulette",
    title: "Roulette",
    img: "/marketing/card-roulette.png",
    live: false,
    category: "tables",
    desc: "Spin the wheel. Coming soon.",
  },
  {
    id: "slots",
    title: "Slots",
    img: "/marketing/card-slots.png",
    live: false,
    category: "slots",
    desc: "Neon reels. Coming soon.",
  },
];
