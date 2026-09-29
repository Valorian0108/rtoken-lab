export interface RTokenStockClose {
  symbol: string;
  close: number;
  date: string;
  retrievedAt: string;
  source: "EODHD";
  tokenType: "demo" | "configured";
}

interface EodhdDailyBar {
  date?: unknown;
  close?: unknown;
}

export function parseRTokenStockClose(
  payload: unknown,
  requestedSymbol: string,
  retrievedAt = new Date().toISOString(),
  tokenType: "demo" | "configured" = "configured",
): RTokenStockClose {
  if (!Array.isArray(payload)) throw new Error("EODHD returned an invalid daily-history response.");
  const latest = (payload as EodhdDailyBar[])
    .filter((bar) => typeof bar.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(bar.date) && Number.isFinite(Number(bar.close)))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  if (!latest) throw new Error("No dated daily stock close was returned for this symbol.");
  const close = Number(latest.close);
  if (!Number.isFinite(close) || close <= 0) throw new Error("The latest daily stock close was invalid.");

  return {
    symbol: requestedSymbol,
    close,
    date: String(latest.date),
    retrievedAt,
    source: "EODHD",
    tokenType,
  };
}

const successfulResponses = new Map<string, { value: RTokenStockClose; cachedAt: number }>();
const CACHE_TTL_MS = 12 * 60 * 60_000;

/** Fetches end-of-day data only. A successful result is cached in this tab for 12 hours. */
export async function fetchRTokenStockClose(symbol: string, signal?: AbortSignal): Promise<RTokenStockClose> {
  const normalized = symbol.toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(normalized)) throw new Error("A valid underlying stock symbol is required.");
  const cached = successfulResponses.get(normalized);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached.value;

  const response = await fetch(`/api/stock-close?symbol=${encodeURIComponent(normalized)}`, {
    cache: "no-store",
    signal: signal ?? AbortSignal.timeout(15_000),
  });
  const payload = await response.json() as { error?: unknown; data?: unknown; retrievedAt?: unknown; tokenType?: unknown };
  if (!response.ok) {
    throw new Error(typeof payload.error === "string" ? payload.error : `Stock daily-close request failed (${response.status}).`);
  }
  const close = parseRTokenStockClose(
    payload.data,
    normalized,
    typeof payload.retrievedAt === "string" ? payload.retrievedAt : undefined,
    payload.tokenType === "demo" ? "demo" : "configured",
  );
  successfulResponses.set(normalized, { value: close, cachedAt: Date.now() });
  return close;
}
