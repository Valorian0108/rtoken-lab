import type {
  Price,
  Percentage,
  PremiumBps,
  Symbol,
  Timestamp,
  SourceMetadata,
  NormalizedQuote,
  NormalizedKline,
  NormalizedPremium,
} from "../types";

/**
 * Calculate premium in basis points and percentage
 * premium = (rToken - native) / native * 10000 (bps)
 */
export function calculatePremium(
  nativePrice: Price,
  rTokenPrice: Price
): { premiumBps: PremiumBps; premiumPercent: Percentage } {
  if (nativePrice === 0) {
    return {
      premiumBps: 0 as PremiumBps,
      premiumPercent: 0 as Percentage,
    };
  }
  const premiumRatio = (rTokenPrice - nativePrice) / nativePrice;
  return {
    premiumBps: (premiumRatio * 10000) as PremiumBps,
    premiumPercent: (premiumRatio * 100) as Percentage,
  };
}

/**
 * Build normalized premium data from two quotes
 */
export function buildPremiumData(
  nativeQuote: NormalizedQuote,
  rTokenQuote: NormalizedQuote
): NormalizedPremium {
  const { premiumBps, premiumPercent } = calculatePremium(
    nativeQuote.lastPrice,
    rTokenQuote.lastPrice
  );
  const timestamp = Math.max(nativeQuote.timestamp, rTokenQuote.timestamp);

  return {
    nativeSymbol: nativeQuote.symbol,
    rTokenSymbol: rTokenQuote.symbol,
    nativePrice: nativeQuote.lastPrice,
    rTokenPrice: rTokenQuote.lastPrice,
    premiumBps,
    premiumPercent,
    timestamp: timestamp as Timestamp,
    nativeSource: nativeQuote.sourceMetadata,
    rTokenSource: rTokenQuote.sourceMetadata,
  };
}

/**
 * Calculate premium time series from aligned klines
 */
export function calculatePremiumSeries(
  nativeKlines: NormalizedKline[],
  rTokenKlines: NormalizedKline[]
): NormalizedPremium[] {
  const nativeMap = new Map(nativeKlines.map(k => [k.timestamp, k]));
  const rTokenMap = new Map(rTokenKlines.map(k => [k.timestamp, k]));

  const allTimestamps = new Set([...nativeMap.keys(), ...rTokenMap.keys()]);
  const sortedTimestamps = [...allTimestamps].sort((a, b) => a - b);

  return sortedTimestamps
    .map(ts => {
      const native = nativeMap.get(ts);
      const rToken = rTokenMap.get(ts);
      if (!native || !rToken) return null;
      return buildPremiumData(
        { ...native, lastPrice: native.close, prevClose: native.close, change: 0, changePercent: 0 },
        { ...rToken, lastPrice: rToken.close, prevClose: rToken.close, change: 0, changePercent: 0 }
      );
    })
    .filter((p): p is NormalizedPremium => p !== null);
}

/**
 * Calculate simple moving average
 */
export function calculateSMA(values: number[], period: number): number[] {
  if (values.length < period) return [];
  const result: number[] = [];
  for (let i = period - 1; i < values.length; i++) {
    const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
}

/**
 * Calculate exponential moving average
 */
export function calculateEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const result: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    result.push(values[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

/**
 * Calculate rolling volatility (standard deviation of returns)
 */
export function calculateRollingVolatility(
  prices: number[],
  period: number
): number[] {
  if (prices.length < period + 1) return [];
  const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
  const result: number[] = [];
  for (let i = period - 1; i < returns.length; i++) {
    const slice = returns.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / slice.length;
    result.push(Math.sqrt(variance));
  }
  return result;
}

/**
 * Calculate max drawdown from price series
 */
export function calculateMaxDrawdown(prices: number[]): number {
  if (prices.length < 2) return 0;
  let peak = prices[0];
  let maxDD = 0;
  for (const price of prices) {
    if (price > peak) peak = price;
    const dd = (peak - price) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

/**
 * Calculate Sharpe ratio from returns
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate = 0
): number {
  if (returns.length < 2) return 0;
  const excessReturns = returns.map(r => r - riskFreeRate / 252);
  const mean = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length;
  const std = Math.sqrt(
    excessReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (excessReturns.length - 1)
  );
  return std === 0 ? 0 : mean / std * Math.sqrt(252);
}

/**
 * Time utilities
 */
export function now(): Timestamp {
  return Math.floor(Date.now() / 1000) as Timestamp;
}

export function daysAgo(days: number): Timestamp {
  return (Math.floor(Date.now() / 1000) - days * 24 * 60 * 60) as Timestamp;
}

export function formatTimestamp(ts: Timestamp): string {
  return new Date(ts * 1000).toISOString();
}

export function formatPremium(bps: PremiumBps): string {
  const percent = bps / 100;
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

/**
 * Symbol mapping utilities
 */
export function toPerpetualSymbol(nativeSymbol: Symbol): string {
  return `${nativeSymbol}/USDT`;
}

export function toSpotSymbol(nativeSymbol: Symbol): string {
  return `R${nativeSymbol}/USDT`;
}

export function toSpotBase(nativeSymbol: Symbol): string {
  return `r${nativeSymbol}`;
}

export function fromPerpetualSymbol(symbol: string): Symbol | null {
  const match = symbol.match(/^([A-Z]+)\/USDT$/);
  return match ? (match[1] as Symbol) : null;
}

export function fromSpotSymbol(symbol: string): Symbol | null {
  const match = symbol.match(/^R([A-Z]+)\/USDT$/);
  return match ? (match[1] as Symbol) : null;
}

export function isPerpetualSymbol(symbol: string): boolean {
  return /^[A-Z]+\/USDT$/.test(symbol);
}

export function isSpotSymbol(symbol: string): boolean {
  return /^R[A-Z]+\/USDT$/.test(symbol);
}

/**
 * Exchange constants
 */
export const EXCHANGES = {
  BINANCE: "binance" as const,
  BITGET: "bitget" as const,
} as const;

export const MARKET_TYPES = {
  PERPETUAL: "perpetual" as const,
  SPOT: "spot" as const,
} as const;