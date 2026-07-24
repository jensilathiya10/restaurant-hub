import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { subscribe } from "@/lib/events";
import { defaultRestaurantId } from "@/lib/data";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const restaurantId = session?.restaurantId || (await defaultRestaurantId());

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));
      const unsub = subscribe(restaurantId, (data) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
      });
      const ping = setInterval(() => {
        controller.enqueue(enc.encode(`: ping\n\n`));
      }, 20000);
      req.signal.addEventListener("abort", () => {
        clearInterval(ping);
        unsub();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
