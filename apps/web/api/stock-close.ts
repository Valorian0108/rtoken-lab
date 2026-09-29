import type { IncomingMessage, ServerResponse } from "node:http";

const ALLOWED_SYMBOL = /^[A-Z][A-Z0-9.-]{0,14}$/;
interface StockCloseConfig { apiKey?: string }
const dailyCache = new Map<string, { body: string; cachedAt: number }>();
const DAILY_CACHE_TTL_MS = 12 * 60 * 60_000;
const DEMO_TOKEN = "demo";

/** Server-only, read-only EODHD proxy for daily US stock history. No real-time data is requested. */
export function createStockCloseHandler(config: StockCloseConfig = {}) {
  return async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.end("Method Not Allowed");
    return;
  }

  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const symbol = (requestUrl.searchParams.get("symbol") ?? "").toUpperCase();
  if (!ALLOWED_SYMBOL.test(symbol)) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({ error: "A valid US stock symbol is required." }));
    return;
  }

  const apiKey = config.apiKey ?? process.env.EODHD_API_TOKEN ?? DEMO_TOKEN;

  const cached = dailyCache.get(symbol);
  if (cached && Date.now() - cached.cachedAt < DAILY_CACHE_TTL_MS) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.end(cached.body);
    return;
  }

  try {
    const to = new Date().toISOString().slice(0, 10);
    const fromDate = new Date(Date.now() - 14 * 24 * 60 * 60_000).toISOString().slice(0, 10);
    const query = new URLSearchParams({ api_token: apiKey, fmt: "json", order: "d", from: fromDate, to });
    const upstream = await fetch(`https://eodhd.com/api/eod/${encodeURIComponent(`${symbol}.US`)}?${query}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    const body = await upstream.text();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    if (!upstream.ok) {
      res.statusCode = upstream.status;
      res.end(JSON.stringify({ error: `EODHD daily stock history request failed (${upstream.status}).` }));
      return;
    }

    const payload = JSON.parse(body) as unknown;
    if (!Array.isArray(payload)) {
      const errorText = typeof payload === "string" ? payload : payload && typeof payload === "object" ? JSON.stringify(payload) : null;
      res.statusCode = 503;
      res.end(JSON.stringify({
        error: typeof errorText === "string" && /limit|quota/i.test(errorText)
          ? "The EODHD request limit was reached. Try again later."
          : typeof errorText === "string" && /unauth|token|entitle|forbidden/i.test(errorText)
            ? "EODHD rejected the token or does not include this symbol. Check EODHD_API_TOKEN."
            : typeof errorText === "string" && /not found|ticker/i.test(errorText)
              ? `EODHD did not find a US daily-history series for ${symbol}.`
              : "Daily stock history is currently unavailable from EODHD.",
      }));
      return;
    }

    res.statusCode = 200;
    const result = JSON.stringify({ data: payload, retrievedAt: new Date().toISOString(), provider: "EODHD", tokenType: apiKey === DEMO_TOKEN ? "demo" : "configured" });
    dailyCache.set(symbol, { body: result, cachedAt: Date.now() });
    res.end(result);
  } catch (error) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Daily stock history is unavailable." }));
  }
  };
}

export default createStockCloseHandler();
