import { NextRequest, NextResponse } from "next/server";
import { ADMIN_ROLES } from "@/lib/auth";
import { createCustomer, defaultRestaurantId } from "@/lib/data";
import { requireSession, requireRole, isResponse } from "@/lib/api-guard";

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, ADMIN_ROLES);
  if (forbidden) return forbidden;

  const restaurantId = session.restaurantId || (await defaultRestaurantId());
  const body = await req.json();
  const id = await createCustomer({ ...body, restaurantId });
  return NextResponse.json({ ok: true, id });
}
