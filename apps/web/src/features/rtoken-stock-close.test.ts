import { describe, expect, it } from "vitest";
import { parseRTokenStockClose } from "./rtoken-stock-close";

describe("parseRTokenStockClose", () => {
  it("uses the most recent dated daily close and records its provider and retrieval time", () => {
    expect(parseRTokenStockClose([
      { date: "2026-09-25", close: 252.31 },
      { date: "2026-09-28", close: 253.18 },
    ], "AAPL", "2026-09-29T12:00:00.000Z", "demo")).toEqual({
      symbol: "AAPL",
      close: 253.18,
      date: "2026-09-28",
      retrievedAt: "2026-09-29T12:00:00.000Z",
      source: "EODHD",
      tokenType: "demo",
    });
  });

  it("rejects provider errors, symbol mismatches, and invalid close values", () => {
    expect(() => parseRTokenStockClose({ error: "rate limited" }, "AAPL")).toThrow("invalid daily-history");
    expect(() => parseRTokenStockClose([], "AAPL")).toThrow("No dated");
    expect(() => parseRTokenStockClose([{ date: "2026-09-28", close: "0" }], "AAPL")).toThrow("invalid");
  });
});
