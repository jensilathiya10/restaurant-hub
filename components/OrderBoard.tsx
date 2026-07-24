"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { money, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Icons } from "./Icon";

const STATUS_FLOW = ["PENDING", "PREPARING", "READY", "SERVED", "COMPLETED"];
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", PREPARING: "Preparing", READY: "Ready", SERVED: "Served", COMPLETED: "Completed", CANCELLED: "Cancelled",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-neutral-200 text-neutral-700",
  PREPARING: "bg-amber-100 text-amber-700",
  READY: "bg-blue-100 text-blue-700",
  SERVED: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

type Table = { id: string; number: number; status: string };
type EditForm = { tableId: string; notes: string; items: { id: string; name: string; quantity: number }[] };

export default function OrderBoard({ initialOrders, tables = [] }: { initialOrders: any[]; tables?: Table[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const es = new EventSource("/api/orders/stream");
    es.onmessage = () => {
      fetch("/api/orders").then((r) => r.json()).then((d) => setOrders(d.orders));
    };
    return () => es.close();
  }, []);

  async function advance(orderId: string, status: string) {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function pay(orderId: string, method: string) {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pay: { method, tip: 0 } }),
    });
    router.refresh();
  }

  function startEdit(order: any) {
    setEditingId(order.id);
    setEditForm({
      tableId: order.tableId || "",
      notes: order.notes || "",
      items: order.items.map((it: any) => ({ id: it.id, name: it.name, quantity: it.quantity })),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  function setItemQty(itemId: string, quantity: number) {
    if (!editForm) return;
    setEditForm({ ...editForm, items: editForm.items.map((it) => (it.id === itemId ? { ...it, quantity: Math.max(0, quantity) } : it)) });
  }

  async function saveEdit(orderId: string) {
    if (!editForm) return;
    setSavingEdit(true);
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        edit: {
          tableId: editForm.tableId || null,
          notes: editForm.notes,
          items: editForm.items.map((it) => ({ id: it.id, quantity: it.quantity })),
        },
      }),
    });
    setSavingEdit(false);
    setEditingId(null);
    setEditForm(null);
    router.refresh();
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {orders.map((o) => {
        const nextIdx = STATUS_FLOW.indexOf(o.status) + 1;
        const next = STATUS_FLOW[nextIdx];
        const isEditing = editingId === o.id;
        return (
          <div key={o.id} className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">
                {o.tableNumber ? `Table ${o.tableNumber}` : o.type.replace("_", " ")}
              </div>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", STATUS_COLOR[o.status])}>
                {STATUS_LABEL[o.status]}
              </span>
            </div>

            {isEditing && editForm ? (
              <div className="space-y-2 mb-3">
                <label className="text-[11px] font-medium text-neutral-500">Table</label>
                <select
                  value={editForm.tableId}
                  onChange={(e) => setEditForm({ ...editForm, tableId: e.target.value })}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                >
                  <option value="">No table (takeaway/delivery)</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Table {t.number} — {t.status[0] + t.status.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
                <div className="space-y-1">
                  {editForm.items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between text-sm">
                      <span className={cn(it.quantity === 0 && "line-through text-neutral-300")}>{it.name}</span>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setItemQty(it.id, it.quantity - 1)} className="w-6 h-6 rounded border flex items-center justify-center"><Icons.minus size={11} /></button>
                        <span className="w-4 text-center text-xs">{it.quantity}</span>
                        <button onClick={() => setItemQty(it.id, it.quantity + 1)} className="w-6 h-6 rounded border flex items-center justify-center"><Icons.plus size={11} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Notes"
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={cancelEdit} className="text-xs px-3 py-1.5 rounded-lg border text-neutral-500">Cancel</button>
                  <button
                    disabled={savingEdit}
                    onClick={() => saveEdit(o.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white font-medium disabled:opacity-50"
                  >
                    {savingEdit ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <ul className="text-sm text-neutral-600 space-y-0.5 mb-2">
                  {o.items.map((it: any) => (
                    <li key={it.id}>{it.quantity}x {it.name}</li>
                  ))}
                </ul>
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
                  <span>{timeAgo(o.createdAt)}</span>
                  <span className="font-semibold text-neutral-700">{money(o.total)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {next && o.status !== "CANCELLED" && (
                    <button
                      onClick={() => advance(o.id, next)}
                      className="text-xs bg-[var(--brand)] text-white rounded-md px-2.5 py-1.5 hover:bg-[var(--brand-dark)]"
                    >
                      Mark {STATUS_LABEL[next]}
                    </button>
                  )}
                  {o.paymentStatus !== "PAID" && o.status !== "CANCELLED" && (
                    <>
                      <button onClick={() => pay(o.id, "CASH")} className="text-xs border rounded-md px-2.5 py-1.5 hover:bg-neutral-50">Cash</button>
                      <button onClick={() => pay(o.id, "CARD")} className="text-xs border rounded-md px-2.5 py-1.5 hover:bg-neutral-50">Card</button>
                    </>
                  )}
                  {o.paymentStatus === "PAID" && <span className="text-xs text-emerald-600 font-medium px-1 py-1.5">Paid</span>}
                  {o.status !== "CANCELLED" && (
                    <button onClick={() => startEdit(o)} className="text-xs border rounded-md px-2 py-1.5 hover:bg-neutral-50 flex items-center gap-1">
                      <Icons.edit size={12} /> Edit
                    </button>
                  )}
                  {o.status !== "CANCELLED" && o.status !== "COMPLETED" && (
                    <button onClick={() => advance(o.id, "CANCELLED")} className="text-xs text-red-500 px-2.5 py-1.5 hover:bg-red-50 rounded-md">Cancel</button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
      {orders.length === 0 && <p className="text-neutral-400 text-sm col-span-full">No orders yet.</p>}
    </div>
  );
}
