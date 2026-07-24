import { getRestaurantBySlug, listCategories, listMenuItems, defaultRestaurantId, getRestaurant } from "@/lib/data";
import { CartProvider } from "@/lib/cart";
import CustomerNav from "@/components/CustomerNav";
import MenuBrowser from "@/components/MenuBrowser";

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ r?: string; table?: string }> }) {
  const sp = await searchParams;
  const restaurant = (sp.r ? await getRestaurantBySlug(sp.r) : await getRestaurant(await defaultRestaurantId())) as any;
  const categories = await listCategories(restaurant.id);
  const items = await listMenuItems(restaurant.id);

  return (
    <CartProvider restaurantSlug={restaurant.slug}>
      <div className="flex-1 bg-[var(--surface)]">
        <CustomerNav restaurantName={restaurant.name} restaurantSlug={restaurant.slug} tableLabel={sp.table ? `Table ${sp.table}` : "A guest"} />
        <MenuBrowser categories={categories} items={items} />
      </div>
    </CartProvider>
  );
}
