import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
});

const displayFont = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "StudioBoard — панель студии",
  description:
    "Админ-панель StudioBoard: метрики, выручка и заказы студии Aigerim Kabaeva, AI Creator в Алматы",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
