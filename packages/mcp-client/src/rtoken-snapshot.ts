export interface RTokenSnapshot {
  symbol: string;
  lastPrice: number;
  bidPrice: number;
  askPrice: number;
  bidSize: number;
  askSize: number;
  tickerTimestamp: string;
  retrievedAt: string;
  spreadPercent: number;
  warnings: string[];
}

export const RTOKEN_SNAPSHOT_MAX_AGE_MS = 2 * 60 * 1000;

interface BitgetTickerResponse {
  code?: string;
  msg?: string;
  appRetrievedAt?: string;
  data?: Array<{
    symbol?: string;
    ts?: string;
    lastPrice?: string;
    bid1Price?: string;
    ask1Price?: string;
    bid1Size?: string;
    ask1Size?: string;
  }>;
}

function positiveNumber(value: string | undefined): number | null {
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function nonNegativeNumber(value: string | undefined): number | null {
  if (value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function parseRTokenSnapshot(payload: unknown, now = Date.now(), expectedSymbol = "RAAPLUSDT"): RTokenSnapshot {
  if (!payload || typeof payload !== "object") throw new Error("Bitget returned an invalid ticker response.");
  const response = payload as BitgetTickerResponse;
  if (response.code !== "00000") throw new Error(response.msg || "Bitget ticker request failed.");
  const ticker = response.data?.find((item) => item.symbol === expectedSymbol);
  if (!ticker) throw new Error(`Bitget did not return the verified ${expectedSymbol} spot instrument.`);

  const lastPrice = positiveNumber(ticker.lastPrice);
  const bidPrice = positiveNumber(ticker.bid1Price);
  const askPrice = positiveNumber(ticker.ask1Price);
  const bidSize = nonNegativeNumber(ticker.bid1Size);
  const askSize = nonNegativeNumber(ticker.ask1Size);
  const marketTime = Number(ticker.ts);
  if (lastPrice === null || bidPrice === null || askPrice === null || bidSize === null || askSize === null) {
    throw new Error("Bitget ticker is missing valid price or size fields.");
  }
  if (!Number.isFinite(marketTime) || marketTime <= 0) throw new Error("Bitget ticker is missing a valid market timestamp.");

  const retrievedAt = response.appRetrievedAt ? Date.parse(response.appRetrievedAt) : now;
  if (!Number.isFinite(retrievedAt)) throw new Error("Ticker retrieval timestamp is invalid.");
  const age = retrievedAt - marketTime;
  if (age < -30_000) throw new Error("Bitget ticker timestamp is unexpectedly in the future.");
  if (age > RTOKEN_SNAPSHOT_MAX_AGE_MS) throw new Error("Bitget ticker is stale; refresh before using it.");

  const midpoint = (bidPrice + askPrice) / 2;
  const spreadPercent = ((askPrice - bidPrice) / midpoint) * 100;
  const warnings: string[] = [];
  if (bidPrice >= askPrice) warnings.push("Best bid is at or above best ask; the displayed book may be crossed or delayed.");
  if (bidPrice > lastPrice) warnings.push("Best bid is above the last-traded price; inspect quote quality before interpretation.");
  if (spreadPercent > 0.25) warnings.push(`Bid/ask spread is wide (${spreadPercent.toFixed(2)}% of midpoint).`);

  return {
    symbol: expectedSymbol,
    lastPrice,
    bidPrice,
    askPrice,
    bidSize,
    askSize,
    tickerTimestamp: new Date(marketTime).toISOString(),
    retrievedAt: new Date(retrievedAt).toISOString(),
    spreadPercent,
    warnings,
  };
}

export async function fetchRTokenSnapshot(symbol = "RAAPLUSDT", signal?: AbortSignal): Promise<RTokenSnapshot> {
  const response = await fetch(`/api/rtoken-ticker?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store", signal: signal ?? AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Bitget ticker request failed (${response.status}).`);
  return parseRTokenSnapshot(await response.json(), Date.now(), symbol);
}
