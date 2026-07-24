import { getSession } from "@/lib/auth";
import { listCustomers, defaultRestaurantId } from "@/lib/data";
import CustomerManager from "@/components/CustomerManager";

export default async function CustomersPage() {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const customers = await listCustomers(restaurantId);
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-neutral-500 text-sm">Customer history, loyalty and preferences.</p>
      </div>
      <CustomerManager customers={customers} />
    </div>
  );
}
