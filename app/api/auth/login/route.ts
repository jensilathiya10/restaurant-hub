import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, verifyPassword, createSession, ROLE_HOME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const user = await findUserByEmail(String(email || "").toLowerCase().trim());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    restaurantId: user.restaurantId,
  });
  return NextResponse.json({ ok: true, redirect: ROLE_HOME[user.role] || "/menu" });
}
