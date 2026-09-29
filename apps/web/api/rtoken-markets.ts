import type { IncomingMessage, ServerResponse } from "node:http";

/** Read-only list proxy; the client filters the response to online Reality stock spot markets. */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.end("Method Not Allowed");
    return;
  }

  try {
    const upstream = await fetch("https://api.bitget.com/api/v3/market/instruments?category=SPOT", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    const body = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.end(body || JSON.stringify({ error: "Bitget instruments response was empty." }));
  } catch (error) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Bitget instruments unavailable." }));
  }
}
