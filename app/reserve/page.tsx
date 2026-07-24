import { getRestaurantBySlug, defaultRestaurantId, getRestaurant } from "@/lib/data";
import ReserveForm from "@/components/ReserveForm";

export default async function ReservePage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const sp = await searchParams;
  const restaurant = (sp.r ? await getRestaurantBySlug(sp.r) : await getRestaurant(await defaultRestaurantId())) as any;
  return (
    <div className="flex-1 bg-neutral-50">
      <ReserveForm restaurantSlug={restaurant.slug} />
    </div>
  );
}
