import { getSession } from "@/lib/auth";
import { listInventory, defaultRestaurantId } from "@/lib/data";
import InventoryManager from "@/components/InventoryManager";

export default async function InventoryPage() {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const items = await listInventory(restaurantId);
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-neutral-500 text-sm">Track ingredients, suppliers and low stock alerts.</p>
      </div>
      <InventoryManager items={items} />
    </div>
  );
}
