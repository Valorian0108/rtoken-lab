import { describe, expect, it } from "vitest";
import { formatQuotePrice, formatQuoteSize } from "./quote-format";

describe("quote formatting", () => {
  it("uses instrument precision without dropping small price increments", () => {
    expect(formatQuotePrice(0.00127, 5, "en-US")).toBe("0.00127");
    expect(formatQuotePrice(12.3, 2, "en-US")).toBe("12.30");
  });

  it("preserves useful precision when instrument metadata is absent or invalid", () => {
    expect(formatQuotePrice(0.0000012345, undefined, "en-US")).toBe("0.0000012345");
    expect(formatQuotePrice(12.3456789012345, 99, "en-US")).toBe("12.3456789012");
  });

  it("formats size values neutrally without asserting an unverified unit", () => {
    expect(formatQuoteSize(0.9828, "en-US")).toBe("0.9828");
  });

  it("does not render non-finite or non-positive prices as market quotes", () => {
    expect(formatQuotePrice(Number.NaN, undefined, "en-US")).toBe("Unavailable");
    expect(formatQuotePrice(0, undefined, "en-US")).toBe("Unavailable");
    expect(formatQuoteSize(Number.POSITIVE_INFINITY, "en-US")).toBe("Unavailable");
  });
});
