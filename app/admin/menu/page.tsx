import { getSession } from "@/lib/auth";
import { listCategories, listMenuItems, defaultRestaurantId } from "@/lib/data";
import MenuManager from "@/components/MenuManager";

export default async function MenuPage() {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const categories = await listCategories(restaurantId);
  const items = await listMenuItems(restaurantId);
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <p className="text-neutral-500 text-sm">Categories, dishes, pricing and availability.</p>
      </div>
      <MenuManager categories={categories} items={items} />
    </div>
  );
}
