"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsForm({ restaurant }: { restaurant: any }) {
  const [form, setForm] = useState({
    name: restaurant.name, address: restaurant.address || "", taxRate: restaurant.taxRate,
    openingHours: restaurant.openingHours || "", currency: restaurant.currency,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, taxRate: Number(form.taxRate) }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-white rounded-xl border p-4 max-w-lg space-y-3">
      <div>
        <label className="text-xs text-neutral-500">Restaurant Name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm mt-1" />
      </div>
      <div>
        <label className="text-xs text-neutral-500">Address</label>
        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-neutral-500">Tax Rate (0-1)</label>
          <input type="number" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Currency</label>
          <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm mt-1">
            <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-neutral-500">Opening Hours</label>
        <input value={form.openingHours} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm mt-1" />
      </div>
      <button disabled={saving} onClick={save} className="bg-[var(--brand)] text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
      </button>
    </div>
  );
}
