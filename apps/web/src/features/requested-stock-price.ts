const TICKER = String.raw`(?<![a-z0-9.'’])\$?([a-z][a-z0-9.-]{0,14})(?![a-z0-9.-])`;
const PRICE_REQUEST_PATTERNS = [
  new RegExp(String.raw`\b(?:stock\s+)?(?:price|quote|daily close|closing price)\s+(?:of|for)\s+(?:the\s+)?${TICKER}`, "i"),
  new RegExp(String.raw`${TICKER}(?:['’]s)?\s+(?:(?:current|latest|daily|live)\s+)?(?:stock\s+)?(?:price|quote|daily close|closing price)\b`, "i"),
  new RegExp(String.raw`\bhow much is\s+(?:the\s+)?${TICKER}`, "i"),
];

const NON_TICKER_WORDS = new Set([
  "a", "an", "the", "token", "stock", "share", "rToken", "price", "quote", "close", "closing",
  "today", "now", "currently", "live", "market", "trading", "trade", "value", "it", "this", "that",
]);

/** Extracts an explicitly named ticker only when the question asks for its price or quote. */
export function extractRequestedStockPriceSymbol(question: string): string | null {
  const normalizedQuestion = question.normalize("NFKC").replace(/[‘’]/g, "'");
  for (const pattern of PRICE_REQUEST_PATTERNS) {
    const match = pattern.exec(normalizedQuestion);
    const candidate = match?.[1];
    if (!candidate || NON_TICKER_WORDS.has(candidate.toLowerCase())) continue;
    return candidate.toUpperCase();
  }
  return null;
}
