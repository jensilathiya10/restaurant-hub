"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/utils";
import { Icons } from "./Icon";

export default function CartView({ restaurantSlug, taxRate }: { restaurantSlug: string; taxRate: number }) {
  const { lines, add, remove, total, clear } = useCart();
  const [type, setType] = useState("DINE_IN");
  const [tableNumber, setTableNumber] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const router = useRouter();

  const tax = total * taxRate;
  const grandTotal = total + tax;

  async function placeOrder() {
    if (!lines.length) return;
    setPlacing(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantSlug, type,
        notes: name ? `Guest: ${name}${phone ? " / " + phone : ""}${tableNumber ? " / Table " + tableNumber : ""}` : undefined,
        items: lines.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity, price: l.price })),
      }),
    });
    const data = await res.json();
    setPlacing(false);
    if (data.ok) {
      clear();
      setPlacedOrderId(data.orderId);
      router.push(`/track/${data.orderId}`);
    }
  }

  if (lines.length === 0 && !placedOrderId) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-neutral-400">Your cart is empty.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      <h1 className="text-xl font-bold mb-4">Your Order</h1>
      <div className="bg-white rounded-xl border divide-y mb-4">
        {lines.map((l) => (
          <div key={l.menuItemId} className="flex items-center justify-between p-3">
            <div>
              <div className="font-medium text-sm">{l.name}</div>
              <div className="text-xs text-neutral-400">{money(l.price)} each</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => remove(l.menuItemId)} className="w-7 h-7 rounded-full border flex items-center justify-center"><Icons.minus size={13} /></button>
              <span className="w-4 text-center text-sm">{l.quantity}</span>
              <button onClick={() => add({ id: l.menuItemId, name: l.name, price: l.price })} className="w-7 h-7 rounded-full border flex items-center justify-center"><Icons.plus size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-4 mb-4 space-y-3">
        <div className="flex gap-2">
          {["DINE_IN", "TAKEAWAY", "DELIVERY"].map((t) => (
            <button key={t} onClick={() => setType(t)} className={`text-xs px-3 py-1.5 rounded-full border ${type === t ? "bg-[var(--brand)] text-white border-[var(--brand)]" : "border-neutral-300"}`}>
              {t.replace("_", " ")}
            </button>
          ))}
        </div>
        {type === "DINE_IN" && (
          <input placeholder="Table number" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
        )}
        <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>

      <div className="bg-white rounded-xl border p-4 mb-4 text-sm space-y-1">
        <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{money(total)}</span></div>
        <div className="flex justify-between"><span className="text-neutral-500">Tax</span><span>{money(tax)}</span></div>
        <div className="flex justify-between font-bold text-base border-t pt-1.5"><span>Total</span><span>{money(grandTotal)}</span></div>
      </div>

      <button disabled={placing} onClick={placeOrder} className="w-full bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold rounded-xl py-3 disabled:opacity-50">
        {placing ? "Placing order…" : "Place Order"}
      </button>
    </div>
  );
}
