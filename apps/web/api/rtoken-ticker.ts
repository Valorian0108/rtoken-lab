import type { IncomingMessage, ServerResponse } from "node:http";

const ALLOWED_SYMBOL = /^R[A-Z0-9]+USDT$/;

/** Public, read-only Bitget ticker proxy restricted to the Reality spot symbol format. */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.end("Method Not Allowed");
    return;
  }

  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const symbol = requestUrl.searchParams.get("symbol") ?? "RAAPLUSDT";
  if (!ALLOWED_SYMBOL.test(symbol) || symbol.length > 32) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({ error: "A valid USDT-quoted Reality spot symbol is required." }));
    return;
  }

  try {
    const upstream = await fetch(`https://api.bitget.com/api/v3/market/tickers?category=SPOT&symbol=${encodeURIComponent(symbol)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const body = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    if (!upstream.ok) {
      res.end(body || JSON.stringify({ error: "Bitget ticker request failed." }));
      return;
    }

    const payload = JSON.parse(body) as Record<string, unknown>;
    res.end(JSON.stringify({ ...payload, appRetrievedAt: new Date().toISOString() }));
  } catch (error) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Bitget ticker unavailable." }));
  }
}
