import type { IncomingMessage, ServerResponse } from "node:http";

const ALLOWED_SYMBOL = /^R[A-Z0-9]+USDT$/;
const ALLOWED_INTERVALS = new Set(["1m", "5m", "15m", "1H", "4H", "1D"]);

/** Read-only Bitget public Reality spot candle proxy with bounded query parameters. */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.end("Method Not Allowed");
    return;
  }

  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const symbol = requestUrl.searchParams.get("symbol") ?? "RAAPLUSDT";
  const interval = requestUrl.searchParams.get("interval") ?? "1H";
  const parsedLimit = Number(requestUrl.searchParams.get("limit") ?? "168");
  if (!ALLOWED_SYMBOL.test(symbol) || symbol.length > 32 || !ALLOWED_INTERVALS.has(interval) || !Number.isInteger(parsedLimit) || parsedLimit < 2 || parsedLimit > 1000) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({ error: "A valid Reality spot symbol, candle interval, and limit are required." }));
    return;
  }

  try {
    const query = new URLSearchParams({ category: "SPOT", symbol, interval, limit: String(parsedLimit) });
    const upstream = await fetch(`https://api.bitget.com/api/v3/market/candles?${query}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    const body = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    if (!upstream.ok) {
      res.end(body || JSON.stringify({ error: "Bitget candle request failed." }));
      return;
    }

    const payload = JSON.parse(body) as Record<string, unknown>;
    res.end(JSON.stringify({ ...payload, appRetrievedAt: new Date().toISOString() }));
  } catch (error) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Bitget candles unavailable." }));
  }
}
