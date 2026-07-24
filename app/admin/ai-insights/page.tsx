import { getSession } from "@/lib/auth";
import { salesForecast, inventoryForecast, menuInsights, simulateShift, defaultRestaurantId } from "@/lib/data";
import { money } from "@/lib/utils";
import { Icons } from "@/components/Icon";
import ShiftSimulator from "@/components/ShiftSimulator";

export default async function AiInsightsPage() {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const forecast = await salesForecast(restaurantId);
  const invForecast = ((await inventoryForecast(restaurantId)) as any[]).filter((i) => i.recommendedPurchase > 0).slice(0, 6);
  const insights = ((await menuInsights(restaurantId)) as any[]).sort((a, b) => b.sold - a.sold).slice(0, 8);
  const shift = await simulateShift(restaurantId, 8);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-2">
        <Icons.ai className="text-[var(--brand)]" size={22} />
        <div>
          <h1 className="text-2xl font-bold">AI Insights</h1>
          <p className="text-neutral-500 text-sm">Heuristic forecasting based on recent order history.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border p-4 md:col-span-1">
          <h3 className="font-semibold text-sm mb-2">Demand Forecast — Tomorrow</h3>
          <div className="text-3xl font-bold mb-1">{forecast.expectedOrders}</div>
          <div className="text-xs text-neutral-400 mb-3">expected orders</div>
          <div className="text-lg font-semibold text-emerald-600 mb-1">{money(forecast.expectedRevenue)}</div>
          <div className="text-xs text-neutral-400 mb-3">expected revenue</div>
          <div className="text-xs font-medium text-neutral-500 mb-1">Busy Hours</div>
          <div className="flex gap-1.5 flex-wrap">
            {forecast.busyHours.map((h) => <span key={h} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{h}</span>)}
          </div>
        </div>
        <ShiftSimulator initial={shift} />
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-2">Smart Inventory Prediction</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {invForecast.map((i) => (
              <div key={i.id} className="text-xs border-b pb-1.5">
                <div className="font-medium">{i.name}</div>
                <div className="text-neutral-400">Current: {i.quantity}{i.unit} · Expected use: {i.expectedUsageTomorrow}{i.unit} · Buy: <b>{i.recommendedPurchase}{i.unit}</b></div>
              </div>
            ))}
            {invForecast.length === 0 && <p className="text-xs text-neutral-400">No purchase recommendations right now.</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-sm mb-3">AI Menu Insights</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {insights.map((i) => (
            <div key={i.id} className="border rounded-lg p-3 text-sm">
              <div className="flex justify-between font-medium mb-1"><span>{i.name}</span><span>{money(i.price)}</span></div>
              <div className="text-xs text-neutral-400 mb-1">Sold: {i.sold} · Cost: {money(i.cost)} · Margin: {money(i.margin)}</div>
              <div className="text-xs text-[var(--brand)]">{i.suggestion}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
