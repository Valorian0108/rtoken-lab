import { useState, useEffect, useCallback, useRef } from "react";
import { askQwenResearch } from "@rtoken-lab/mcp-client";
import { Box, Text, Button, Tooltip } from "@rtoken-lab/ui";
import { canvasEventBus, createResearchQuestion, createResearchAnswer } from "@rtoken-lab/core";
import type { ResearchMessage } from "@rtoken-lab/core";
import type { RTokenSnapshot } from "../rtoken-snapshot";
import type { RTokenCandle, RTokenCandleRange } from "../rtoken-candles";
import { formatRTokenCandleEvidence } from "../rtoken-candle-analysis";
import type { RTokenStockClose } from "../rtoken-stock-close";
import { fetchRTokenStockClose } from "../rtoken-stock-close";
import { extractRequestedStockPriceSymbol } from "../requested-stock-price";

interface ResearchPanelProps {
  titleId: string;
  rTokenSnapshot?: RTokenSnapshot | null;
  snapshotStatus: "loading" | "live" | "unavailable";
  candles: RTokenCandle[];
  candleStatus: "loading" | "live" | "unavailable";
  candleHistoryStale: boolean;
  candleRetrievedAt: string | null;
  symbol: string;
  candleRange: RTokenCandleRange;
  stockClose: RTokenStockClose | null;
  stockCloseStatus: "loading" | "available" | "unavailable";
  stockCloseError: string | null;
}

const SUGGESTED_QUESTIONS = [
  "What does this Bitget snapshot establish, and what can’t it establish?",
  "What changed over the displayed hourly rToken history?",
  "Are the bid, ask, and last price internally consistent?",
  "What additional evidence would explain this rToken’s price formation?",
  "How does the daily stock close differ in timing from the Bitget quote?",
];

