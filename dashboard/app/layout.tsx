import type { Metadata } from "next";
import { DM_Serif_Display, JetBrains_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

const display = DM_Serif_Display({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-display",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const sans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Orders Dashboard",
  description: "RetailCRM → Supabase order analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${mono.variable} ${sans.variable}`}>
      <body className="bg-surface text-white antialiased">{children}</body>
    </html>
  );
}
