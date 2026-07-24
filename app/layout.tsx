import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Bella Vista — RestaurantHub",
  description: "Multi-tenant restaurant management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-full flex flex-col bg-[var(--surface)] text-[var(--ink)] antialiased">
        {children}
      </body>
    </html>
  );
}
