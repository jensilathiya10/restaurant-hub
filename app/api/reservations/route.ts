import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createReservation, defaultRestaurantId, getRestaurantBySlug } from "@/lib/data";

export async function POST(req: NextRequest) {
  const session = await getSession();
  const body = await req.json();
  let restaurantId = session?.restaurantId;
  if (!restaurantId && body.restaurantSlug) {
    const r = (await getRestaurantBySlug(body.restaurantSlug)) as any;
    restaurantId = r?.id;
  }
  if (!restaurantId) restaurantId = await defaultRestaurantId();
  const id = await createReservation({ ...body, restaurantId });
  return NextResponse.json({ ok: true, id });
}
