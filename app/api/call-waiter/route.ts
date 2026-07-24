import { NextRequest, NextResponse } from "next/server";
import { getRestaurantBySlug, callWaiter } from "@/lib/data";

export async function POST(req: NextRequest) {
  const { restaurantSlug, tableLabel } = await req.json();
  const r = (await getRestaurantBySlug(restaurantSlug)) as any;
  if (!r) return NextResponse.json({ error: "not found" }, { status: 404 });
  await callWaiter(r.id, tableLabel || "A customer");
  return NextResponse.json({ ok: true });
}
