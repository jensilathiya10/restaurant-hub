"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn, money, fmtTime } from "@/lib/utils";
import { Icons } from "./Icon";

const COLOR: Record<string, string> = {
  FREE: "bg-emerald-100 border-emerald-400 text-emerald-800",
  OCCUPIED: "bg-red-100 border-red-400 text-red-800",
  RESERVED: "bg-amber-100 border-amber-400 text-amber-800",
  CLEANING: "bg-blue-100 border-blue-400 text-blue-800",
};
const DOT: Record<string, string> = { FREE: "bg-emerald-500", OCCUPIED: "bg-red-500", RESERVED: "bg-amber-500", CLEANING: "bg-blue-500" };

export default function FloorPlan({ tables, ordersByTable, restaurantSlug }: { tables: any[]; ordersByTable: Record<string, any>; restaurantSlug: string }) {
  const [selected, setSelected] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ number: "", seats: "" });
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ number: "", seats: "4" });
  const router = useRouter();
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function setStatus(tableId: string, status: string) {
    await fetch(`/api/tables/${tableId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSelected(null);
    router.refresh();
  }

  function startEdit(table: any) {
    setEditing(true);
    setEditForm({ number: String(table.number), seats: String(table.seats) });
  }

  async function saveEdit() {
    await fetch(`/api/tables/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: Number(editForm.number), seats: Number(editForm.seats) }),
    });
    setEditing(false);
    setSelected(null);
    router.refresh();
  }

  async function removeTable(tableId: string) {
    if (!confirm("Delete this table? Any linked orders/reservations will be unlinked, not deleted.")) return;
    await fetch(`/api/tables/${tableId}`, { method: "DELETE" });
    setSelected(null);
    router.refresh();
  }

  async function addTable() {
    if (!addForm.number) return;
    const n = tables.length;
    await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: Number(addForm.number), seats: Number(addForm.seats) || 4,
        posX: (n % 5) * 110 + 10, posY: Math.floor(n / 5) * 100 + 10,
      }),
    });
    setAddForm({ number: "", seats: "4" });
    setAddOpen(false);
    router.refresh();
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-4 text-xs">
            {Object.entries(DOT).map(([k, c]) => (
              <span key={k} className="flex items-center gap-1.5"><span className={cn("w-2.5 h-2.5 rounded-full", c)} /> {k[0] + k.slice(1).toLowerCase()}</span>
            ))}
          </div>
          <button
            onClick={() => setAddOpen((v) => !v)}
            className="text-xs bg-[var(--brand)] text-white rounded-md px-3 py-1.5 font-medium"
          >
            + Add Table
          </button>
        </div>
        {addOpen && (
          <div className="flex flex-wrap items-end gap-2 mb-4 bg-neutral-50 border border-neutral-200 rounded-lg p-3">
            <div>
              <label className="block text-[11px] text-neutral-500 mb-1">Number</label>
              <input
                value={addForm.number} onChange={(e) => setAddForm({ ...addForm, number: e.target.value })}
                type="number" className="w-20 border rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-neutral-500 mb-1">Seats</label>
              <input
                value={addForm.seats} onChange={(e) => setAddForm({ ...addForm, seats: e.target.value })}
                type="number" className="w-20 border rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <button onClick={addTable} className="text-xs bg-neutral-800 text-white rounded-lg px-3 py-1.5 font-medium">Add</button>
            <button onClick={() => setAddOpen(false)} className="text-xs border rounded-lg px-3 py-1.5 text-neutral-500">Cancel</button>
          </div>
        )}
        <div className="relative bg-neutral-50 rounded-lg border border-dashed border-neutral-300" style={{ height: 460 }}>
          {tables.map((t) => (
            <button
              key={t.id}
              onClick={() => { setSelected(t); setEditing(false); }}
              style={{ left: t.posX, top: t.posY }}
              className={cn(
                "absolute w-24 h-20 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-semibold hover:scale-105 transition",
                COLOR[t.status]
              )}
            >
              <span className={cn("w-2 h-2 rounded-full mb-1", DOT[t.status])} />
              Table {t.number}
              <span className="font-normal opacity-70">{t.seats} seats</span>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        {!selected && <p className="text-sm text-neutral-400">Click a table to view details, change status, or transfer.</p>}
        {selected && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Table {selected.number}</h3>
              <div className="flex gap-2">
                <button onClick={() => startEdit(selected)} className="text-xs text-neutral-400 hover:text-[var(--brand)]">Edit</button>
                <button onClick={() => removeTable(selected.id)} className="text-xs text-neutral-400 hover:text-red-500">Delete</button>
              </div>
            </div>
            <p className="text-xs text-neutral-400 mb-3">{selected.seats} seats · {selected.status}</p>

            {editing ? (
              <div className="flex flex-wrap items-end gap-2 mb-4 bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">Number</label>
                  <input
                    value={editForm.number} onChange={(e) => setEditForm({ ...editForm, number: e.target.value })}
                    type="number" className="w-20 border rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">Seats</label>
                  <input
                    value={editForm.seats} onChange={(e) => setEditForm({ ...editForm, seats: e.target.value })}
                    type="number" className="w-20 border rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
                <button onClick={saveEdit} className="text-xs bg-[var(--brand)] text-white rounded-lg px-3 py-1.5 font-medium">Save</button>
                <button onClick={() => setEditing(false)} className="text-xs border rounded-lg px-3 py-1.5 text-neutral-500">Cancel</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {Object.keys(COLOR).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(selected.id, s)}
                    className={cn("text-xs rounded-md px-2 py-1.5 border", selected.status === s ? COLOR[s] : "border-neutral-200")}
                  >
                    {s[0] + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            )}
            <div className="mb-4 flex items-center gap-3">
              <img src={`/api/qr?text=${encodeURIComponent(`${origin}/menu?r=${restaurantSlug}&table=${selected.number}`)}`} alt="Table QR code" className="w-20 h-20 rounded border" />
              <div className="text-xs text-neutral-400">Scan to order from Table {selected.number} — no app needed.</div>
            </div>
            {ordersByTable[selected.id] ? (
              <div>
                <h4 className="text-xs font-medium text-neutral-500 mb-1">Current Order</h4>
                <ul className="text-sm space-y-0.5 mb-2">
                  {ordersByTable[selected.id].items.map((it: any) => (
                    <li key={it.id}>{it.quantity}x {it.name}</li>
                  ))}
                </ul>
                <div className="flex justify-between text-sm font-semibold border-t pt-2">
                  <span>Total</span><span>{money(ordersByTable[selected.id].total)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-400">No active order on this table.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
