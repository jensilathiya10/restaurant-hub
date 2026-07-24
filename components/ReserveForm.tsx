"use client";
import { useState } from "react";

export default function ReserveForm({ restaurantSlug }: { restaurantSlug: string }) {
  const [form, setForm] = useState({ guestName: "", guestPhone: "", partySize: "2", time: "" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!form.guestName || !form.time) return;
    setSaving(true);
    await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, partySize: Number(form.partySize), time: new Date(form.time).toISOString(), restaurantSlug }),
    });
    setSaving(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h1 className="text-xl font-bold mb-1">Reservation Requested</h1>
        <p className="text-sm text-neutral-500">We&apos;ll send a confirmation shortly. See you soon, {form.guestName}!</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-1">Reserve a Table</h1>
      <p className="text-sm text-neutral-400 mb-5">No app needed — just fill in your details.</p>
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <input placeholder="Your name" value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Phone" value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
        <input type="number" placeholder="Party size" value={form.partySize} onChange={(e) => setForm({ ...form, partySize: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
        <input type="datetime-local" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
        <button disabled={saving} onClick={submit} className="w-full bg-[var(--brand)] text-white rounded-xl py-3 font-semibold disabled:opacity-50">
          {saving ? "Booking…" : "Book Table"}
        </button>
      </div>
    </div>
  );
}
