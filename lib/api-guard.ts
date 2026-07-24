import { NextResponse } from "next/server";
import { getSession, SessionUser } from "./auth";

// Call at the top of any /api route handler that must not run for anonymous
// callers. Returns the session, or a Response the caller should return as-is.
export async function requireSession(): Promise<SessionUser | NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return session;
}

export function requireRole(session: SessionUser, roles: string[]): NextResponse | null {
  if (!roles.includes(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export function isResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}

// A 404 (not 403) on ownership mismatches — it shouldn't confirm to a caller
// from another tenant that the entity exists at all.
export const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });
