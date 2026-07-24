"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = ["MANAGER", "CASHIER", "WAITER", "CHEF"];

export default function EmployeeManager({ employees, performance }: { employees: any[]; performance: any[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", position: "Waiter", hourlyRate: "15", role: "WAITER" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function addEmployee() {
    if (!form.name || !form.email) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, hourlyRate: Number(form.hourlyRate) }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setForm({ name: "", email: "", position: "Waiter", hourlyRate: "15", role: "WAITER" });
    router.refresh();
  }

  const perfMap: Record<string, any> = {};
  for (const p of performance) perfMap[p.name] = p;

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Position</th>
              <th className="text-left px-4 py-2 font-medium">Rate</th>
              <th className="text-left px-4 py-2 font-medium">Orders Served</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-t border-neutral-100">
                <td className="px-4 py-2 font-medium">{e.name}<div className="text-xs text-neutral-400">{e.email}</div></td>
                <td className="px-4 py-2">{e.position}</td>
                <td className="px-4 py-2">€{e.hourlyRate.toFixed(2)}/hr</td>
                <td className="px-4 py-2">{perfMap[e.name]?.ordersServed ?? 0}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${e.active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-500"}`}>
                    {e.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white rounded-xl border border-neutral-200 p-4 h-fit">
        <h3 className="font-semibold text-sm mb-3">Add Employee</h3>
        <div className="space-y-2">
          <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
          <input placeholder="Position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
          <div className="flex gap-2">
            <input placeholder="Hourly rate" type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} className="w-1/2 border rounded-lg px-3 py-1.5 text-sm" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-1/2 border rounded-lg px-3 py-1.5 text-sm">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button disabled={saving} onClick={addEmployee} className="w-full bg-[var(--brand)] text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
            {saving ? "Adding…" : "Add Employee"}
          </button>
          <p className="text-[11px] text-neutral-400">Default password: <code>password</code></p>
        </div>
      </div>
    </div>
  );
}
