import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCustomerByUserId, customerOrderHistory } from "@/lib/data";
import { money, fmtDate } from "@/lib/utils";
import ReviewForm from "@/components/ReviewForm";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const customer = (await getCustomerByUserId(session.id)) as any;
  const orders = customer ? await customerOrderHistory(customer.id) : [];

  return (
    <div className="flex-1 bg-neutral-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-1">My Account</h1>
        <p className="text-sm text-neutral-400 mb-6">{session.name} · {session.email}</p>

        {customer && (
          <div className="bg-white rounded-xl border p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div><div className="text-xl font-bold">{customer.loyaltyPoints}</div><div className="text-[10px] text-neutral-400">Loyalty Points</div></div>
            <div><div className="text-xl font-bold">{customer.visits}</div><div className="text-[10px] text-neutral-400">Visits</div></div>
            <div><div className="text-sm font-semibold">{customer.favoriteFood || "—"}</div><div className="text-[10px] text-neutral-400">Favorite</div></div>
            <div><div className="text-sm font-semibold">{customer.allergy || "None"}</div><div className="text-[10px] text-neutral-400">Allergy</div></div>
          </div>
        )}

        <div className="bg-white rounded-xl border p-4 mb-4">
          <h3 className="font-semibold text-sm mb-3">Order History</h3>
          <div className="space-y-2">
            {orders.map((o: any) => (
              <div key={o.id} className="border-b border-neutral-100 pb-2 text-sm">
                <div className="flex justify-between"><span>{fmtDate(o.createdAt)} · {o.items.length} items</span><span className="font-medium">{money(o.total)}</span></div>
                <div className="text-xs text-neutral-400">{o.status}</div>
              </div>
            ))}
            {orders.length === 0 && <p className="text-sm text-neutral-400">No orders yet.</p>}
          </div>
        </div>

        {customer && (
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-sm mb-3">Leave a Review</h3>
            <ReviewForm customerId={customer.id} />
          </div>
        )}
      </div>
    </div>
  );
}
