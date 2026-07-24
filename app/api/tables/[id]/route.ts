import { NextRequest, NextResponse } from "next/server";
import { updateTableStatus, updateTable, deleteTable, defaultRestaurantId } from "@/lib/data";
import { requireSession, requireRole, isResponse, notFound } from "@/lib/api-guard";
import { ADMIN_ROLES } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, ADMIN_ROLES);
  if (forbidden) return forbidden;

  const { id } = await params;
  const restaurantId = session.restaurantId || (await defaultRestaurantId());
  const body = await req.json();
  if (body.status) {
    const ok = await updateTableStatus(id, restaurantId, body.status);
    if (!ok) return notFound();
  }
  const { number, seats, posX, posY } = body;
  await updateTable(id, restaurantId, { number, seats, posX, posY });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, ADMIN_ROLES);
  if (forbidden) return forbidden;

  const { id } = await params;
  const restaurantId = session.restaurantId || (await defaultRestaurantId());
  const ok = await deleteTable(id, restaurantId);
  if (!ok) return notFound();
  return NextResponse.json({ ok: true });
}
