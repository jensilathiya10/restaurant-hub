import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { revenueReport, defaultRestaurantId } from "@/lib/data";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());
  const days = Number(req.nextUrl.searchParams.get("days") || 30);
  const rows = await revenueReport(restaurantId, days);
  const header = "date,revenue,orders\n";
  const body = rows.map((r: any) => `${r.day},${r.revenue.toFixed(2)},${r.orders}`).join("\n");
  return new NextResponse(header + body, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="revenue-report.csv"`,
    },
  });
}
