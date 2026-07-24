"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmtTime, fmtDate, cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  BOOKED: "bg-blue-100 text-blue-700", SEATED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700", COMPLETED: "bg-neutral-200 text-neutral-600", NO_SHOW: "bg-amber-100 text-amber-700",
};

export default function ReservationManager({ reservations, tables }: { reservations: any[]; tables: any[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ guestName: "", guestPhone: "", partySize: "2", time: "", tableId: "" });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.guestName || !form.time) return;
    setSaving(true);
    await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, partySize: Number(form.partySize), time: new Date(form.time).toISOString(), tableId: form.tableId || null }),
    });
    setSaving(false);
    setForm({ guestName: "", guestPhone: "", partySize: "2", time: "", tableId: "" });
    router.refresh();
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/reservations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    router.refresh();
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-2">
        {reservations.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">{r.guestName} · {r.partySize} guests</div>
              <div className="text-xs text-neutral-400">{fmtDate(r.time)} at {fmtTime(r.time)} {r.tableNumber ? `· Table ${r.tableNumber}` : ""} {r.guestPhone && `· ${r.guestPhone}`}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", STATUS_COLOR[r.status])}>{r.status}</span>
              {r.status === "BOOKED" && (
                <>
                  <button onClick={() => setStatus(r.id, "SEATED")} className="text-xs border rounded-md px-2 py-1 hover:bg-neutral-50">Seat</button>
                  <button onClick={() => setStatus(r.id, "CANCELLED")} className="text-xs text-red-500 px-2 py-1">Cancel</button>
                </>
              )}
            </div>
          </div>
        ))}
        {reservations.length === 0 && <p className="text-sm text-neutral-400">No reservations yet.</p>}
      </div>
      <div className="bg-white rounded-xl border border-neutral-200 p-4 h-fit">
        <h3 className="font-semibold text-sm mb-3">Book a Table</h3>
        <div className="space-y-2">
          <input placeholder="Guest name" value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
          <input placeholder="Phone" value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
          <div className="flex gap-2">
            <input type="number" placeholder="Party size" value={form.partySize} onChange={(e) => setForm({ ...form, partySize: e.target.value })} className="w-1/2 border rounded-lg px-3 py-1.5 text-sm" />
            <select value={form.tableId} onChange={(e) => setForm({ ...form, tableId: e.target.value })} className="w-1/2 border rounded-lg px-3 py-1.5 text-sm">
              <option value="">Any table</option>
              {tables.map((t) => <option key={t.id} value={t.id}>Table {t.number}</option>)}
            </select>
          </div>
          <input type="datetime-local" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
          <button disabled={saving} onClick={submit} className="w-full bg-[var(--brand)] text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
            {saving ? "Booking…" : "Book Table"}
          </button>
        </div>
      </div>
    </div>
  );
}
