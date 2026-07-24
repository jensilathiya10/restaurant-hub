import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getRestaurant, listRestaurants, defaultRestaurantId } from "@/lib/data";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "OWNER"].includes(session.role)) redirect("/admin/dashboard");
  const restaurantId = session.restaurantId || (await defaultRestaurantId());
  const restaurant = (await getRestaurant(restaurantId)) as any;
  const allRestaurants = session.role === "SUPER_ADMIN" ? ((await listRestaurants()) as any[]) : [];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-neutral-500 text-sm">Restaurant profile, taxes and opening hours.</p>
      </div>
      <SettingsForm restaurant={restaurant} />
      {allRestaurants.length > 0 && (
        <div className="mt-6 max-w-lg">
          <h3 className="font-semibold text-sm mb-2">All Restaurants (Super Admin / Multi-Branch)</h3>
          <div className="bg-white rounded-xl border divide-y">
            {allRestaurants.map((r) => (
              <div key={r.id} className="px-4 py-2.5 text-sm flex justify-between">
                <span>{r.name}</span>
                <span className="text-neutral-400">{r.slug}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
