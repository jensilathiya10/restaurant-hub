import { NextRequest, NextResponse } from "next/server";
import { STAFF_ROLES } from "@/lib/auth";
import { updateOrderStatus, payOrder, updateOrder, getOrder, defaultRestaurantId } from "@/lib/data";
import { requireSession, requireRole, isResponse, notFound } from "@/lib/api-guard";
import { broadcast } from "@/lib/events";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, STAFF_ROLES);
  if (forbidden) return forbidden;

  const { id } = await params;
  const restaurantId = session.restaurantId || (await defaultRestaurantId());
  const body = await req.json();
  let ok = true;
  if (ok && body.status) ok = await updateOrderStatus(id, restaurantId, body.status);
  if (ok && body.pay) ok = await payOrder(id, restaurantId, body.pay.method, body.pay.tip || 0);
  if (ok && body.edit) ok = await updateOrder(id, restaurantId, body.edit);
  if (!ok) return notFound();
  broadcast(restaurantId, { type: "order_updated", orderId: id });
  return NextResponse.json({ ok: true, order: await getOrder(id) });
}

// Intentionally left open: this powers customer-facing order tracking
// (app/track/[orderId]) reached via a link/QR with no login. The order id
// (lib/db.ts's id()) is a nanoid-based token, not a guessable sequence — that
// unpredictability is what stands in for an auth check here.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ order: await getOrder(id) });
}
