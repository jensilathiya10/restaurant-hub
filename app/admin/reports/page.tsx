import { getSession } from "@/lib/auth";
import { revenueReport, dashboardStats, getRestaurant, defaultRestaurantId } from "@/lib/data";
import ReportsPanel from "@/components/ReportsPanel";

export default async function ReportsPage() {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const rows = await revenueReport(restaurantId, 30);
  const stats = await dashboardStats(restaurantId);
  const restaurant = (await getRestaurant(restaurantId)) as any;
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-neutral-500 text-sm">Revenue, profit and exports.</p>
      </div>
      <ReportsPanel rows={rows} todayRevenue={stats.revenue} currency={restaurant?.currency || "EUR"} />
    </div>
  );
}
