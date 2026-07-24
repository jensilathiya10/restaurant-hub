import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { simulateShift, defaultRestaurantId } from "@/lib/data";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const waiters = Number(req.nextUrl.searchParams.get("waiters") || 8);
  return NextResponse.json(await simulateShift(restaurantId, waiters));
}
