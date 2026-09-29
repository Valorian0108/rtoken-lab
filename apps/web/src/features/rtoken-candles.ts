export interface RTokenCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  baseVolume: number;
  quoteVolume: number;
}

export interface RTokenCandleHistory {
  candles: RTokenCandle[];
  retrievedAt: string;
  requestTime: number | null;
}

export type RTokenCandleRange = "1D" | "1W" | "1M";

const RANGE_HOURS: Record<RTokenCandleRange, number> = { "1D": 24, "1W": 168, "1M": 720 };

/** Select observed hourly candles inside the requested time window ending at the latest returned candle. */
export function selectRTokenCandleRange(candles: RTokenCandle[], range: RTokenCandleRange): RTokenCandle[] {
  if (candles.length === 0) return [];
  const ordered = [...candles].sort((a, b) => a.timestamp - b.timestamp);
  const cutoff = ordered.at(-1)!.timestamp - RANGE_HOURS[range] * 60 * 60_000;
  return ordered.filter((candle) => candle.timestamp > cutoff);
}

interface BitgetCandlesResponse {
  code?: string;
  msg?: string;
  requestTime?: number;
  data?: unknown;
}

export function parseRTokenCandles(payload: unknown, now = Date.now()): RTokenCandle[] {
  if (!payload || typeof payload !== "object") throw new Error("Bitget returned an invalid candle response.");
  const response = payload as BitgetCandlesResponse;
  if (response.code !== "00000" || !Array.isArray(response.data)) {
    throw new Error(response.msg || "Bitget Reality candle history is unavailable.");
  }

  const byTimestamp = new Map<number, RTokenCandle>();
  for (const row of response.data) {
    if (!Array.isArray(row) || row.length < 7) continue;
    const [rawTimestamp, rawOpen, rawHigh, rawLow, rawClose, rawBaseVolume, rawQuoteVolume] = row;
    const values = [rawTimestamp, rawOpen, rawHigh, rawLow, rawClose, rawBaseVolume, rawQuoteVolume].map(Number);
    if (values.some((value) => !Number.isFinite(value))) continue;
    const [timestamp, open, high, low, close, baseVolume, quoteVolume] = values as [number, number, number, number, number, number, number];
    if (
      timestamp <= 0 || timestamp > now + 5 * 60_000
      || open <= 0 || high <= 0 || low <= 0 || close <= 0
      || high < Math.max(open, close) || low > Math.min(open, close)
      || low > high || baseVolume < 0 || quoteVolume < 0
    ) continue;
    byTimestamp.set(timestamp, { timestamp, open, high, low, close, baseVolume, quoteVolume });
  }

  const candles = [...byTimestamp.values()].sort((a, b) => a.timestamp - b.timestamp);
  if (candles.length < 2) throw new Error("Bitget returned fewer than two valid hourly candles.");
  const latest = candles[candles.length - 1]!;
  if (now - latest.timestamp > 2 * 60 * 60_000) throw new Error("The latest Bitget hourly candle is stale; no chart is shown.");
  return candles;
}

export async function fetchRTokenCandles(symbol: string, signal?: AbortSignal): Promise<RTokenCandleHistory> {
  const response = await fetch(`/api/rtoken-candles?symbol=${encodeURIComponent(symbol)}&interval=1H&limit=1000`, {
    cache: "no-store",
    signal: signal ?? AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Bitget candle request failed (${response.status}).`);
  const payload = await response.json() as BitgetCandlesResponse & { appRetrievedAt?: unknown };
  const candles = parseRTokenCandles(payload);
  const parsedRetrievedAt = typeof payload.appRetrievedAt === "string" && Number.isFinite(Date.parse(payload.appRetrievedAt))
    ? payload.appRetrievedAt
    : new Date().toISOString();
  return {
    candles,
    retrievedAt: parsedRetrievedAt,
    requestTime: typeof payload.requestTime === "number" && Number.isFinite(payload.requestTime) ? payload.requestTime : null,
  };
}
