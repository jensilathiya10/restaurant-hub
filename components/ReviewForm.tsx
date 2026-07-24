"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className={n <= value ? "text-amber-400" : "text-neutral-300"}>★</button>
      ))}
    </div>
  );
}

export default function ReviewForm({ customerId }: { customerId: string }) {
  const [food, setFood] = useState(5);
  const [service, setService] = useState(5);
  const [wait, setWait] = useState(5);
  const [clean, setClean] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function submit() {
    setSaving(true);
    await fetch("/api/reviews", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, foodRating: food, serviceRating: service, waitRating: wait, cleanRating: clean, comment }),
    });
    setSaving(false);
    setDone(true);
    router.refresh();
  }

  if (done) return <p className="text-sm text-emerald-600">Thanks for your feedback! ⭐</p>;

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between"><span>Food</span><Stars value={food} onChange={setFood} /></div>
      <div className="flex items-center justify-between"><span>Service</span><Stars value={service} onChange={setService} /></div>
      <div className="flex items-center justify-between"><span>Wait time</span><Stars value={wait} onChange={setWait} /></div>
      <div className="flex items-center justify-between"><span>Cleanliness</span><Stars value={clean} onChange={setClean} /></div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell us more…" className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
      <button disabled={saving} onClick={submit} className="bg-[var(--brand)] text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
        {saving ? "Sending…" : "Submit Review"}
      </button>
    </div>
  );
}
