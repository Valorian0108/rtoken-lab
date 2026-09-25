import { useState, useEffect, useCallback, useRef } from "react";
import { askQwenResearch } from "@rtoken-lab/mcp-client";
import { getDemoScenario } from "../mechanics-canvas/demo-scenarios";
import { Box, Text, Button, Input, LoadingState, EmptyState, Tooltip } from "@rtoken-lab/ui";
import { canvasEventBus, createResearchQuestion, createResearchAnswer } from "@rtoken-lab/core";
import type { ResearchMessage, CanvasEvent, NormalizedPremium } from "@rtoken-lab/core";

const MOCK_MODE = import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_MCP;

interface ResearchPanelProps {
  selectedSymbol: string | null;
  timeRange: { start: number; end: number } | null;
  livePremium?: NormalizedPremium | null;
}

const SUGGESTED_QUESTIONS = [
  "What is the current premium for this rToken?",
  "Show me the largest premium event this week",
  "Compare rToken and native price movement",
  "What happened around this timestamp?",
  "Explain the mint/redeem mechanism",
  "What macro events could explain this premium?",
];

export function ResearchPanel({ selectedSymbol, timeRange, livePremium }: ResearchPanelProps) {
  const [messages, setMessages] = useState<ResearchMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const addMessage = useCallback((message: ResearchMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const question = inputValue.trim();
    setInputValue("");
    setSuggestionsOpen(false);

    // Add user question
    addMessage(createResearchQuestion(question));
    setIsLoading(true);

    try {
      const scenario = getDemoScenario(selectedSymbol ?? "DEFAULT");
      const context = [
        `Demo scenario: ${scenario.label}`,
        scenario.description,
        livePremium
          ? [
            `Native price: ${livePremium.nativePrice}`,
            `rToken price: ${livePremium.rTokenPrice}`,
            `Premium: ${livePremium.premiumBps} bps`,
            `Observed at: ${new Date(livePremium.timestamp * 1000).toISOString()}`,
            `Native source: ${livePremium.nativeSource.endpoint}`,
            `rToken source: ${livePremium.rTokenSource.endpoint}`,
          ].join("\n")
        : "No live premium snapshot is currently available. Do not invent current values.",
      ].join("\n");

      const qwen = await askQwenResearch({ question, symbol: selectedSymbol ?? undefined, context });
      const mockResponse = createResearchAnswer(
        qwen.text,
        [
          ...(livePremium
            ? [
                {
                  endpoint: livePremium.nativeSource.endpoint,
                  timestamp: new Date().toISOString(),
                  data: livePremium.nativePrice,
                },
                {
                  endpoint: livePremium.rTokenSource.endpoint,
                  timestamp: new Date().toISOString(),
                  data: livePremium.rTokenPrice,
                },
              ]
            : []),
        ],
      );
      addMessage(mockResponse);

      // Emit canvas events if any
      if (mockResponse.type === "answer" && mockResponse.canvasEvents) {
        mockResponse.canvasEvents.forEach((event) => {
          canvasEventBus.emit(event);
        });
      }
    } catch (error) {
      addMessage({
        type: "error",
        message: "Failed to get response. Please try again.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (question: string) => {
    setInputValue(question);
    setSuggestionsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        type: "answer",
        text: `Welcome to rToken Lab. I can help you understand tokenized stock mechanics for **${selectedSymbol || "a symbol"}**.

Ask me about:
• Current premium/discount vs native stock
• Historical premium events and their causes
• Mint/redeem mechanics and arbitrage windows
• Weekend/after-hours price behavior
• Funding rates and carry costs

Select a symbol from the header to begin.`,
        sources: [],
        timestamp: new Date().toISOString(),
      });
    }
  }, [selectedSymbol, addMessage]);

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "transparent",
      }}
    >
      <Box
        style={{
          padding: "var(--space-4)",
          borderBottom: "1px solid var(--color-border-subtle)",
          flexShrink: 0,
        }}
      >
        <Box flex alignItems="center" justifyContent="space-between" gap={2}>
          <Box flex alignItems="center" gap={2}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <Text variant="heading-sm" weight="semibold">Research Assistant</Text>
          </Box>
          {selectedSymbol && (
            <Tooltip content={`Analyzing ${selectedSymbol}`} position="top">
              <span style={{
                padding: "var(--space-1) var(--space-2)",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-xs)",
                fontWeight: "var(--font-medium)",
                fontFamily: "var(--font-mono)",
                background: "var(--color-accent-info-bg)",
                color: "var(--color-accent-info-fg)",
              }}>
                {selectedSymbol}
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box
        style={{
          flex: 1,
          overflow: "auto",
          padding: "var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        {messages.map((msg, i) => (
          <Box
            key={`${msg.timestamp}-${i}`}
            style={{
              display: "flex",
              gap: "var(--space-3)",
              maxWidth: "100%",
            }}
          >
            <Box
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "var(--text-xs)",
                fontWeight: "var(--font-bold)",
                background: msg.type === "question"
                  ? "var(--color-accent-info-bg)"
                  : msg.type === "answer"
                  ? "var(--color-accent-positive-bg)"
                  : "var(--color-accent-negative-bg)",
                color: msg.type === "question"
                  ? "var(--color-accent-info-fg)"
                  : msg.type === "answer"
                  ? "var(--color-accent-positive-fg)"
                  : "var(--color-accent-negative-fg)",
              }}
            >
              {msg.type === "question" ? "?" : msg.type === "answer" ? "✓" : "!"}
            </Box>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Box flex alignItems="center" gap={2} style={{ marginBottom: "var(--space-1)" }}>
                <Text variant="caption" color="muted" mono>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Text>
                <Text variant="caption" weight="medium" color={msg.type === "question" ? "primary" : msg.type === "answer" ? "positive" : "negative"}>
                  {msg.type === "question" ? "You" : msg.type === "answer" ? "Lab" : "Error"}
                </Text>
              </Box>
              <Text
                variant="body-sm"
                color="primary"
                className="telemetry-log"
                style={{ whiteSpace: "pre-wrap", lineHeight: "var(--leading-relaxed)" }}
              >
                {formatTelemetryText(msg.type === "error" ? msg.message : msg.text)}
              </Text>

              {msg.type === "answer" && msg.sources && msg.sources.length > 0 && (
                <Box style={{ marginTop: "var(--space-2)", display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
                  {msg.sources.map((source, si) => (
                    <Tooltip key={si} content={`${source.endpoint} • ${new Date(source.timestamp).toLocaleString()}`} position="top">
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "var(--space-1)",
                        padding: "var(--space-1) var(--space-2)",
                        borderRadius: "var(--radius-full)",
                        fontSize: "var(--text-xs)",
                        fontFamily: "var(--font-mono)",
                        background: "var(--color-bg-base)",
                        border: "1px solid var(--color-border-subtle)",
                        color: "var(--color-fg-muted)",
                        cursor: "default",
                      }}>
                        <span style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: source.endpoint.includes("equity") ? "var(--color-accent-info)"
                            : source.endpoint.includes("spot") ? "var(--color-accent-negative)"
                            : "var(--color-accent-warning)",
                        }} />
                        {source.endpoint}
                      </span>
                    </Tooltip>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ))}
        <div ref={messagesEndRef} />
        {isLoading && (
          <LoadingState variant="dots" size="sm" message="Analyzing..." />
        )}
      </Box>

      <Box
        style={{
          padding: "var(--space-4)",
          borderTop: "1px solid var(--color-border-subtle)",
          flexShrink: 0,
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <Box
            style={{
              position: "relative",
            }}
          >
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setSuggestionsOpen(e.target.value.length > 0);
              }}
              onFocus={(event) => {
                setSuggestionsOpen(inputValue.length > 0);
                event.currentTarget.style.borderColor = "var(--color-border-focus)";
                event.currentTarget.style.boxShadow = "var(--shadow-focus)";
              }}
              onBlur={(event) => {
                setTimeout(() => setSuggestionsOpen(false), 200);
                event.currentTarget.style.borderColor = "var(--color-border-default)";
                event.currentTarget.style.boxShadow = "none";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about rToken mechanics, premium events, mint/redeem..."
              style={{
                width: "100%",
                minHeight: 68,
                maxHeight: 140,
                padding: "var(--space-3)",
                paddingRight: "var(--space-10)",
                background: "var(--color-bg-base)",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-default)",
                color: "var(--color-fg-primary)",
                fontSize: "var(--text-sm)",
                lineHeight: "var(--leading-relaxed)",
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
                transition: "border-color var(--duration-fast), box-shadow var(--duration-fast)",
              }}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputValue.trim() || isLoading}
              style={{
                position: "absolute",
                bottom: "var(--space-2)",
                right: "var(--space-2)",
              }}
            >
              {isLoading ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" strokeOpacity="0.75" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </Button>
          </Box>

          {suggestionsOpen && inputValue.length < 50 && (
            <Box style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
              {SUGGESTED_QUESTIONS
                .filter((q) => q.toLowerCase().includes(inputValue.toLowerCase()))
                .slice(0, 4)
                .map((q) => (
                  <Button
                    key={q}
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => handleSuggestionClick(q)}
                    style={{ fontSize: "var(--text-xs)", padding: "var(--space-1) var(--space-2)" }}
                  >
                    {q}
                  </Button>
                ))}
            </Box>
          )}
        </form>
      </Box>
    </Box>
  );
}


