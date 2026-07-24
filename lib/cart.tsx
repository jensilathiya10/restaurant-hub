"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type CartLine = { menuItemId: string; name: string; price: number; quantity: number };
type CartState = {
  restaurantSlug: string;
  lines: CartLine[];
  add: (item: { id: string; name: string; price: number }) => void;
  remove: (menuItemId: string) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ restaurantSlug, children }: { restaurantSlug: string; children: React.ReactNode }) {
  const storageKey = `rh_cart_${restaurantSlug}`;
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {}
  }, [lines, storageKey]);

  function add(item: { id: string; name: string; price: number }) {
    setLines((prev) => {
      const existing = prev.find((l) => l.menuItemId === item.id);
      if (existing) return prev.map((l) => (l.menuItemId === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  }
  function remove(menuItemId: string) {
    setLines((prev) => prev.map((l) => (l.menuItemId === menuItemId ? { ...l, quantity: l.quantity - 1 } : l)).filter((l) => l.quantity > 0));
  }
  function clear() {
    setLines([]);
  }

  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const count = lines.reduce((s, l) => s + l.quantity, 0);

  return <CartContext.Provider value={{ restaurantSlug, lines, add, remove, clear, total, count }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
