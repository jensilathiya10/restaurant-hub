import { getSession } from "@/lib/auth";
import { listMenuItems, listInventory, recipeCost, defaultRestaurantId } from "@/lib/data";
import RecipeCostManager from "@/components/RecipeCostManager";

export default async function RecipeCostPage() {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const menuItems = (await listMenuItems(restaurantId)) as any[];
  const inventory = await listInventory(restaurantId);
  const recipes: Record<string, any> = {};
  for (const m of menuItems) recipes[m.id] = await recipeCost(m.id);
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Recipe Cost Calculator</h1>
        <p className="text-neutral-500 text-sm">Ingredient costs auto-calculate profit margins per dish.</p>
      </div>
      <RecipeCostManager menuItems={menuItems} inventory={inventory} recipes={recipes} />
    </div>
  );
}
