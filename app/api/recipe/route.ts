import { NextRequest, NextResponse } from "next/server";
import { ADMIN_ROLES } from "@/lib/auth";
import { setRecipe, defaultRestaurantId } from "@/lib/data";
import { requireSession, requireRole, isResponse } from "@/lib/api-guard";

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, ADMIN_ROLES);
  if (forbidden) return forbidden;

  const restaurantId = session.restaurantId || (await defaultRestaurantId());
  const { menuItemId, lines } = await req.json();
  await setRecipe(menuItemId, restaurantId, lines);
  return NextResponse.json({ ok: true });
}
