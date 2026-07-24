"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/utils";
import { Icons } from "./Icon";

export default function RecipeCostManager({ menuItems, inventory, recipes }: { menuItems: any[]; inventory: any[]; recipes: Record<string, any> }) {
  const router = useRouter();
  const [selected, setSelected] = useState(menuItems[0]?.id || "");
  const [lines, setLines] = useState<{ inventoryItemId: string; quantity: number }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const r = recipes[selected];
    setLines(r ? r.lines.map((l: any) => ({ inventoryItemId: inventory.find((i) => i.name === l.name)?.id, quantity: l.quantity })) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const item = menuItems.find((m) => m.id === selected);
  const cost = lines.reduce((s, l) => {
    const inv = inventory.find((i) => i.id === l.inventoryItemId);
    return s + (inv ? inv.costPerUnit * l.quantity : 0);
  }, 0);
  const profit = (item?.price || 0) - cost;

  function addLine() {
    setLines([...lines, { inventoryItemId: inventory[0]?.id, quantity: 0.1 }]);
  }
  function updateLine(i: number, field: string, value: any) {
    const copy = [...lines];
    (copy[i] as any)[field] = value;
    setLines(copy);
  }
  function removeLine(i: number) {
    setLines(lines.filter((_, idx) => idx !== i));
  }
  async function save() {
    setSaving(true);
    await fetch("/api/recipe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ menuItemId: selected, lines }) });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-xl border p-4">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mb-4">
          {menuItems.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <div className="space-y-2 mb-3">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <select value={l.inventoryItemId} onChange={(e) => updateLine(i, "inventoryItemId", e.target.value)} className="flex-1 border rounded-lg px-2 py-1.5 text-sm">
                {inventory.map((inv) => <option key={inv.id} value={inv.id}>{inv.name} (€{inv.costPerUnit}/{inv.unit})</option>)}
              </select>
              <input type="number" step="0.01" value={l.quantity} onChange={(e) => updateLine(i, "quantity", Number(e.target.value))} className="w-24 border rounded-lg px-2 py-1.5 text-sm" />
              <button onClick={() => removeLine(i)} className="text-neutral-400 hover:text-red-500"><Icons.trash size={15} /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={addLine} className="text-xs border rounded-md px-3 py-1.5">+ Add Ingredient</button>
          <button disabled={saving} onClick={save} className="text-xs bg-[var(--brand)] text-white rounded-md px-3 py-1.5 disabled:opacity-50">{saving ? "Saving…" : "Save Recipe"}</button>
        </div>
      </div>
      <div className="bg-white rounded-xl border p-4 h-fit">
        <h3 className="font-semibold text-sm mb-3">{item?.name}</h3>
        <div className="text-sm space-y-1.5">
          <div className="flex justify-between"><span className="text-neutral-500">Total Cost</span><span className="font-semibold">{money(cost)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Selling Price</span><span className="font-semibold">{money(item?.price || 0)}</span></div>
          <div className="flex justify-between border-t pt-1.5"><span className="text-neutral-500">Profit</span><span className={`font-bold ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{money(profit)}</span></div>
          <div className="flex justify-between text-xs text-neutral-400"><span>Margin</span><span>{item?.price ? Math.round((profit / item.price) * 100) : 0}%</span></div>
        </div>
      </div>
    </div>
  );
}
