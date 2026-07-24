"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SchedulingManager({ schedules, employees }: { schedules: any[]; employees: any[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ employeeId: employees[0]?.id || "", dayOfWeek: "1", startTime: "09:00", endTime: "17:00" });
  const [saving, setSaving] = useState(false);

  async function addShift() {
    if (!form.employeeId) return;
    setSaving(true);
    await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dayOfWeek: Number(form.dayOfWeek) }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3">
        {DAYS.map((day, idx) => (
          <div key={day} className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="font-semibold text-sm mb-2">{day}</h3>
            <div className="space-y-1.5">
              {schedules.filter((s) => s.dayOfWeek === idx).map((s) => (
                <div key={s.id} className="text-xs bg-neutral-50 rounded-md px-2 py-1.5 flex justify-between">
                  <span className="font-medium">{s.employeeName}</span>
                  <span className="text-neutral-500">{s.startTime}–{s.endTime}</span>
                </div>
              ))}
              {schedules.filter((s) => s.dayOfWeek === idx).length === 0 && <p className="text-xs text-neutral-300">No shifts</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-neutral-200 p-4 h-fit">
        <h3 className="font-semibold text-sm mb-3">Add Shift</h3>
        <div className="space-y-2">
          <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm">
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm">
            {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
          <div className="flex gap-2">
            <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-1/2 border rounded-lg px-3 py-1.5 text-sm" />
            <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-1/2 border rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <button disabled={saving} onClick={addShift} className="w-full bg-[var(--brand)] text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
            {saving ? "Adding…" : "Add Shift"}
          </button>
        </div>
      </div>
    </div>
  );
}
