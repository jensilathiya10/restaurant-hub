import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createReview, defaultRestaurantId } from "@/lib/data";

export async function POST(req: NextRequest) {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const body = await req.json();
  await createReview({ ...body, restaurantId });
  return NextResponse.json({ ok: true });
}
