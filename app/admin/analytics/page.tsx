import { getSession } from "@/lib/auth";
import {
  salesLast7Days, salesByHourToday, popularDishes, slowSellingDishes, returningCustomers, monthlySales, defaultRestaurantId,
} from "@/lib/data";
import { SalesLineChart, HourlyBarChart, RevenueBarChart } from "@/components/charts";

export default async function AnalyticsPage() {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const daily = await salesLast7Days(restaurantId);
  const hourly = await salesByHourToday(restaurantId);
  const best = await popularDishes(restaurantId, 5);
  const slow = await slowSellingDishes(restaurantId, 5);
  const returning = await returningCustomers(restaurantId);
  const monthly = (await monthlySales(restaurantId)).map((m) => ({ day: m.month, revenue: m.total }));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Sales Analytics</h1>
        <p className="text-neutral-500 text-sm">Daily and monthly trends, best & slow sellers, peak hours.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3">Daily Sales (7d)</h3>
          <SalesLineChart data={daily} />
        </div>
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3">Peak Hours (today)</h3>
          <HourlyBarChart data={hourly} />
        </div>
      </div>
      <div className="bg-white rounded-xl border p-4 mb-4">
        <h3 className="font-semibold text-sm mb-3">Monthly Sales</h3>
        {monthly.length ? <RevenueBarChart data={monthly} /> : <p className="text-sm text-neutral-400">Not enough data yet.</p>}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3">Best-Selling Food</h3>
          <ul className="text-sm space-y-1.5">
            {best.map((d: any) => <li key={d.name} className="flex justify-between"><span>{d.name}</span><span className="text-neutral-400">{d.qty} sold</span></li>)}
          </ul>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3">Slow-Selling Food</h3>
          <ul className="text-sm space-y-1.5">
            {slow.map((d: any) => <li key={d.name} className="flex justify-between"><span>{d.name}</span><span className="text-neutral-400">{d.qty} sold</span></li>)}
          </ul>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3">Returning Customers</h3>
          <div className="text-3xl font-bold">{returning.total ? Math.round((returning.returning / returning.total) * 100) : 0}%</div>
          <p className="text-xs text-neutral-400">{returning.returning} of {returning.total} customers have visited more than once</p>
        </div>
      </div>
    </div>
  );
}
