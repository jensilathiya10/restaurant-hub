"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/utils";
import { Icons } from "./Icon";

export default function NewOrderForm({ menuItems, tables }: { menuItems: any[]; tables: any[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("DINE_IN");
  const [tableId, setTableId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const cartItems = Object.entries(cart).filter(([, q]) => q > 0);
  const subtotal = cartItems.reduce((s, [id, q]) => {
    const item = menuItems.find((m) => m.id === id);
    return s + (item ? item.price * q : 0);
  }, 0);

  function add(id: string) {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  }
  function remove(id: string) {
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) }));
  }

  async function submit() {
    if (!cartItems.length) return;
    setSaving(true);
    const items = cartItems.map(([menuItemId, quantity]) => {
      const item = menuItems.find((m) => m.id === menuItemId);
      return { menuItemId, quantity, price: item.price };
    });
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, tableId: tableId || null, items, discountPercent: discount }),
    });
    setSaving(false);
    setCart({});
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-medium rounded-lg px-4 py-2 flex items-center gap-1.5"
      >
        <Icons.plus size={16} /> New Order
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">New Order</h2>
          <button onClick={() => setOpen(false)}><Icons.close size={18} /></button>
        </div>
        <div className="p-4 grid md:grid-cols-2 gap-4 overflow-y-auto flex-1">
          <div>
            <div className="flex gap-2 mb-3">
              {["DINE_IN", "TAKEAWAY", "DELIVERY"].map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`text-xs px-3 py-1.5 rounded-full border ${type === t ? "bg-[var(--brand)] text-white border-[var(--brand)]" : "border-neutral-300"}`}
                >
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
            {type === "DINE_IN" && (
              <div className="mb-3">
                <select value={tableId} onChange={(e) => setTableId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select table…</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Table {t.number} ({t.seats} seats) — {t.status[0] + t.status.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
                {tableId && tables.find((t) => t.id === tableId)?.status === "OCCUPIED" && (
                  <p className="text-xs text-amber-600 mt-1">
                    This table is already occupied — placing this order adds another round alongside any order(s) already there.
                  </p>
                )}
              </div>
            )}
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {menuItems.filter((m) => m.available).map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-neutral-400">{money(m.price)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => remove(m.id)} className="w-6 h-6 rounded-full border flex items-center justify-center"><Icons.minus size={12} /></button>
                    <span className="w-4 text-center">{cart[m.id] || 0}</span>
                    <button onClick={() => add(m.id)} className="w-6 h-6 rounded-full border flex items-center justify-center"><Icons.plus size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-sm mb-2">Order Summary</h3>
            {cartItems.length === 0 && <p className="text-sm text-neutral-400">No items yet.</p>}
            <ul className="text-sm space-y-1 mb-3">
              {cartItems.map(([id, q]) => {
                const item = menuItems.find((m) => m.id === id);
                return <li key={id} className="flex justify-between"><span>{q}x {item?.name}</span><span>{money((item?.price || 0) * q)}</span></li>;
              })}
            </ul>
            <label className="text-xs text-neutral-500">Discount %</label>
            <input
              type="number" min={0} max={100} value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-1.5 text-sm mb-3"
            />
            <div className="text-sm font-semibold flex justify-between border-t pt-2">
              <span>Subtotal</span><span>{money(subtotal)}</span>
            </div>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="text-sm px-4 py-2 rounded-lg border">Cancel</button>
          <button disabled={saving || !cartItems.length} onClick={submit} className="text-sm px-4 py-2 rounded-lg bg-[var(--brand)] text-white disabled:opacity-50">
            {saving ? "Placing…" : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
