import { getSession } from "@/lib/auth";
import { listSchedules, listEmployees, defaultRestaurantId } from "@/lib/data";
import SchedulingManager from "@/components/SchedulingManager";

export default async function SchedulingPage() {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const schedules = await listSchedules(restaurantId);
  const employees = await listEmployees(restaurantId);
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Scheduling</h1>
        <p className="text-neutral-500 text-sm">Weekly shifts for your team.</p>
      </div>
      <SchedulingManager schedules={schedules} employees={employees} />
    </div>
  );
}
