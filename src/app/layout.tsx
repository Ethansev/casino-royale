import type { Metadata } from "next";
import { Baloo_2, Inter } from "next/font/google";
import { ThemeShell } from "@/components/ThemeShell";
import "./globals.css";

const display = Baloo_2({ subsets: ["latin"], variable: "--font-display" });
const ui = Inter({ subsets: ["latin"], variable: "--font-ui" });

export const metadata: Metadata = {
  title: "ChipCircle — Social Casino",
  description:
    "Free social casino. Craps with real physics dice and real odds — more games on the way.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${ui.variable} antialiased`}>
        <ThemeShell>{children}</ThemeShell>
      </body>
    </html>
  );
}
