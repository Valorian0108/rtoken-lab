import type { RTokenCandle } from "./rtoken-candles";

export interface RTokenCandleAnalysis {
  count: number;
  startTimestamp: number;
  endTimestamp: number;
  firstClose: number;
  lastClose: number;
  netChangePercent: number;
  low: { price: number; timestamp: number };
  high: { price: number; timestamp: number };
  largestObservedRise: { percent: number; fromTimestamp: number; toTimestamp: number } | null;
  largestObservedDrop: { percent: number; fromTimestamp: number; toTimestamp: number } | null;
  gapsOverTwoHours: number;
}

/** Descriptive calculations over the same validated hourly close series shown in the chart. */
export function analyzeRTokenCandles(candles: RTokenCandle[]): RTokenCandleAnalysis | null {
  if (candles.length < 2) return null;

  const ordered = [...candles].sort((a, b) => a.timestamp - b.timestamp);
  const first = ordered[0]!;
  const last = ordered.at(-1)!;
  let low = { price: first.close, timestamp: first.timestamp };
  let high = low;
  let largestObservedRise: RTokenCandleAnalysis["largestObservedRise"] = null;
  let largestObservedDrop: RTokenCandleAnalysis["largestObservedDrop"] = null;
  let gapsOverTwoHours = 0;

  for (let index = 0; index < ordered.length; index += 1) {
    const candle = ordered[index]!;
    if (candle.close < low.price) low = { price: candle.close, timestamp: candle.timestamp };
    if (candle.close > high.price) high = { price: candle.close, timestamp: candle.timestamp };

    const previous = ordered[index - 1];
    if (!previous) continue;
    if (candle.timestamp - previous.timestamp > 2 * 60 * 60_000) gapsOverTwoHours += 1;
    const percent = ((candle.close - previous.close) / previous.close) * 100;
    if (percent > 0 && (!largestObservedRise || percent > largestObservedRise.percent)) {
      largestObservedRise = { percent, fromTimestamp: previous.timestamp, toTimestamp: candle.timestamp };
    }
    if (percent < 0 && (!largestObservedDrop || percent < largestObservedDrop.percent)) {
      largestObservedDrop = { percent, fromTimestamp: previous.timestamp, toTimestamp: candle.timestamp };
    }
  }

  return {
    count: ordered.length,
    startTimestamp: first.timestamp,
    endTimestamp: last.timestamp,
    firstClose: first.close,
    lastClose: last.close,
    netChangePercent: ((last.close - first.close) / first.close) * 100,
    low,
    high,
    largestObservedRise,
    largestObservedDrop,
    gapsOverTwoHours,
  };
}

export function formatRTokenCandleEvidence(candles: RTokenCandle[]): string | null {
  const summary = analyzeRTokenCandles(candles);
  if (!summary) return null;

  const movement = (label: string, event: RTokenCandleAnalysis["largestObservedRise"]) => event
    ? `${label}: ${event.percent.toFixed(3)}% from ${new Date(event.fromTimestamp).toISOString()} to ${new Date(event.toTimestamp).toISOString()} (${((event.toTimestamp - event.fromTimestamp) / (60 * 60_000)).toFixed(1)} hours between returned candles).`
    : `${label}: none.`;

  return [
    `Verified Bitget Reality SPOT hourly close series for the selected rToken; quote currency USDT. ${summary.count} candles from ${new Date(summary.startTimestamp).toISOString()} through ${new Date(summary.endTimestamp).toISOString()}.`,
    `Computed from these closes: first ${summary.firstClose} USDT; last ${summary.lastClose} USDT; net change ${summary.netChangePercent.toFixed(3)}%; close low ${summary.low.price} USDT at ${new Date(summary.low.timestamp).toISOString()}; close high ${summary.high.price} USDT at ${new Date(summary.high.timestamp).toISOString()}.`,
    movement("Largest observed close-to-close rise", summary.largestObservedRise),
    movement("Largest observed close-to-close drop", summary.largestObservedDrop),
    `Gaps greater than two hours between returned candle timestamps: ${summary.gapsOverTwoHours}. The chart plots this same series as hourly closes only; candle volume is not supplied to this research answer.`,
    "Use these summary statistics and named UTC observations for interpretation. The app can show the complete close series in the chart, but does not send every candle row into this prompt.",
  ].join("\n");
}
