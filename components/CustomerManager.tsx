"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerManager({ customers }: { customers: any[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);

  async function addCustomer() {
    if (!form.name) return;
    setSaving(true);
    await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setForm({ name: "", phone: "", email: "" });
    router.refresh();
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3">
        {customers.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">{c.name}</h3>
              <span className="text-[10px] bg-[var(--brand)]/10 text-[var(--brand)] px-2 py-0.5 rounded-full font-medium">{c.loyaltyPoints} pts</span>
            </div>
            <div className="text-xs text-neutral-500 space-y-0.5">
              {c.phone && <div>📞 {c.phone}</div>}
              {c.email && <div>✉️ {c.email}</div>}
              <div>🔁 Visited {c.visits} times</div>
              {c.favoriteFood && <div>❤️ Favorite: {c.favoriteFood}</div>}
              {c.allergy && <div className="text-red-500">⚠️ Allergy: {c.allergy}</div>}
              {c.birthday && <div>🎂 {c.birthday}</div>}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-neutral-200 p-4 h-fit">
        <h3 className="font-semibold text-sm mb-3">Add Customer</h3>
        <div className="space-y-2">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
          <button disabled={saving} onClick={addCustomer} className="w-full bg-[var(--brand)] text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
            {saving ? "Adding…" : "Add Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}
