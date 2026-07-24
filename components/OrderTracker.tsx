"use client";
import { useEffect, useState } from "react";
import { money } from "@/lib/utils";

const STEPS = ["PENDING", "PREPARING", "READY", "SERVED", "COMPLETED"];
const LABEL: Record<string, string> = { PENDING: "Order Received", PREPARING: "Preparing", READY: "Ready", SERVED: "Served", COMPLETED: "Completed" };

export default function OrderTracker({ orderId, initial }: { orderId: string; initial: any }) {
  const [order, setOrder] = useState(initial);

  useEffect(() => {
    const es = new EventSource("/api/orders/stream");
    es.onmessage = () => {
      fetch(`/api/orders/${orderId}`).then((r) => r.json()).then((d) => d.order && setOrder(d.order));
    };
    return () => es.close();
  }, [orderId]);

  const idx = STEPS.indexOf(order.status);

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-1">Order Status</h1>
      <p className="text-sm text-neutral-400 mb-6">Order #{orderId.slice(-6).toUpperCase()}</p>

      <div className="space-y-0 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i <= idx ? "bg-[var(--brand)] text-white" : "bg-neutral-200 text-neutral-400"}`}>
                {i <= idx ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-0.5 h-8 ${i < idx ? "bg-[var(--brand)]" : "bg-neutral-200"}`} />}
            </div>
            <span className={`text-sm ${i <= idx ? "font-semibold" : "text-neutral-400"}`}>{LABEL[s]}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-sm mb-2">Items</h3>
        <ul className="text-sm space-y-1 mb-3">
          {order.items?.map((it: any) => <li key={it.id} className="flex justify-between"><span>{it.quantity}x {it.name}</span><span>{money(it.price * it.quantity)}</span></li>)}
        </ul>
        <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>{money(order.total)}</span></div>
      </div>
    </div>
  );
}
