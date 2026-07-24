"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icons } from "./Icon";

type InventoryItem = { id: string; name: string; unit: string; quantity: number; lowStockAt: number; costPerUnit: number };
type EditForm = { name: string; unit: string; quantity: string; lowStockAt: string; costPerUnit: string };

export default function InventoryManager({ items }: { items: InventoryItem[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", unit: "kg", quantity: "", lowStockAt: "5", costPerUnit: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  async function adjust(id: string, change: number) {
    await fetch(`/api/inventory/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ change, reason: "manual" }) });
    router.refresh();
  }

  function startEdit(item: InventoryItem) {
    setEditingId(item.id);
    setEditForm({
      name: item.name, unit: item.unit,
      quantity: String(item.quantity), lowStockAt: String(item.lowStockAt), costPerUnit: String(item.costPerUnit),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function saveEdit(id: string) {
    if (!editForm) return;
    setSavingEdit(true);
    await fetch(`/api/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name, unit: editForm.unit,
        quantity: Number(editForm.quantity), lowStockAt: Number(editForm.lowStockAt), costPerUnit: Number(editForm.costPerUnit),
      }),
    });
    setSavingEdit(false);
    setEditingId(null);
    setEditForm(null);
    router.refresh();
  }

  async function addItem() {
    if (!form.name || !form.quantity) return;
    setSaving(true);
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quantity: Number(form.quantity), lowStockAt: Number(form.lowStockAt), costPerUnit: Number(form.costPerUnit || 0) }),
    });
    setSaving(false);
    setForm({ name: "", unit: "kg", quantity: "", lowStockAt: "5", costPerUnit: "" });
    router.refresh();
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Ingredient</th>
              <th className="text-left px-4 py-2 font-medium">Stock</th>
              <th className="text-left px-4 py-2 font-medium">Cost/Unit</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-right px-4 py-2 font-medium">Adjust</th>
              <th className="text-right px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const low = it.quantity <= it.lowStockAt;
              const isEditing = editingId === it.id;
              if (isEditing && editForm) {
                return (
                  <tr key={it.id} className="border-t border-neutral-100 bg-neutral-50">
                    <td className="px-4 py-2" colSpan={6}>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Name" className="border rounded-lg px-2 py-1.5 text-sm w-32"
                        />
                        <select
                          value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                          className="border rounded-lg px-2 py-1.5 text-sm"
                        >
                          <option value="kg">kg</option><option value="unit">unit</option><option value="L">L</option>
                        </select>
                        <input
                          value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                          type="number" placeholder="Qty" className="border rounded-lg px-2 py-1.5 text-sm w-20"
                        />
                        <input
                          value={editForm.lowStockAt} onChange={(e) => setEditForm({ ...editForm, lowStockAt: e.target.value })}
                          type="number" placeholder="Low stock at" className="border rounded-lg px-2 py-1.5 text-sm w-24"
                        />
                        <input
                          value={editForm.costPerUnit} onChange={(e) => setEditForm({ ...editForm, costPerUnit: e.target.value })}
                          type="number" placeholder="Cost/unit" className="border rounded-lg px-2 py-1.5 text-sm w-24"
                        />
                        <div className="ml-auto flex gap-2">
                          <button onClick={cancelEdit} className="text-xs px-3 py-1.5 rounded-lg border text-neutral-500">Cancel</button>
                          <button
                            disabled={savingEdit}
                            onClick={() => saveEdit(it.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white font-medium disabled:opacity-50"
                          >
                            {savingEdit ? "Saving…" : "Save"}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={it.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 font-medium">{it.name}</td>
                  <td className="px-4 py-2">{it.quantity.toFixed(1)} {it.unit}</td>
                  <td className="px-4 py-2">€{it.costPerUnit.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", low ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700")}>
                      {low ? "Low Stock" : "OK"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => adjust(it.id, -1)} className="border rounded px-2 py-1 text-xs mr-1">-1</button>
                    <button onClick={() => adjust(it.id, 1)} className="border rounded px-2 py-1 text-xs">+1</button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => startEdit(it)} className="text-neutral-400 hover:text-[var(--brand)]"><Icons.edit size={15} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-white rounded-xl border border-neutral-200 p-4 h-fit">
        <h3 className="font-semibold text-sm mb-3">Add Ingredient</h3>
        <div className="space-y-2">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
          <div className="flex gap-2">
            <input placeholder="Qty" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-1/2 border rounded-lg px-3 py-1.5 text-sm" />
            <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-1/2 border rounded-lg px-3 py-1.5 text-sm">
              <option value="kg">kg</option><option value="unit">unit</option><option value="L">L</option>
            </select>
          </div>
          <div className="flex gap-2">
            <input placeholder="Low stock at" type="number" value={form.lowStockAt} onChange={(e) => setForm({ ...form, lowStockAt: e.target.value })} className="w-1/2 border rounded-lg px-3 py-1.5 text-sm" />
            <input placeholder="Cost/unit" type="number" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} className="w-1/2 border rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <button disabled={saving} onClick={addItem} className="w-full bg-[var(--brand)] text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
            {saving ? "Adding…" : "Add Ingredient"}
          </button>
        </div>
      </div>
    </div>
  );
}
