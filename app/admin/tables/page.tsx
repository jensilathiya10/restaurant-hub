import { getSession } from "@/lib/auth";
import { listTables, listOrders, defaultRestaurantId, getRestaurant } from "@/lib/data";
import FloorPlan from "@/components/FloorPlan";

export default async function TablesPage() {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const restaurant = (await getRestaurant(restaurantId)) as any;
  const tables = await listTables(restaurantId);
  const orders = (await listOrders(restaurantId, { limit: 100 })) as any[];
  const ordersByTable: Record<string, any> = {};
  for (const o of orders) {
    if (o.tableId && !["COMPLETED", "CANCELLED"].includes(o.status) && !ordersByTable[o.tableId]) {
      ordersByTable[o.tableId] = o;
    }
  }
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Table Floor Plan</h1>
        <p className="text-neutral-500 text-sm">Live restaurant layout — click any table to manage it.</p>
      </div>
      <FloorPlan tables={tables} ordersByTable={ordersByTable} restaurantSlug={restaurant.slug} />
    </div>
  );
}
