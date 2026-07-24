"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { Icons } from "./Icon";

const LANGS = ["English", "Deutsch", "Français", "Español"];

export default function CustomerNav({ restaurantName, restaurantSlug, tableLabel }: { restaurantName: string; restaurantSlug: string; tableLabel: string }) {
  const { count } = useCart();
  const [lang, setLang] = useState("English");
  const [calling, setCalling] = useState(false);

  async function callWaiter() {
    setCalling(true);
    await fetch("/api/call-waiter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restaurantSlug, tableLabel }) });
    setTimeout(() => setCalling(false), 2500);
  }

  return (
    <div className="sticky top-0 z-30 bg-[var(--ink)] text-white shadow-lg">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={`/menu?r=${restaurantSlug}`} className="font-display font-semibold text-base tracking-tight">{restaurantName}</Link>
        <div className="flex items-center gap-3">
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-white/10 text-xs rounded-full px-2 py-1 border border-white/20">
            {LANGS.map((l) => <option key={l} value={l} className="text-black">{l}</option>)}
          </select>
          <button onClick={callWaiter} disabled={calling} className="text-xs bg-white/10 border border-white/20 rounded-full px-2.5 py-1 hover:bg-white/20 transition-colors">
            {calling ? "Waiter notified ✓" : "🔔 Call Waiter"}
          </button>
          <Link href={`/reserve?r=${restaurantSlug}`} className="text-xs hidden sm:flex items-center gap-1"><Icons.reservations size={14} /> Reserve</Link>
          <Link href="/account" className="text-xs flex items-center gap-1"><Icons.customers size={14} /></Link>
          <Link href={`/cart?r=${restaurantSlug}`} className="relative text-xs flex items-center gap-1 bg-gradient-to-r from-[var(--brand)] to-[var(--brand-light)] rounded-full px-2.5 py-1 shadow-md">
            <Icons.orders size={14} />
            {count > 0 && <span className="absolute -top-1.5 -right-1.5 bg-white text-[var(--brand)] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{count}</span>}
          </Link>
        </div>
      </div>
    </div>
  );
}
