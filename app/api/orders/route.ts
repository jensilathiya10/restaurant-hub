import { NextRequest, NextResponse } from "next/server";
import { getSession, STAFF_ROLES } from "@/lib/auth";
import { createOrder, listOrders, defaultRestaurantId, getRestaurantBySlug, getCustomerByUserId } from "@/lib/data";
import { requireSession, requireRole, isResponse } from "@/lib/api-guard";
import { broadcast } from "@/lib/events";

// Lists every order for the caller's own restaurant — used by the staff
// admin/kitchen boards only, so it requires a real staff session rather than
// falling back to "whichever tenant sorts first" for anonymous callers.
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, STAFF_ROLES);
  if (forbidden) return forbidden;

  const status = req.nextUrl.searchParams.get("status") || undefined;
  const restaurantId = session.restaurantId || (await defaultRestaurantId());
  return NextResponse.json({ orders: await listOrders(restaurantId, { status }) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const body = await req.json();
  let restaurantId = session?.restaurantId;
  if (!restaurantId && body.restaurantSlug) {
    const r = (await getRestaurantBySlug(body.restaurantSlug)) as any;
    restaurantId = r?.id;
  }
  if (!restaurantId) restaurantId = await defaultRestaurantId();

  let customerId = body.customerId || null;
  if (!customerId && session?.role === "CUSTOMER") {
    const c = (await getCustomerByUserId(session.id)) as any;
    customerId = c?.id || null;
  }

  const orderId = await createOrder({ ...body, restaurantId, customerId });
  broadcast(restaurantId, { type: "order_created", orderId });
  return NextResponse.json({ ok: true, orderId });
}
