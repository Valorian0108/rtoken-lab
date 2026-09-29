import { describe, expect, it } from "vitest";
import { parseRTokenSnapshot } from "./rtoken-snapshot";

const now = 1790429076527;
const ticker = {
  code: "00000",
  msg: "success",
  appRetrievedAt: new Date(now).toISOString(),
  data: [{
    symbol: "RAAPLUSDT",
    ts: "1790429055417",
    lastPrice: "340.01",
    bid1Price: "340.1",
    ask1Price: "341.5",
    bid1Size: "0.9828",
    ask1Size: "0.2743",
  }],
};

describe("parseRTokenSnapshot", () => {
  it("normalizes a fresh Bitget ticker and flags unusual quotes", () => {
    const parsed = parseRTokenSnapshot(ticker, now);
    expect(parsed.symbol).toBe("RAAPLUSDT");
    expect(parsed.lastPrice).toBe(340.01);
    expect(parsed.bidPrice).toBe(340.1);
    expect(parsed.askPrice).toBe(341.5);
    expect(parsed.spreadPercent).toBeCloseTo(0.4109, 3);
    expect(parsed.warnings).toHaveLength(2);
    expect(Date.parse(parsed.tickerTimestamp)).toBe(1790429055417);
  });

  it("rejects a stale ticker", () => {
    expect(() => parseRTokenSnapshot({
      ...ticker,
      data: [{ ...ticker.data[0], ts: "1790427300000" }],
    }, now)).toThrow("stale");
  });

  it("rejects another instrument instead of silently substituting it", () => {
    expect(() => parseRTokenSnapshot({
      ...ticker,
      data: [{ ...ticker.data[0], symbol: "AAPLUSDT" }],
    }, now)).toThrow("verified RAAPLUSDT");
  });

  it("accepts a different exact symbol only when it is explicitly requested", () => {
    const requested = { ...ticker, data: [{ ...ticker.data[0], symbol: "RNVIDIAUSDT" }] };
    expect(parseRTokenSnapshot(requested, now, "RNVIDIAUSDT").symbol).toBe("RNVIDIAUSDT");
    expect(() => parseRTokenSnapshot(requested, now)).toThrow("verified RAAPLUSDT");
  });

  it("rejects failed or incomplete Bitget responses", () => {
    expect(() => parseRTokenSnapshot({ code: "500" }, now)).toThrow("Bitget ticker request failed");
    expect(() => parseRTokenSnapshot({ ...ticker, data: [{ symbol: "RAAPLUSDT" }] }, now)).toThrow("missing valid price");
  });

  it("allows a valid zero-size best quote without inventing liquidity", () => {
    const parsed = parseRTokenSnapshot({
      ...ticker,
      data: [{ ...ticker.data[0], bid1Size: "0" }],
    }, now);
    expect(parsed.bidSize).toBe(0);
  });
});
