import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/components/Brand";
import { ContentPage } from "@/components/content/ContentPage";

export const metadata: Metadata = {
  title: `About — ${BRAND}`,
  description: `${BRAND} is a free social casino: real physics dice, real odds, no real money.`,
};

export default function AboutPage() {
  return (
    <ContentPage eyebrow="About" title="A casino floor, minus the cash.">
      <p>
        {BRAND} is a free social casino. The dice are real physics, the odds
        are the real odds, and every bet on the felt is a bet you could actually
        make at a table — there&apos;s just no real money involved. Play for the
        thrill, the streaks, and the bragging rights.
      </p>

      <h2>What makes it different</h2>
      <ul>
        <li>Physics-driven dice, not a coin-flip RNG dressed up as a roll.</li>
        <li>Every real bet on the layout, with odds you can actually see.</li>
        <li>Credits that work across every game, all free to play.</li>
      </ul>

      <h2>What&apos;s here now</h2>
      <p>
        <Link href="/craps">Craps</Link> and{" "}
        <Link href="/craps?variant=crapless">Crapless Craps</Link> are live.
        Blackjack, Roulette, and Slots are on the way — the lobby will light them
        up as they land.
      </p>

      <h2>The fine print, plainly</h2>
      <p>
        {BRAND} is for entertainment only. There is no real-money gambling and
        no cash payouts — just the game.
      </p>
    </ContentPage>
  );
}
