import { describe, expect, it } from "vitest";
import { isRTokenCandleHistoryStale, parseRTokenCandles, selectRTokenCandleRange } from "./rtoken-candles";

const hour = 60 * 60_000;

describe("parseRTokenCandles", () => {
  it("parses, deduplicates, and sorts Bitget hourly OHLCV rows", () => {
    const candles = parseRTokenCandles({
      code: "00000",
      data: [
        [2 * hour, "11", "13", "10", "12", "4", "48"],
        [hour, "10", "12", "9", "11", "3", "33"],
        [2 * hour, "11", "14", "10", "13", "5", "65"],
      ],
    }, 3 * hour);

    expect(candles).toEqual([
      { timestamp: hour, open: 10, high: 12, low: 9, close: 11, baseVolume: 3, quoteVolume: 33 },
      { timestamp: 2 * hour, open: 11, high: 14, low: 10, close: 13, baseVolume: 5, quoteVolume: 65 },
    ]);
  });

  it("rejects invalid payloads and malformed candles", () => {
    expect(() => parseRTokenCandles({ code: "500", data: [] })).toThrow();
    expect(() => parseRTokenCandles({ code: "00000", data: [[hour, 10, 9, 8, 11, 1, 10], [2 * hour, 10, 11, 9, 10, 1, 10]] }, 3 * hour)).toThrow("fewer than two");
  });

  it("keeps valid old candles for historical display", () => {
    const history = parseRTokenCandles({ code: "00000", data: [[hour, 10, 11, 9, 10, 1, 10], [2 * hour, 10, 11, 9, 10, 1, 10]] }, 5 * hour);
    expect(history).toHaveLength(2);
    expect(isRTokenCandleHistoryStale(history, 5 * hour)).toBe(true);
  });

  it("rejects candles significantly ahead of retrieval time", () => {
    expect(() => parseRTokenCandles({
      code: "00000",
      data: [[hour, 10, 11, 9, 10, 1, 10], [2 * hour + 6 * 60_000, 10, 11, 9, 10, 1, 10]],
    }, 2 * hour)).toThrow("fewer than two");
  });
});

describe("isRTokenCandleHistoryStale", () => {
  it("marks history stale beyond two hours", () => {
    const candles = [{ timestamp: hour, open: 10, high: 10, low: 10, close: 10, baseVolume: 1, quoteVolume: 10 }];
    expect(isRTokenCandleHistoryStale(candles, hour + 2 * hour)).toBe(false);
    expect(isRTokenCandleHistoryStale(candles, hour + 2 * hour + 1)).toBe(true);
    expect(isRTokenCandleHistoryStale([], hour)).toBe(true);
  });
});

describe("selectRTokenCandleRange", () => {
  const candles = Array.from({ length: 1001 }, (_, index) => ({
    timestamp: index * hour,
    open: 10,
    high: 11,
    low: 9,
    close: 10 + index,
    baseVolume: 1,
    quoteVolume: 10,
  }));

  it("selects observed candles inside 24-hour, 7-day, and 30-day windows", () => {
    expect(selectRTokenCandleRange(candles, "1D")).toHaveLength(24);
    expect(selectRTokenCandleRange(candles, "1W")).toHaveLength(168);
    expect(selectRTokenCandleRange(candles, "1M")).toHaveLength(720);
    expect(selectRTokenCandleRange(candles, "1D")[0]?.timestamp).toBe(977 * hour);
  });

  it("does not mutate source ordering and returns available candles for short histories", () => {
    const reversed = candles.slice(-3).reverse();
    expect(selectRTokenCandleRange(reversed, "1M").map((candle) => candle.timestamp)).toEqual([998 * hour, 999 * hour, 1000 * hour]);
    expect(reversed[0]?.timestamp).toBe(1000 * hour);
  });
});
