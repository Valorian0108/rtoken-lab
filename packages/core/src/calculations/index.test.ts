import { describe, expect, it } from "vitest";
import type { NormalizedKline, SourceMetadata, Symbol, Timestamp } from "../types";
import { calculatePremiumSeries } from "./index";

const nativeSource: SourceMetadata = {
  sourceId: "native-history",
  provider: "bitget-mcp",
  endpoint: "equity_price_historical",
  requestedAt: "2026-09-25T00:00:00.000Z",
  receivedAt: "2026-09-25T00:00:01.000Z",
  isLive: false,
};

const tokenSource: SourceMetadata = {
  sourceId: "token-history",
  provider: "bitget-mcp",
  endpoint: "crypto_spot_kline",
  requestedAt: "2026-09-25T00:00:00.000Z",
  receivedAt: "2026-09-25T00:00:01.000Z",
  isLive: false,
};

function kline(
  symbol: string,
  timestamp: number,
  close: number,
  source: "equity" | "crypto-spot",
  sourceMetadata: SourceMetadata,
): NormalizedKline {
  return {
    symbol: symbol as Symbol,
    timestamp: timestamp as Timestamp,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1,
    source,
    sourceMetadata,
  };
}

describe("calculatePremiumSeries", () => {
  it("returns only exact-timestamp pairs, sorted chronologically", () => {
    const native = [
      kline("AAPL", 300, 105, "equity", nativeSource),
      kline("AAPL", 100, 100, "equity", nativeSource),
      kline("AAPL", 200, 102, "equity", nativeSource),
    ];
    const token = [
      kline("RAAPL/USDT", 200, 103, "crypto-spot", tokenSource),
      kline("RAAPL/USDT", 400, 110, "crypto-spot", tokenSource),
      kline("RAAPL/USDT", 100, 101, "crypto-spot", tokenSource),
    ];

    const series = calculatePremiumSeries(native, token);

    expect(series.map((point) => point.timestamp)).toEqual([100, 200]);
    expect(series.map((point) => point.premiumBps)[0]).toBeCloseTo(100);
    expect(series.map((point) => point.premiumBps)[1]).toBeCloseTo(10000 / 102);
    expect(series[0]?.nativeSource.sourceId).toBe("native-history");
    expect(series[0]?.rTokenSource.sourceId).toBe("token-history");
  });

  it("returns no observations when timestamps do not match exactly", () => {
    const native = [kline("AAPL", 100, 100, "equity", nativeSource)];
    const token = [kline("RAAPL/USDT", 101, 101, "crypto-spot", tokenSource)];

    expect(calculatePremiumSeries(native, token)).toEqual([]);
  });
});
