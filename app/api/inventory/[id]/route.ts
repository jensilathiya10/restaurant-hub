import { NextRequest, NextResponse } from "next/server";
import { adjustInventory, updateInventoryItem, defaultRestaurantId } from "@/lib/data";
import { requireSession, requireRole, isResponse, notFound } from "@/lib/api-guard";
import { ADMIN_ROLES } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, ADMIN_ROLES);
  if (forbidden) return forbidden;

  const { id } = await params;
  const restaurantId = session.restaurantId || (await defaultRestaurantId());
  const body = await req.json();
  let ok: boolean | undefined;
  if (typeof body.change === "number") {
    ok = await adjustInventory(id, restaurantId, body.change, body.reason || "manual");
  } else {
    const { name, unit, quantity, lowStockAt, costPerUnit } = body;
    ok = await updateInventoryItem(id, restaurantId, { name, unit, quantity, lowStockAt, costPerUnit });
  }
  if (!ok) return notFound();
  return NextResponse.json({ ok: true });
}
