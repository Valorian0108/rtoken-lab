import { describe, expect, it } from "vitest";
import { analyzeRTokenCandles, buildRTokenCandlePathSegments, formatRTokenCandleEvidence } from "./rtoken-candle-analysis";
import type { RTokenCandle } from "./rtoken-candles";

const hour = 60 * 60_000;
const candles: RTokenCandle[] = [
  { timestamp: hour, open: 100, high: 101, low: 99, close: 100, baseVolume: 1, quoteVolume: 100 },
  { timestamp: 2 * hour, open: 100, high: 105, low: 100, close: 104, baseVolume: 1, quoteVolume: 104 },
  { timestamp: 3 * hour, open: 104, high: 104, low: 98, close: 99, baseVolume: 1, quoteVolume: 99 },
  { timestamp: 6 * hour, open: 99, high: 102, low: 99, close: 101, baseVolume: 1, quoteVolume: 101 },
];

describe("rToken candle research evidence", () => {
  it("summarizes plotted closes, the largest observed moves, and timestamp gaps", () => {
    expect(analyzeRTokenCandles(candles)).toEqual({
      count: 4,
      startTimestamp: hour,
      endTimestamp: 6 * hour,
      firstClose: 100,
      lastClose: 101,
      netChangePercent: 1,
      low: { price: 99, timestamp: 3 * hour },
      high: { price: 104, timestamp: 2 * hour },
      largestObservedRise: { percent: 4, fromTimestamp: hour, toTimestamp: 2 * hour },
      largestObservedDrop: { percent: (99 - 104) / 104 * 100, fromTimestamp: 2 * hour, toTimestamp: 3 * hour },
      gapsOverTwoHours: 1,
    });
  });

  it("provides concise source-labeled summary evidence with UTC timestamps", () => {
    const evidence = formatRTokenCandleEvidence(candles);
    expect(evidence).toContain("Verified Bitget Reality SPOT hourly close series");
    expect(evidence).toContain("Largest observed close-to-close rise: 4.000%");
    expect(evidence).toContain("Gaps greater than two hours");
    expect(evidence).toContain("first 100 USDT; last 101 USDT; net change 1.000%");
    expect(evidence).toContain("1970-01-01T02:00:00.000Z");
    expect(evidence).toContain("candle volume is not supplied");
    expect(evidence).not.toContain("1970-01-01T01:00:00.000Z 100");
  });

  it("does not create a summary when fewer than two closes are available", () => {
    expect(analyzeRTokenCandles(candles.slice(0, 1))).toBeNull();
  });

  it("splits plotted paths at the same greater-than-two-hour gap used by analysis", () => {
    const segments = buildRTokenCandlePathSegments(candles, 100, 50, 90, 110);
    expect(segments).toHaveLength(2);
    expect(segments[0]?.linePath).toBe("M0.00,25.00 L20.00,15.00 L40.00,27.50");
    expect(segments[1]?.linePath).toBe("M100.00,22.50");
    expect(segments[0]?.areaPath).toContain("L40.00,50.00 L0.00,50.00 Z");
    expect(segments[1]?.areaPath).toBeNull();
  });

  it("sorts observations and handles duplicates, contiguous rows, and a single point", () => {
    const duplicateHour = { ...candles[1]!, close: 103 };
    const segments = buildRTokenCandlePathSegments([candles[2]!, duplicateHour, candles[0]!, candles[1]!], 100, 50, 90, 110);
    expect(segments).toHaveLength(1);
    expect(segments[0]?.linePath).toBe("M0.00,25.00 L50.00,15.00 L100.00,27.50");
    expect(buildRTokenCandlePathSegments(candles.slice(0, 1), 100, 50, 90, 110)[0]?.singleton).toEqual({ x: 0, y: 25 });
    expect(buildRTokenCandlePathSegments([], 100, 50, 90, 110)).toEqual([]);
  });
});
