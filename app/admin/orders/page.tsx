import { getSession } from "@/lib/auth";
import { listOrders, listMenuItems, listTables, defaultRestaurantId } from "@/lib/data";
import OrderBoard from "@/components/OrderBoard";
import NewOrderForm from "@/components/NewOrderForm";

export default async function OrdersPage() {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const orders = await listOrders(restaurantId, { limit: 60 });
  const menuItems = await listMenuItems(restaurantId);
  const tables = await listTables(restaurantId);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-neutral-500 text-sm">Dine in, takeaway and delivery — live status board.</p>
        </div>
        <NewOrderForm menuItems={menuItems} tables={tables} />
      </div>
      <OrderBoard initialOrders={orders} tables={tables} />
    </div>
  );
}
