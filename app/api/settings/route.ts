import { NextRequest, NextResponse } from "next/server";
import { FULL_ADMIN_ROLES } from "@/lib/auth";
import { defaultRestaurantId, getRestaurant } from "@/lib/data";
import { requireSession, requireRole, isResponse } from "@/lib/api-guard";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await requireSession();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, FULL_ADMIN_ROLES);
  if (forbidden) return forbidden;

  const restaurantId = session.restaurantId || (await defaultRestaurantId());
  const body = await req.json();
  const fields: Record<string, unknown> = {};
  for (const k of ["name", "address", "taxRate", "openingHours", "currency"]) {
    if (body[k] !== undefined) fields[k] = body[k];
  }
  if (Object.keys(fields).length) {
    await db.restaurant.updateMany({ where: { id: restaurantId }, data: fields });
  }
  return NextResponse.json({ ok: true, restaurant: await getRestaurant(restaurantId) });
}
