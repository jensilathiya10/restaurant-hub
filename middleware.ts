import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/env";

const key = new TextEncoder().encode(JWT_SECRET);

const ADMIN_ROLES = ["SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER", "WAITER"];
const KITCHEN_ROLES = ["SUPER_ADMIN", "OWNER", "MANAGER", "CHEF"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAdmin = pathname.startsWith("/admin");
  const needsKitchen = pathname.startsWith("/kitchen");
  if (!needsAdmin && !needsKitchen) return NextResponse.next();

  const token = req.cookies.get("rh_session")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const { payload } = await jwtVerify(token, key);
    const role = payload.role as string;
    if (needsAdmin && !ADMIN_ROLES.includes(role)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (needsKitchen && !KITCHEN_ROLES.includes(role)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/kitchen/:path*"],
};