function formatTelemetryText(text: string): string {
  return text
    .replace(/^•\s*/gm, "> ")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^[-*]\s+/gm, "> ");
}

function generateMockResponse(
  question: string,
  symbol: string | null,
  timeRange: { start: number; end: number } | null
): ResearchMessage {
  const lower = question.toLowerCase();

  if (lower.includes("premium") || lower.includes("discount")) {
    return createResearchAnswer(
      `The current premium for **${symbol || "AAPL"}** rToken is **+0.72%** (72 bps) vs native stock.

This reflects temporary weekend demand as US markets are closed while rToken trades 24/7. The premium typically reverts by Monday 14:30 UTC when native markets reopen.

**Key observations:**
• Premium spiked to +1.8% during Sunday's Fed speech
• Average weekend premium: +0.45% over last 30 days
• Reversion half-life: ~4.2 hours after market open

The premium is calculated as: (rToken Price - Native Price) / Native Price × 100. Native price from IEX feed, rToken from Bitget spot market.`,
      [
        { endpoint: "equity_price_quote", timestamp: new Date().toISOString(), data: { symbol } },
        { endpoint: "crypto_spot_ticker", timestamp: new Date().toISOString(), data: { symbol: `R${symbol}/USDT` } },
      ],
      [
        createHighlightTimeRange(
          Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60,
          Math.floor(Date.now() / 1000) - 1 * 24 * 60 * 60,
          "Weekend premium spike detected"
        ),
      ]
    );
  }

  if (lower.includes("mint") || lower.includes("redeem") || lower.includes("arbitrage")) {
    return createResearchAnswer(
      `**Mint/Redeem Mechanism for ${symbol || "AAPL"} rToken**

When rToken trades at a premium to NAV:
1. **Mint**: Authorized participants buy native shares → deliver to custodian → receive new rTokens → sell rTokens at premium → pocket difference
2. **Redeem**: When rToken trades at discount, buy rTokens → redeem for native shares → sell shares at higher price

**Current state for ${symbol || "AAPL"}:**
• No active mint/redeem events in last 7 days
• Premium of +0.72% is below typical mint threshold (+1.5%)
• Binance perpetual funding: 0.008%/8h (annualized ~3.5%)

**Arbitrage window** opens when premium > mint cost (fees + spread + custody). For AAPL, estimated threshold: +1.5% to +2%.`,
      [
        { endpoint: "crypto_market", timestamp: new Date().toISOString(), data: { is_rwa: true } },
        { endpoint: "crypto_futures_funding_rate", timestamp: new Date().toISOString(), data: { symbol: `${symbol}/USDT` } },
      ],
      [
        createSetView("flow"),
      ]
    );
  }

  if (lower.includes("weekend") || lower.includes("after.hours") || lower.includes("24/7")) {
    return createResearchAnswer(
      `**7×24 Price Discovery for ${symbol || "AAPL"}**

rToken enables continuous price discovery while native US markets are closed (16:00-09:30 ET, weekends, holidays).

**Weekend behavior (last 4 weekends):**
| Weekend | Peak Premium | Duration | Trigger |
|---------|-------------|----------|---------|
| Sep 14-15 | +1.8% | 14h | Fed policy speech |
| Sep 7-8 | +0.3% | 6h | Low volume drift |
| Aug 31-Sep 1 | +1.1% | 10h | Geopolitical news |
| Aug 24-25 | +0.6% | 8h | Earnings leak |

**Pattern**: Premiums build during Asian/European hours (Sunday 20:00-23:00 UTC), peak before US pre-market, revert within 2-4 hours of Monday open.

This creates a **mean-reversion opportunity**: short rToken premium Sunday night, cover Monday 14:30 UTC.`,
      [
        { endpoint: "equity_price_historical", timestamp: new Date().toISOString(), data: { symbol } },
        { endpoint: "crypto_futures_kline", timestamp: new Date().toISOString(), data: { symbol: `${symbol}/USDT` } },
      ],
      [
        createHighlightTimeRange(
          Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
          Math.floor(Date.now() / 1000),
          "Last 7 days weekend premiums"
        ),
        createSetView("heatmap"),
      ]
    );
  }

  // Default response
  return createResearchAnswer(
    `I can help you analyze **${symbol || "AAPL"}** rToken mechanics. Try asking about:

• **Premium/Discount**: "What's the current premium?" "Show largest premium this week"
• **Mint/Redeem**: "Explain the arb mechanism" "When does mint become profitable?"
• **Time Analysis**: "Weekend behavior" "After-hours price action"
• **Funding**: "What's the funding rate?" "Cost of carry vs native"

Select a time range in the timeline or click a heatmap cell for focused analysis.`,
    [],
    []
  );
}

function createHighlightTimeRange(start: number, end: number, reason: string): CanvasEvent {
  return {
    type: "highlight-time-range",
    start: new Date(start * 1000).toISOString(),
    end: new Date(end * 1000).toISOString(),
    reason,
  };
}

function createSetView(view: "price" | "premium" | "heatmap" | "flow" | "funding"): CanvasEvent {
  return { type: "set-view", view };
}