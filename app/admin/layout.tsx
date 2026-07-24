import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getRestaurant, listRestaurants } from "@/lib/data";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  let restaurantName = "All Restaurants";
  if (session.restaurantId) {
    const r = await getRestaurant(session.restaurantId);
    restaurantName = r?.name || restaurantName;
  } else if (session.role === "SUPER_ADMIN") {
    const rs = await listRestaurants();
    restaurantName = `${rs.length} restaurants (Super Admin)`;
  }

  return (
    <div className="flex-1 flex min-h-screen bg-neutral-50">
      <AdminSidebar role={session.role} restaurantName={restaurantName} userName={session.name} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
