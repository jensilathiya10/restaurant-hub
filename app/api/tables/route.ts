import { NextRequest, NextResponse } from "next/server";
import { ADMIN_ROLES } from "@/lib/auth";
import { createTable, defaultRestaurantId } from "@/lib/data";
import { requireSession, requireRole, isResponse } from "@/lib/api-guard";

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, ADMIN_ROLES);
  if (forbidden) return forbidden;

  const restaurantId = session.restaurantId || (await defaultRestaurantId());
  const { number, seats, posX, posY } = await req.json();
  const id = await createTable(restaurantId, Number(number), Number(seats), Number(posX ?? 20), Number(posY ?? 20));
  return NextResponse.json({ ok: true, id });
}
