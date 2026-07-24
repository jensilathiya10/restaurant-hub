import { NextRequest, NextResponse } from "next/server";
import { updateMenuItem, deleteMenuItem, defaultRestaurantId } from "@/lib/data";
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
  const ok = await updateMenuItem(id, restaurantId, body);
  if (!ok) return notFound();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, ADMIN_ROLES);
  if (forbidden) return forbidden;

  const { id } = await params;
  const restaurantId = session.restaurantId || (await defaultRestaurantId());
  const ok = await deleteMenuItem(id, restaurantId);
  if (!ok) return notFound();
  return NextResponse.json({ ok: true });
}
