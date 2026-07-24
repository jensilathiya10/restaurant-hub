"use client";
import { useState } from "react";

export default function ShiftSimulator({ initial }: { initial: { waiterCount: number; expectedOrdersPerHour: number; expectedWaitMinutes: number } }) {
  const [count, setCount] = useState(initial.waiterCount);
  const [result, setResult] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function simulate(n: number) {
    setCount(n);
    setLoading(true);
    const res = await fetch(`/api/ai/simulate?waiters=${n}`);
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-xl border p-4">
      <h3 className="font-semibold text-sm mb-1">Shift Simulator</h3>
      <p className="text-xs text-neutral-400 mb-4">&quot;If I schedule fewer waiters, what happens to wait time?&quot;</p>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => simulate(Math.max(1, count - 1))} className="w-8 h-8 rounded-full border">-</button>
        <div className="text-center">
          <div className="text-2xl font-bold">{count}</div>
          <div className="text-[10px] text-neutral-400">Waiters</div>
        </div>
        <button onClick={() => simulate(count + 1)} className="w-8 h-8 rounded-full border">+</button>
      </div>
      <div className={`grid grid-cols-2 gap-3 ${loading ? "opacity-50" : ""}`}>
        <div className="bg-neutral-50 rounded-lg p-3">
          <div className="text-xs text-neutral-500">Expected Orders/hr</div>
          <div className="text-lg font-bold">{result.expectedOrdersPerHour}</div>
        </div>
        <div className="bg-neutral-50 rounded-lg p-3">
          <div className="text-xs text-neutral-500">Expected Wait</div>
          <div className="text-lg font-bold">{result.expectedWaitMinutes} min</div>
        </div>
      </div>
      <p className="text-xs text-neutral-400 mt-3">
        Recommendation: {result.expectedWaitMinutes > 12 ? "Add another waiter to reduce wait times." : "Current staffing looks sufficient."}
      </p>
    </div>
  );
}
