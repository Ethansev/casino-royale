import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/components/Brand";
import { ContentPage } from "@/components/content/ContentPage";

export const metadata: Metadata = {
  title: `How to Play — ${BRAND}`,
  description: `Learn the games at ${BRAND}, starting with craps: the pass line, points, and free odds.`,
};

export default function RulesPage() {
  return (
    <ContentPage eyebrow="How to Play" title="Learn the table in a minute.">
      <p>
        New to the felt? Here&apos;s the short version. Deeper, per-game guides
        are on the way — for now, the quickest way to learn is to pull up a table
        and play.
      </p>

      <h2>Craps, at a glance</h2>
      <ul>
        <li>
          Put a chip on the <strong>Pass Line</strong> and the shooter rolls the
          come-out: 7 or 11 wins, 2/3/12 loses.
        </li>
        <li>
          Any other number becomes the <strong>point</strong>. Roll the point
          again before a 7 to win.
        </li>
        <li>
          Back your pass line with <strong>free odds</strong> — the one bet in
          the house with no edge against you.
        </li>
        <li>
          From there, the whole layout is open: place bets, field, hardways, and
          more. In-game odds and payouts are a tap away.
        </li>
      </ul>
      <p>
        Ready? <Link href="/craps">Play Craps</Link> or try{" "}
        <Link href="/craps?variant=crapless">Crapless Craps</Link>, where you
        can&apos;t crap out on the come-out.
      </p>

      <h2>More games coming</h2>
      <p>
        Blackjack, Roulette, and Slots are in the works, each with its own
        how-to. Watch the <Link href="/">lobby</Link> for them to go live.
      </p>
    </ContentPage>
  );
}
