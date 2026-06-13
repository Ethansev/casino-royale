import type { Metadata } from "next";
import GameRoot from "@/components/GameRoot";

export const metadata: Metadata = {
  title: "Craps — Midnight Rollers",
};

export default async function CrapsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const variant = params.variant === "crapless" ? "crapless" : "standard";
  return <GameRoot variant={variant} />;
}
