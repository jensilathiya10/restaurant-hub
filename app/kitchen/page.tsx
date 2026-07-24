import { getSession } from "@/lib/auth";
import { kitchenOrders, defaultRestaurantId } from "@/lib/data";
import KitchenBoard from "@/components/KitchenBoard";

export default async function KitchenPage() {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const orders = await kitchenOrders(restaurantId);

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">👨‍🍳 Kitchen Display</h1>
          <p className="text-neutral-500 text-sm">Live orders — updates instantly</p>
        </div>
        <div className="text-sm text-neutral-500">{session?.name}</div>
      </div>
      <KitchenBoard initialOrders={orders} />
    </div>
  );
}
