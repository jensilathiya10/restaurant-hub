"use client";
import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function KitchenBoard({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);

  async function refresh() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data.orders.filter((o: any) => ["PENDING", "PREPARING", "READY"].includes(o.status)));
  }

  useEffect(() => {
    const es = new EventSource("/api/orders/stream");
    es.onmessage = () => refresh();
    const interval = setInterval(refresh, 15000);
    return () => {
      es.close();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function advance(orderId: string, status: string) {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  }

  const isDelayed = (o: any) => {
    const mins = (Date.now() - new Date(o.createdAt).getTime()) / 60000;
    const prep = Math.max(...o.items.map((i: any) => i.prepMinutes || 10), 10);
    return o.status === "PREPARING" && mins > prep;
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {orders.map((o) => {
        const delayed = isDelayed(o);
        return (
          <div
            key={o.id}
            className={cn(
              "rounded-xl border-2 p-4 bg-white",
              delayed ? "border-red-400" : o.status === "READY" ? "border-blue-300" : "border-neutral-200"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-lg">{o.tableNumber ? `Table ${o.tableNumber}` : o.type.replace("_", " ")}</div>
              {delayed && <span className="text-[10px] font-bold text-red-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 pulse-dot" /> DELAYED</span>}
            </div>
            <ul className="text-sm mb-3 space-y-0.5">
              {o.items.map((it: any) => (
                <li key={it.id} className="font-medium">{it.quantity}x {it.name}</li>
              ))}
            </ul>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
              <span>Time: {new Date(o.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
              <span>{timeAgo(o.createdAt)}</span>
            </div>
            <div className="flex gap-2">
              {o.status === "PENDING" && (
                <button onClick={() => advance(o.id, "PREPARING")} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg py-2">Start</button>
              )}
              {o.status === "PREPARING" && (
                <button onClick={() => advance(o.id, "READY")} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg py-2">Ready</button>
              )}
              {o.status === "READY" && (
                <button onClick={() => advance(o.id, "SERVED")} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg py-2">Served</button>
              )}
            </div>
          </div>
        );
      })}
      {orders.length === 0 && <p className="text-neutral-400 col-span-full text-center py-20">No active orders. Kitchen is clear 🎉</p>}
    </div>
  );
}
