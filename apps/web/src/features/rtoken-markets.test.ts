import { describe, expect, it } from "vitest";
import { parseRTokenMarkets, searchRTokenMarkets } from "./rtoken-markets";

const instrument = (overrides: Record<string, string> = {}) => ({
  symbol: "RAAPLUSDT",
  category: "SPOT",
  baseCoin: "rAAPL",
  quoteCoin: "USDT",
  symbolType: "stock",
  status: "online",
  isReality: "yes",
  ...overrides,
});

describe("parseRTokenMarkets", () => {
  it("keeps only online Bitget Reality USDT stock spot markets and sorts them", () => {
    const markets = parseRTokenMarkets({
      code: "00000",
      data: [
        instrument({ symbol: "RNVIDIAUSDT", baseCoin: "rNVIDIA" }),
        instrument(),
        instrument({ symbol: "RDELISTEDUSDT", baseCoin: "rDELISTED", status: "offline" }),
        instrument({ symbol: "RNOTREALITYUSDT", baseCoin: "rNOTREALITY", isReality: "no" }),
        instrument({ symbol: "RCOINUSDT", baseCoin: "rCOIN", symbolType: "coin" }),
        instrument({ symbol: "RAAPLUSDC", quoteCoin: "USDC" }),
      ],
    });

    expect(markets).toEqual([
      { symbol: "RAAPLUSDT", baseCoin: "rAAPL" },
      { symbol: "RNVIDIAUSDT", baseCoin: "rNVIDIA" },
    ]);
  });

  it("requires a successful response and verified RAAPL default", () => {
    expect(() => parseRTokenMarkets({ code: "500", data: [] })).toThrow();
    expect(() => parseRTokenMarkets({ code: "00000", data: [instrument({ symbol: "RNVIDIAUSDT", baseCoin: "rNVIDIA" })] }))
      .toThrow("did not confirm RAAPLUSDT");
  });

  it("keeps RAAPL at the top and searches base and exchange symbols", () => {
    const markets = [
      { symbol: "RNVIDIAUSDT", baseCoin: "rNVIDIA" },
      { symbol: "RAAPLUSDT", baseCoin: "rAAPL" },
      { symbol: "RTSLAUSDT", baseCoin: "rTSLA" },
    ];

    expect(searchRTokenMarkets(markets, "").map(({ symbol }) => symbol)[0]).toBe("RAAPLUSDT");
    expect(searchRTokenMarkets(markets, "nvIdIa")).toEqual([{ symbol: "RNVIDIAUSDT", baseCoin: "rNVIDIA" }]);
    expect(searchRTokenMarkets(markets, "rtsla")).toEqual([{ symbol: "RTSLAUSDT", baseCoin: "rTSLA" }]);
  });
});
