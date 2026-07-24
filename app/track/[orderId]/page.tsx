import { getOrder } from "@/lib/data";
import { notFound } from "next/navigation";
import OrderTracker from "@/components/OrderTracker";

export default async function TrackPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) notFound();
  return (
    <div className="flex-1 bg-neutral-50">
      <OrderTracker orderId={orderId} initial={order} />
    </div>
  );
}
