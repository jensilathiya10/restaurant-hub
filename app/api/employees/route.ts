import { NextRequest, NextResponse } from "next/server";
import { hashPassword, ADMIN_ROLES } from "@/lib/auth";
import { defaultRestaurantId } from "@/lib/data";
import { requireSession, requireRole, isResponse } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { newId } from "@/lib/ids";

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, ADMIN_ROLES);
  if (forbidden) return forbidden;

  const restaurantId = session.restaurantId || (await defaultRestaurantId());
  const { name, email, position, hourlyRate, role } = await req.json();
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  const uid = newId("user");
  await db.user.create({
    data: { id: uid, email, passwordHash: hashPassword("password"), name, role: role || "WAITER", restaurantId },
  });
  const eid = newId("emp");
  await db.employee.create({
    data: { id: eid, userId: uid, restaurantId, position, hourlyRate: hourlyRate || 0 },
  });
  return NextResponse.json({ ok: true, id: eid });
}
