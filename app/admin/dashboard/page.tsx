import { getSession } from "@/lib/auth";
import {
  dashboardStats, salesLast7Days, salesByHourToday, popularDishes, defaultRestaurantId, listNotifications,
} from "@/lib/data";
import StatCard from "@/components/StatCard";
import { SalesLineChart, HourlyBarChart, DishesPieChart } from "@/components/charts";
import { Icons } from "@/components/Icon";
import { money } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const stats = await dashboardStats(restaurantId);
  const sales = await salesLast7Days(restaurantId);
  const hourly = await salesByHourToday(restaurantId);
  const dishes = await popularDishes(restaurantId);
  const notifications = await listNotifications(restaurantId);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-neutral-500 text-sm">Welcome back, {session?.name}. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Today's Revenue" value={money(stats.revenue)} icon={Icons.money} tone="good" />
        <StatCard label="Orders Today" value={String(stats.ordersToday)} icon={Icons.orders} />
        <StatCard label="Active Tables" value={String(stats.activeTables)} icon={Icons.tables} />
        <StatCard label="Reservations" value={String(stats.reservationsToday)} icon={Icons.reservations} />
        <StatCard label="Low Stock Alerts" value={String(stats.lowStock)} icon={Icons.alert} tone={stats.lowStock > 0 ? "warn" : "default"} />
        <StatCard label="Staff On Duty" value={String(stats.staffOnDuty)} icon={Icons.employees} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-4">
          <h2 className="font-semibold text-sm mb-3">Sales — last 7 days</h2>
          <SalesLineChart data={sales} />
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <h2 className="font-semibold text-sm mb-3">Popular Dishes</h2>
          {dishes.length ? <DishesPieChart data={dishes} /> : <p className="text-sm text-neutral-400">No order data yet.</p>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-4">
          <h2 className="font-semibold text-sm mb-3">Hourly Customers — today</h2>
          {hourly.length ? <HourlyBarChart data={hourly} /> : <p className="text-sm text-neutral-400">No orders yet today.</p>}
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><Icons.notifications size={15} /> Notifications</h2>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {notifications.length === 0 && <p className="text-sm text-neutral-400">No notifications.</p>}
            {(notifications as any[]).map((n) => (
              <div key={n.id} className="text-xs border-b border-neutral-100 pb-2">
                <span className="font-medium block">{n.type.replace("_", " ")}</span>
                <span className="text-neutral-500">{n.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
