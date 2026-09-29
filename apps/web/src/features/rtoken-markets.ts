export interface RTokenMarket {
  symbol: string;
  baseCoin: string;
}

interface BitgetMarketResponse {
  code?: string;
  msg?: string;
  data?: Array<{
    symbol?: string;
    category?: string;
    baseCoin?: string;
    quoteCoin?: string;
    symbolType?: string;
    status?: string;
    isReality?: string;
  }>;
}

export function parseRTokenMarkets(payload: unknown): RTokenMarket[] {
  if (!payload || typeof payload !== "object") throw new Error("Bitget returned an invalid instruments response.");
  const response = payload as BitgetMarketResponse;
  if (response.code !== "00000" || !Array.isArray(response.data)) {
    throw new Error(response.msg || "Bitget Reality spot instruments are unavailable.");
  }

  const unique = new Map<string, RTokenMarket>();
  for (const item of response.data) {
    if (
      item.category !== "SPOT" || item.quoteCoin !== "USDT" || item.symbolType !== "stock"
      || item.status !== "online" || item.isReality !== "yes"
      || !item.symbol || !item.baseCoin || !/^r[A-Z0-9]+$/.test(item.baseCoin)
      || item.symbol !== `${item.baseCoin.toUpperCase()}USDT`
    ) continue;
    unique.set(item.symbol, { symbol: item.symbol, baseCoin: item.baseCoin });
  }

  const markets = [...unique.values()].sort((a, b) => a.baseCoin.localeCompare(b.baseCoin));
  if (!markets.some((market) => market.symbol === "RAAPLUSDT")) {
    throw new Error("Bitget did not confirm RAAPLUSDT in its online Reality spot instruments.");
  }
  return markets;
}

export function searchRTokenMarkets(markets: RTokenMarket[], query: string, limit = 12): RTokenMarket[] {
  const normalized = query.trim().toLowerCase();
  const sorted = [...markets].sort((a, b) => {
    const aDefault = a.symbol === "RAAPLUSDT";
    const bDefault = b.symbol === "RAAPLUSDT";
    if (aDefault !== bDefault) return aDefault ? -1 : 1;
    return a.baseCoin.localeCompare(b.baseCoin);
  });
  return sorted.filter((market) => !normalized
    || market.baseCoin.toLowerCase().includes(normalized)
    || market.symbol.toLowerCase().includes(normalized)).slice(0, limit);
}

export async function fetchRTokenMarkets(signal?: AbortSignal): Promise<RTokenMarket[]> {
  const response = await fetch("/api/rtoken-markets", {
    cache: "no-store",
    signal: signal ?? AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Bitget instruments request failed (${response.status}).`);
  return parseRTokenMarkets(await response.json());
}
