import { getSession } from "@/lib/auth";
import { listReservations, listTables, defaultRestaurantId } from "@/lib/data";
import ReservationManager from "@/components/ReservationManager";

export default async function ReservationsPage() {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const reservations = await listReservations(restaurantId);
  const tables = await listTables(restaurantId);
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reservations</h1>
        <p className="text-neutral-500 text-sm">Book tables, manage walk-ins and confirmations.</p>
      </div>
      <ReservationManager reservations={reservations} tables={tables} />
    </div>
  );
}
