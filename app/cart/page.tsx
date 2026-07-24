import { getRestaurantBySlug, defaultRestaurantId, getRestaurant } from "@/lib/data";
import { CartProvider } from "@/lib/cart";
import CustomerNav from "@/components/CustomerNav";
import CartView from "@/components/CartView";

export default async function CartPage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const sp = await searchParams;
  const restaurant = (sp.r ? await getRestaurantBySlug(sp.r) : await getRestaurant(await defaultRestaurantId())) as any;
  return (
    <CartProvider restaurantSlug={restaurant.slug}>
      <div className="flex-1 bg-neutral-50">
        <CustomerNav restaurantName={restaurant.name} restaurantSlug={restaurant.slug} tableLabel="A guest" />
        <CartView restaurantSlug={restaurant.slug} taxRate={restaurant.taxRate} />
      </div>
    </CartProvider>
  );
}
