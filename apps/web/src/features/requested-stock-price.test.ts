import { describe, expect, it } from "vitest";
import { extractRequestedStockPriceSymbol } from "./requested-stock-price";

describe("extractRequestedStockPriceSymbol", () => {
  it.each([
    ["What is the price of AAPL?", "AAPL"],
    ["what's the price of AAPL", "AAPL"],
    ["AAPL price", "AAPL"],
    ["What is AAPL's price", "AAPL"],
    ["What is AAPL’s price", "AAPL"],
    ["What is AAPL’s current stock price?", "AAPL"],
    ["How much is $aapl?", "AAPL"],
    ["What was the daily close for BRK.B?", "BRK.B"],
  ])("extracts an explicit ticker from %s", (question, expected) => {
    expect(extractRequestedStockPriceSymbol(question)).toBe(expected);
  });

  it("does not mistake a selected token question for a stock price lookup", () => {
    expect(extractRequestedStockPriceSymbol("What does the current MU token snapshot show?")).toBeNull();
    expect(extractRequestedStockPriceSymbol("What does this market quote establish?")).toBeNull();
  });

  it("ignores generic words instead of treating them as ticker symbols", () => {
    expect(extractRequestedStockPriceSymbol("What is the price of the token?")).toBeNull();
  });
});
