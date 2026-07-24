import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text") || "";
  if (!text) return NextResponse.json({ error: "missing text" }, { status: 400 });
  const buffer = await QRCode.toBuffer(text, { width: 240, margin: 1, color: { dark: "#1f1b18", light: "#ffffff" } });
  return new NextResponse(new Uint8Array(buffer), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" } });
}
