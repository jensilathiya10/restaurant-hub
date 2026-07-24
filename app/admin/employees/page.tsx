import { getSession } from "@/lib/auth";
import { listEmployees, staffPerformance, defaultRestaurantId } from "@/lib/data";
import EmployeeManager from "@/components/EmployeeManager";

export default async function EmployeesPage() {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const employees = await listEmployees(restaurantId);
  const performance = await staffPerformance(restaurantId);
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
        <p className="text-neutral-500 text-sm">Staff accounts, roles and performance.</p>
      </div>
      <EmployeeManager employees={employees} performance={performance} />
    </div>
  );
}
