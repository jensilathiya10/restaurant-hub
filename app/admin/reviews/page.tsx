import { getSession } from "@/lib/auth";
import { listReviews, defaultRestaurantId } from "@/lib/data";

function avg(rows: any[], key: string) {
  if (!rows.length) return 0;
  return rows.reduce((s, r) => s + r[key], 0) / rows.length;
}

function Bar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100;
  const color = value >= 4 ? "bg-emerald-500" : value >= 3 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5"><span>{label}</span><span>{value.toFixed(1)}/5</span></div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden"><div className={`h-full ${color}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default async function ReviewsPage() {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const reviews = (await listReviews(restaurantId)) as any[];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customer Feedback</h1>
        <p className="text-neutral-500 text-sm">Ratings across food, service, wait time and cleanliness.</p>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 h-fit">
          <h3 className="font-semibold text-sm mb-3">Averages</h3>
          <Bar label="Food" value={avg(reviews, "foodRating")} />
          <Bar label="Service" value={avg(reviews, "serviceRating")} />
          <Bar label="Wait Time" value={avg(reviews, "waitRating")} />
          <Bar label="Cleanliness" value={avg(reviews, "cleanRating")} />
        </div>
        <div className="lg:col-span-2 space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border p-4">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm">{r.customerName || "Guest"}</span>
                <span className="text-xs text-neutral-400">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-neutral-600">{r.comment}</p>
              <div className="flex gap-2 mt-2 text-[10px] text-neutral-400">
                <span>Food {r.foodRating}/5</span><span>Service {r.serviceRating}/5</span><span>Wait {r.waitRating}/5</span><span>Clean {r.cleanRating}/5</span>
              </div>
            </div>
          ))}
          {reviews.length === 0 && <p className="text-sm text-neutral-400">No reviews yet.</p>}
        </div>
      </div>
    </div>
  );
}