export function ResearchPanel({ titleId, rTokenSnapshot, snapshotStatus, candles, candleStatus, candleHistoryStale, candleRetrievedAt, symbol, candleRange, stockClose, stockCloseStatus, stockCloseError }: ResearchPanelProps) {
  const [messages, setMessages] = useState<ResearchMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [requestCancelled, setRequestCancelled] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const requestControllerRef = useRef<AbortController | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shouldFollowMessagesRef = useRef(true);

  useEffect(() => () => requestControllerRef.current?.abort(), []);

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
      shouldFollowMessagesRef.current = true;
    }
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (shouldFollowMessagesRef.current) scrollToBottom();
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
    setRequestCancelled(false);
    setStreamingText("");

    // Add user question
    addMessage(createResearchQuestion(question));
    setIsLoading(true);
    const controller = new AbortController();
    requestControllerRef.current = controller;

    const requestedStockSymbol = extractRequestedStockPriceSymbol(question);

    const sources = [
      ...(rTokenSnapshot ? [{
          endpoint: `Bitget public Spot ticker · ${rTokenSnapshot.symbol}`,
          timestamp: rTokenSnapshot.tickerTimestamp,
          data: {
            symbol: rTokenSnapshot.symbol,
            lastPrice: rTokenSnapshot.lastPrice,
            bidPrice: rTokenSnapshot.bidPrice,
            askPrice: rTokenSnapshot.askPrice,
            bidSize: rTokenSnapshot.bidSize,
            askSize: rTokenSnapshot.askSize,
            spreadPercent: rTokenSnapshot.spreadPercent,
            retrievedAt: rTokenSnapshot.retrievedAt,
            warnings: rTokenSnapshot.warnings,
          },
        }] : []),
      ...(candleStatus === "live" && candles.length >= 2 && candleRetrievedAt
        ? [{
          endpoint: `Bitget public SPOT hourly candles · ${rTokenSnapshot?.symbol ?? `R${symbol}USDT`}`,
          timestamp: candleRetrievedAt,
          data: { candleCount: candles.length, firstTimestamp: candles[0]!.timestamp, lastTimestamp: candles.at(-1)!.timestamp },
        }]
        : []),
      ...(stockClose ? [{
        endpoint: `EODHD daily close · ${stockClose.symbol}`,
        timestamp: stockClose.date,
        data: { close: stockClose.close, date: stockClose.date, retrievedAt: stockClose.retrievedAt },
      }] : []),
    ];

    const candleEvidence = candleStatus === "live" ? formatRTokenCandleEvidence(candles) : null;
    try {
      if (requestedStockSymbol) {
        const requestedStockClose = await fetchRTokenStockClose(requestedStockSymbol, controller.signal);
        if (controller.signal.aborted) return;

        const directAnswer = `The latest available ${requestedStockClose.symbol} stock reference is ${new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "USD",
        }).format(requestedStockClose.close)}, the daily close for ${requestedStockClose.date}. It is not a live quote. This stock-ticker reference does not establish the underlying, backing, redemption rights, or value of the selected rToken.`;
        addMessage(createResearchAnswer(directAnswer, [{
          endpoint: `EODHD daily close · ${requestedStockClose.symbol}`,
          timestamp: requestedStockClose.retrievedAt,
          data: {
            close: requestedStockClose.close,
            currency: "USD",
            date: requestedStockClose.date,
            retrievedAt: requestedStockClose.retrievedAt,
          },
        }]));
        return;
      }

      const context = [
        rTokenSnapshot
            ? `DATA STATUS: A fresh, observed Bitget ${rTokenSnapshot.symbol} spot ticker is supplied below as an rToken market snapshot. Any stock close supplied separately is daily and not time-aligned.`
            : `DATA STATUS: ${snapshotStatus === "loading" ? `The Bitget ${symbol} spot ticker is being checked.` : `No fresh ${symbol} ticker is available.`} Do not reuse stale values or invent prices.`,
        candleEvidence
          ? `The chart and this answer use the same validated Bitget rToken-only hourly close series for the selected ${candleRange} view, retrieved at ${candleRetrievedAt}.${candleHistoryStale ? " The series is delayed; its latest candle timestamp is historical and must not be described as current." : ""} Do not infer market causes, fair value, premium/discount, or a trading signal. Cite specific measured changes and UTC times when relevant.\n${candleEvidence}`
          : `Hourly chart evidence is ${candleStatus === "loading" ? "still loading" : "unavailable"}; no candle values are supplied. Do not infer anything from an unseen chart.`,
        stockClose
          ? `An independent EODHD daily ${stockClose.symbol} stock-ticker close is also supplied: ${stockClose.close} USD for trading date ${stockClose.date}, retrieved ${stockClose.retrievedAt}. It is only matched by the ticker name; this does not establish the rToken's underlying, backing, or redemption rights. It is not live, may be from the prior US trading session, is USD versus the Bitget USDT quote, and is not time-aligned. Do not calculate or describe a premium, discount, fair value, tracking, or synchronized comparison from it; no FX conversion is supplied.`
          : `No independent stock close is supplied (${stockCloseStatus === "loading" ? "the daily close is still being checked" : stockCloseError ?? "the daily stock-close service is unavailable"}). Do not invent an underlying-stock value.`,
        "Answer the user’s question as a concise research note. Clearly separate observed data from interpretation. State when a measured close-to-close change is descriptive only, not market direction or a trading signal. Identify missing evidence where relevant (for example, executable depth and timestamp alignment). Do not claim any missing source was checked.",
        rTokenSnapshot
          ? [
            `Observed Bitget instrument: ${rTokenSnapshot.symbol}, Reality rToken spot market, quoted in USDT.`,
            `Last: ${rTokenSnapshot.lastPrice} USDT; best bid: ${rTokenSnapshot.bidPrice} (${rTokenSnapshot.bidSize}); best ask: ${rTokenSnapshot.askPrice} (${rTokenSnapshot.askSize}).`,
            `Bitget ticker timestamp: ${rTokenSnapshot.tickerTimestamp}; app retrieval time: ${rTokenSnapshot.retrievedAt}; bid/ask spread: ${rTokenSnapshot.spreadPercent.toFixed(4)}%.`,
            `Quote-quality warnings: ${rTokenSnapshot.warnings.length ? rTokenSnapshot.warnings.join(" ") : "none detected by basic checks"}. These fields have not been independently audited for execution quality or units.`,
            `Limits: this is the ${rTokenSnapshot.symbol} rToken market snapshot${stockClose ? ` plus a separate, ticker-name-matched ${stockClose.date} ${stockClose.symbol} daily stock close` : ""}. A name match does not establish underlying, backing, or redemption rights. The stock close is USD and not contemporaneous with the USDT quote; no FX conversion is supplied. No premium, NAV, valuation, recommendation, or trading signal can be inferred.`,
          ].join("\n")
          : `No fresh Bitget ${symbol} snapshot is supplied. Do not invent or reuse ticker prices.`,
        ].filter(Boolean).join("\n");

      const qwen = await askQwenResearch({ question, symbol, context }, {
        signal: controller.signal,
        onDelta: (delta) => setStreamingText((current) => current + delta),
        onReset: () => setStreamingText(""),
      });
      if (controller.signal.aborted) return;
      setStreamingText("");
      const answer = createResearchAnswer(qwen.text, sources);
      addMessage(answer);

      // Emit canvas events if any
      if (answer.type === "answer" && answer.canvasEvents) {
        answer.canvasEvents.forEach((event) => {
          canvasEventBus.emit(event);
        });
      }
    } catch (error) {
      if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
        setStreamingText("");
        setRequestCancelled(true);
        return;
      }
      console.warn("AI research explanation unavailable; returning an evidence-only summary.", error);
      if (requestedStockSymbol) {
        addMessage(createResearchAnswer(
          `I couldn't retrieve a dated daily stock close for ${requestedStockSymbol}, so I can't report its price. No live stock quote is available here. The selected rToken market is separate and is not a substitute for ${requestedStockSymbol}.`,
          [],
        ));
      } else {
        addMessage(createResearchAnswer(buildEvidenceFallback(rTokenSnapshot, snapshotStatus, symbol, candleEvidence), sources));
      }
    } finally {
      if (requestControllerRef.current === controller) requestControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const cancelRequest = () => requestControllerRef.current?.abort();

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

  return (
    <Box
      className="research-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "transparent",
      }}
    >
      <Box
        className="research-panel__heading"
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
          <Text id={titleId} variant="heading-sm" weight="semibold">Research desk</Text>
          </Box>
          <Tooltip content={`Showing Bitget ${rTokenSnapshot?.symbol ?? `${symbol}USDT`} spot market`} position="top">
              <span className="research-panel__symbol">
                r{symbol}
              </span>
          </Tooltip>
        </Box>
      </Box>

      <div className="research-brief">
        <span className="section-kicker">ASK THE EVIDENCE</span>
        <p>Live Bitget rToken data, hourly history, and a separate daily stock-close reference when available.</p>
      </div>
      <div
        className="research-messages"
        ref={messagesContainerRef}
        role="log"
        aria-label="Research conversation"
        aria-live="polite"
        tabIndex={0}
        onScroll={(event) => {
          const container = event.currentTarget;
          shouldFollowMessagesRef.current = container.scrollHeight - container.clientHeight - container.scrollTop < 48;
        }}
        style={{
          flex: 1,
          overflow: "auto",
          padding: "var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        {messages.length === 0 && (
          <div className="research-empty-state">
            <span className="research-empty-state__index">01 / EVIDENCE REVIEW</span>
            <p>Ask what changed in the observed hourly closes, what the live snapshot shows, and what remains uncertain.</p>
            <span>AI assists the research. You make the call.</span>
          </div>
        )}
        {messages.map((msg, i) => (
          <Box
            className={`research-message research-message--${msg.type}`}
            key={`${msg.timestamp}-${i}`}
            style={{
              display: "flex",
              gap: "var(--space-3)",
              maxWidth: "100%",
            }}
          >
            <span className={`research-message__mark research-message__mark--${msg.type}`} aria-hidden="true">
              {msg.type === "question" ? "?" : msg.type === "answer" ? "✓" : "!"}
            </span>
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
        {isLoading && (
          <section className="research-live-response" aria-label="Research response in progress">
            <div className="research-progress" role="status" aria-live="polite" aria-label="Preparing your evidence-based explanation">
              <div><span>[01/03]</span><strong>Reading supplied Bitget snapshot and candle evidence</strong><b>DONE</b></div>
              <div className="research-progress__active"><span>[02/03]</span><strong>{streamingText ? "Writing the explanation" : "Requesting an explanation from the research service"}</strong><b>{streamingText ? "STREAMING" : "IN PROGRESS"}</b></div>
              <div className="research-progress__pending"><span>[03/03]</span><strong>Checking that the response is complete</strong><b>WAITING</b></div>
            </div>
            {streamingText && <div className="research-streaming-draft" aria-live="off"><span>DRAFT · NOT COMPLETE</span><p>{streamingText}</p></div>}
          </section>
        )}
        {requestCancelled && <div className="research-cancelled" role="status">Request cancelled. No partial answer was saved.</div>}
      </div>

      <Box
        className="research-composer"
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
              className="research-composer__input"
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
              placeholder="Ask about rToken mechanics, evidence requirements, and data limits..."
              style={{
                width: "100%",
                minHeight: 82,
                maxHeight: 140,
                padding: "12px 44px 12px 14px",
                background: "var(--color-bg-base)",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-default)",
                color: "var(--color-fg-primary)",
                fontSize: "var(--text-sm)",
                lineHeight: 1.5,
                fontFamily: "inherit",
                 resize: "none",
                outline: "none",
                transition: "border-color var(--duration-fast), box-shadow var(--duration-fast)",
              }}
              disabled={isLoading}
            />
            <Button
              type={isLoading ? "button" : "submit"}
              size="sm"
              aria-label={isLoading ? "Cancel research request" : "Send research question"}
              disabled={!inputValue.trim() && !isLoading}
              onClick={isLoading ? cancelRequest : undefined}
              style={{
                position: "absolute",
                bottom: "var(--space-2)",
                right: "var(--space-2)",
                minWidth: isLoading ? 72 : undefined,
              }}
            >
              {isLoading ? (
                <span>Cancel</span>
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

function buildEvidenceFallback(snapshot: RTokenSnapshot | null | undefined, snapshotStatus: "loading" | "live" | "unavailable", symbol: string, candleEvidence: string | null): string {
  if (snapshot) {
    return [
      "**EVIDENCE SUMMARY · AI explanation unavailable**",
      "The research service did not return a complete explanation. These verified observations are shown without an AI interpretation.",
      `**Observed Bitget snapshot:** ${snapshot.symbol} last ${snapshot.lastPrice} USDT; bid ${snapshot.bidPrice} (${snapshot.bidSize}); ask ${snapshot.askPrice} (${snapshot.askSize}). Ticker timestamp ${snapshot.tickerTimestamp}; retrieved ${snapshot.retrievedAt}.`,
      `**Quote checks:** bid/ask spread ${snapshot.spreadPercent.toFixed(2)}%. ${snapshot.warnings.length ? snapshot.warnings.join(" ") : "No basic quote-quality warning detected."}`,
      `**Limits:** this is an rToken spot-market snapshot only. Any independent stock close is displayed separately with its session date and is not synchronized. No premium, NAV, or trade conclusion is provided.`,
      candleEvidence ? `**Observed hourly history:**\n${candleEvidence}` : "Hourly candle evidence is not available to this answer.",
    ].join("\n\n");
  }
  return [
    "**EVIDENCE SUMMARY · AI explanation unavailable**",
    "The research service did not return a complete explanation. These verified observations are shown without an AI interpretation.",
    `No fresh Bitget ${symbol} ticker is available${snapshotStatus === "loading" ? " yet" : ""}. I can’t report a current rToken price.`,
    candleEvidence ? `**Observed hourly history:**\n${candleEvidence}` : "Hourly candle evidence is not available to this answer.",
    "The snapshot will only be shown after the selected Bitget spot symbol, response fields, and freshness checks pass.",
  ].join("\n\n");
}


function formatTelemetryText(text: string): string {
  return text
    .replace(/^•\s*/gm, "> ")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^[-*]\s+/gm, "> ");
}
