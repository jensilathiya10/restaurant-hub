import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { JWT_SECRET } from "./env";

const key = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = "rh_session";
const BCRYPT_COST = 10;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  restaurantId: string | null;
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key);
  const c = await cookies();
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compareSync(plain, hash);
}

export function hashPassword(plain: string) {
  return bcrypt.hashSync(plain, BCRYPT_COST);
}

export function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

export const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: "/admin/dashboard",
  OWNER: "/admin/dashboard",
  MANAGER: "/admin/dashboard",
  CASHIER: "/admin/orders",
  WAITER: "/admin/orders",
  CHEF: "/kitchen",
  CUSTOMER: "/menu",
};

export const ADMIN_ROLES = ["SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER", "WAITER"];
export const FULL_ADMIN_ROLES = ["SUPER_ADMIN", "OWNER", "MANAGER"];
export const KITCHEN_ROLES = ["SUPER_ADMIN", "OWNER", "MANAGER", "CHEF"];
// Orders are worked by both the admin/POS board and the kitchen display,
// so order-related API routes gate on this union rather than ADMIN_ROLES alone.
export const STAFF_ROLES = Array.from(new Set([...ADMIN_ROLES, ...KITCHEN_ROLES]));
