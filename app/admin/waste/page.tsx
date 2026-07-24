import { getSession } from "@/lib/auth";
import { wasteSummary, defaultRestaurantId } from "@/lib/data";
import { money } from "@/lib/utils";
import { RevenueBarChart } from "@/components/charts";

export default async function WastePage() {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const { rows, totalCost } = await wasteSummary(restaurantId);
  const chartData = rows.map((r) => ({ day: r.name, revenue: Math.round(r.wasted * r.costPerUnit * 100) / 100 }));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Food Waste Analytics</h1>
        <p className="text-neutral-500 text-sm">Track where money is lost through waste.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl border p-4"><div className="text-xs text-neutral-500">This Month — Waste Cost</div><div className="text-2xl font-bold text-red-600">{money(totalCost)}</div></div>
        <div className="bg-white rounded-xl border p-4 sm:col-span-2">
          <div className="text-xs text-neutral-500 mb-1">Most Wasted</div>
          <div className="flex gap-2 flex-wrap">
            {rows.slice(0, 5).map((r) => (
              <span key={r.name} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full">{r.name} · {r.wasted.toFixed(1)}{r.unit}</span>
            ))}
            {rows.length === 0 && <span className="text-xs text-neutral-400">No waste logged yet.</span>}
          </div>
        </div>
      </div>
      {rows.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3">Waste Cost by Ingredient</h3>
          <RevenueBarChart data={chartData} dataKey="revenue" />
        </div>
      )}
    </div>
  );
}
