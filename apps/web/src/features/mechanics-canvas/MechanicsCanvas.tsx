import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Box, Text } from "@rtoken-lab/ui";
import type { RTokenSnapshot } from "../rtoken-snapshot";
import type { RTokenCandle, RTokenCandleRange } from "../rtoken-candles";
import type { RTokenStockClose } from "../rtoken-stock-close";

interface MechanicsCanvasProps {
  symbol: string | null;
  rTokenSnapshot?: RTokenSnapshot | null;
  snapshotStatus: "loading" | "live" | "unavailable";
  candles: RTokenCandle[];
  candleStatus: "loading" | "live" | "unavailable";
  candleRetrievedAt: string | null;
  candleError: string | null;
  candleRange: RTokenCandleRange;
  onCandleRangeChange: (range: RTokenCandleRange) => void;
  stockClose: RTokenStockClose | null;
  stockCloseStatus: "loading" | "available" | "unavailable";
  stockCloseError: string | null;
}

function pathFor(candles: RTokenCandle[], width: number, height: number, min: number, max: number): string {
  const range = max - min || 1;
  const firstTimestamp = candles[0]?.timestamp ?? 0;
  const timestampRange = candles.length > 1 ? candles.at(-1)!.timestamp - firstTimestamp || 1 : 1;
  return candles.map((candle, index) => {
    const x = ((candle.timestamp - firstTimestamp) / timestampRange) * width;
    const y = height - ((candle.close - min) / range) * height;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

export function MechanicsCanvas({
  symbol,
  rTokenSnapshot,
  snapshotStatus,
  candles,
  candleStatus,
  candleRetrievedAt,
  candleError,
  candleRange,
  onCandleRangeChange,
  stockClose,
  stockCloseStatus,
  stockCloseError,
}: MechanicsCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [chartHeight, setChartHeight] = useState(460);
  const [hoveredCandleIndex, setHoveredCandleIndex] = useState<number | null>(null);
  const previousSnapshotRef = useRef<RTokenSnapshot | null>(null);
  const [changedQuoteFields, setChangedQuoteFields] = useState<Set<"last" | "bid" | "ask">>(() => new Set());
  const quoteChangeTimeoutRef = useRef<number | null>(null);
  const currentCandleStatus = candleStatus;

  useEffect(() => {
    setHoveredCandleIndex(null);
  }, [symbol, candleStatus]);

  useEffect(() => {
    if (!rTokenSnapshot) {
      previousSnapshotRef.current = null;
      setChangedQuoteFields(new Set());
      return;
    }

    const previous = previousSnapshotRef.current;
    previousSnapshotRef.current = rTokenSnapshot;
    if (!previous || previous.symbol !== rTokenSnapshot.symbol) return;

    const changed = new Set<"last" | "bid" | "ask">();
    if (previous.lastPrice !== rTokenSnapshot.lastPrice) changed.add("last");
    if (previous.bidPrice !== rTokenSnapshot.bidPrice) changed.add("bid");
    if (previous.askPrice !== rTokenSnapshot.askPrice) changed.add("ask");
    if (changed.size === 0) return;

    setChangedQuoteFields(changed);
    if (quoteChangeTimeoutRef.current !== null) window.clearTimeout(quoteChangeTimeoutRef.current);
    quoteChangeTimeoutRef.current = window.setTimeout(() => {
      setChangedQuoteFields(new Set());
      quoteChangeTimeoutRef.current = null;
    }, 850);
  }, [rTokenSnapshot]);

  useEffect(() => () => {
    if (quoteChangeTimeoutRef.current !== null) window.clearTimeout(quoteChangeTimeoutRef.current);
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === "undefined") return;

    const updateAspectRatio = () => {
      const { width: renderedWidth, height: renderedHeight } = svg.getBoundingClientRect();
      if (renderedWidth <= 0 || renderedHeight <= 0) return;
      const nextHeight = (1000 * renderedHeight) / renderedWidth;
      setChartHeight((current) => Math.abs(current - nextHeight) < 0.5 ? current : nextHeight);
    };

    const observer = new ResizeObserver(updateAspectRatio);
    observer.observe(svg);
    updateAspectRatio();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const paths = svg.querySelectorAll<SVGPathElement>("path[data-animated]");
    const context = gsap.context(() => {
      paths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.fromTo(path,
          { strokeDasharray: length, strokeDashoffset: length, opacity: 0.25 },
          { strokeDashoffset: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
        );
      });
    }, svg);
    return () => context.revert();
  }, [candles, symbol]);

  if (!symbol) {
    return (
      <Box className="canvas-placeholder">
        <Text variant="heading-md" color="secondary">Select an instrument to begin</Text>
        <Text variant="body-sm" color="muted">Choose a verified Bitget Reality spot instrument to load its hourly rToken history.</Text>
      </Box>
    );
  }

  const hasLiveHistory = currentCandleStatus === "live" && candles.length >= 2;
  const width = 1000;
  const height = chartHeight;
  const observedLow = hasLiveHistory ? Math.min(...candles.map((candle) => candle.low)) : 0;
  const observedHigh = hasLiveHistory ? Math.max(...candles.map((candle) => candle.high)) : 1;
  const padding = hasLiveHistory ? Math.max((observedHigh - observedLow) * 0.12, observedHigh * 0.002) : 0;
  const minPrice = observedLow - padding;
  const maxPrice = observedHigh + padding;
  const chartPath = hasLiveHistory ? pathFor(candles, width, height, minPrice, maxPrice) : "";
  const areaPath = chartPath ? `${chartPath} L${width},${height} L0,${height} Z` : "";
  const hoveredCandle = hoveredCandleIndex === null ? null : candles[hoveredCandleIndex] ?? null;
  const hoveredX = hoveredCandle && candles.length > 1
    ? ((hoveredCandle.timestamp - candles[0]!.timestamp) / (candles.at(-1)!.timestamp - candles[0]!.timestamp || 1)) * width
    : null;
  const hoveredY = hoveredCandle
    ? height - ((hoveredCandle.close - minPrice) / (maxPrice - minPrice || 1)) * height
    : null;

  const handleChartPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || candles.length < 2) return;
    const pointerX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)) * width;
    const firstTimestamp = candles[0]!.timestamp;
    const lastTimestamp = candles.at(-1)!.timestamp;
    const targetTimestamp = firstTimestamp + (pointerX / width) * (lastTimestamp - firstTimestamp);
    let low = 0;
    let high = candles.length - 1;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (candles[middle]!.timestamp < targetTimestamp) low = middle + 1;
      else high = middle;
    }
    const previousIndex = Math.max(0, low - 1);
    const selectedIndex = targetTimestamp - candles[previousIndex]!.timestamp <= candles[low]!.timestamp - targetTimestamp
      ? previousIndex
      : low;
    setHoveredCandleIndex(selectedIndex);
  };

  const handleChartKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const currentIndex = hoveredCandleIndex ?? (event.key === "ArrowRight" ? -1 : candles.length);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    setHoveredCandleIndex(Math.min(candles.length - 1, Math.max(0, currentIndex + direction)));
  };

  return (
    <Box className="mechanics-surface">
      <Box className="mechanics-toolbar">
        <div>
          <Text variant="overline" color="muted">BITGET REALITY SPOT / {rTokenSnapshot?.symbol ?? `R${symbol}USDT`}</Text>
          <Text variant="heading-lg" color="primary">Bitget rToken history</Text>
        </div>
        <div className="mechanics-toolbar__controls" aria-label="rToken market and data state">
          <div className="chart-range-control" role="group" aria-label="Hourly candle chart range">
            {(["1D", "1W", "1M"] as const).map((range) => <button
              key={range}
              type="button"
              aria-pressed={candleRange === range}
              disabled={currentCandleStatus !== "live"}
              onClick={() => onCandleRangeChange(range)}
            >{range}</button>)}
          </div>
          <span className={`history-state history-state--${currentCandleStatus === "live" ? "loaded" : currentCandleStatus === "loading" ? "disabled" : "unavailable"}`} role="status">
            {currentCandleStatus === "live" ? `BITGET · ${candleRange} HOURLY VIEW` : currentCandleStatus === "loading" ? "LOADING BITGET HISTORY" : "HISTORY UNAVAILABLE"}
          </span>
        </div>
      </Box>

      {rTokenSnapshot ? (
        <section className="rtoken-snapshot" aria-label={`Bitget ${rTokenSnapshot.symbol} spot market snapshot`}>
          <div className="rtoken-snapshot__heading">
            <div className="rtoken-snapshot__instrument"><span>BITGET TICKER SNAPSHOT</span><strong>{rTokenSnapshot.symbol.replace(/USDT$/, "")} / USDT</strong></div>
            <span className="history-state" role="status">BITGET SNAPSHOT · STOCK CLOSE IS DAILY</span>
          </div>
          <div className="rtoken-snapshot__prices">
            <div className={`rtoken-snapshot__last${changedQuoteFields.has("last") ? " is-updated" : ""}`}>
              <span>LAST TRADED</span><strong>{rTokenSnapshot.lastPrice.toFixed(2)} <small>USDT</small></strong>
            </div>
            <div className={`rtoken-snapshot__book${changedQuoteFields.has("bid") ? " is-updated" : ""}`}>
              <span>BEST BID · {rTokenSnapshot.bidSize}</span><strong>{rTokenSnapshot.bidPrice.toFixed(2)} <small>USDT</small></strong>
            </div>
            <div className={`rtoken-snapshot__book${changedQuoteFields.has("ask") ? " is-updated" : ""}`}>
              <span>BEST ASK · {rTokenSnapshot.askSize}</span><strong>{rTokenSnapshot.askPrice.toFixed(2)} <small>USDT</small></strong>
            </div>
          </div>
          <div className="rtoken-snapshot__meta">
            <span>Bitget ticker time {new Date(rTokenSnapshot.tickerTimestamp).toLocaleString(undefined, { timeZone: "UTC", timeZoneName: "short" })}</span>
            <span>Retrieved {new Date(rTokenSnapshot.retrievedAt).toLocaleString(undefined, { timeZone: "UTC", timeZoneName: "short" })}</span>
            <span>Bid/ask spread {rTokenSnapshot.spreadPercent.toFixed(2)}%</span>
            <a href="https://www.bitget.com/api-doc/uta/reality/reality-trading-guide" target="_blank" rel="noreferrer">Bitget Reality market-data docs ↗</a>
          </div>
          {rTokenSnapshot.warnings.length > 0 && <ul className="rtoken-snapshot__warnings" aria-label="Quote quality warnings">{rTokenSnapshot.warnings.map((warning: string) => <li key={warning}>{warning}</li>)}</ul>}
          <p className="rtoken-snapshot__limit">Bitget rToken snapshot is live market data. Any stock close below is the latest available daily close and is not synchronized with this quote.</p>
        </section>
      ) : (
        <section className="rtoken-snapshot rtoken-snapshot--empty" aria-label={`Bitget R${symbol}USDT spot market snapshot`} role="status">
          <strong>{snapshotStatus === "loading" ? `Checking the Bitget R${symbol} spot ticker…` : `R${symbol} spot ticker unavailable`}</strong>
          <span>{snapshotStatus === "loading" ? "No previous values are shown while the request is pending." : `Could not verify a fresh R${symbol}USDT response. No cached quote or premium is shown.`}</span>
        </section>
      )}

      <div className="quote-provenance quote-provenance--empty">
        <div className="quote-provenance__comparison-heading">
          <strong>Reference only · daily stock ticker close</strong>
          <span>Not live · not time-aligned · not a premium or fair-value estimate</span>
        </div>
        {stockClose ? (
          <div className="stock-close-comparison" aria-label={`EODHD latest daily ${stockClose.symbol} ticker close`}>
            <div><span>STOCK TICKER REFERENCE · {stockClose.symbol}</span><strong>{formatPrice(stockClose.close)} <small>USD</small></strong></div>
            <div><span>OFFICIAL CLOSE DATE</span><strong>{stockClose.date}</strong></div>
            <small>Source: <a href="https://eodhd.com/financial-apis/api-for-historical-data-and-volumes" target="_blank" rel="noreferrer">{stockClose.source} daily history ↗</a>{stockClose.tokenType === "demo" ? " · limited demo token" : ""} · retrieved {formatUtc(Date.parse(stockClose.retrievedAt))}</small>
          </div>
        ) : (
          <div className="stock-close-unavailable" role={stockCloseStatus === "loading" ? "status" : "note"}>
            <span>{stockCloseStatus === "loading" ? "Checking for the latest daily stock close…" : stockCloseError ?? "Daily stock close is unavailable."}</span>
          </div>
        )}
        <p>This is a symbol-matched stock ticker reference, not confirmation of the rToken’s underlying, backing, or redemption rights. The Bitget quote is in USDT; the stock close is in USD, with no FX adjustment. The daily close usually predates the live Bitget quote. We do not calculate a premium or imply synchronized prices. The chart below remains Bitget rToken-only history.</p>
      </div>

      <div className="evidence-chart-frame" id="rtoken-history-chart">
        {!hasLiveHistory ? (
          <div className={`history-empty history-empty--${currentCandleStatus}`} role="status">
            <span className="history-empty__badge">{currentCandleStatus === "loading" ? "[ FETCHING // BITGET HOURLY CANDLES ]" : "[ DATA_UNAVAILABLE // NO_HOURLY_CANDLES ]"}</span>
            <strong>{currentCandleStatus === "loading" ? "Loading verified hourly candles" : "Hourly rToken history is unavailable"}</strong>
            <span>{currentCandleStatus === "loading" ? `Checking up to 1,000 hourly candles for R${symbol}USDT, then showing those inside the selected time window.` : candleError ?? "A fresh, valid candle series could not be confirmed, so no price line is drawn."}</span>
            <span>Source: Bitget Reality spot candles. No native-stock series or premium is shown.</span>
          </div>
        ) : (
          <>
          <svg
            ref={svgRef}
            className="mechanics-svg"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
         aria-label={`Bitget ${candleRange} hourly close prices for R${symbol}USDT, in USDT. rToken history only.`}
            aria-describedby="rtoken-chart-instructions"
            tabIndex={0}
            onPointerMove={handleChartPointerMove}
            onPointerLeave={() => setHoveredCandleIndex(null)}
            onKeyDown={handleChartKeyDown}
          >
            <defs>
              <linearGradient id="rtoken-area-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent-positive)" stopOpacity="0.14" />
                <stop offset="100%" stopColor="var(--color-accent-positive)" stopOpacity="0.01" />
              </linearGradient>
              <pattern id="instrument-grid" width="100" height="76" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 76" fill="none" stroke="var(--color-chart-grid)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={width} height={height} fill="transparent" />
            <rect width={width} height={height} fill="url(#instrument-grid)" />
            <path d={areaPath} fill="url(#rtoken-area-fill)" />
            <path data-animated d={chartPath} fill="none" stroke="var(--color-accent-positive)" strokeWidth="7" strokeOpacity="0.1" vectorEffect="non-scaling-stroke" />
            <path data-animated d={chartPath} fill="none" stroke="var(--color-accent-positive)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            <text x="18" y="24" fill="var(--color-fg-muted)" fontSize="12" fontFamily="var(--font-mono)">{`BITGET SPOT · ${candles.length} HOURLY CANDLES · ${candleRange} VIEW · CLOSE IN USDT`}</text>
            {hoveredX !== null && hoveredY !== null && hoveredCandle && <g className="chart-crosshair" aria-hidden="true">
              <line x1={hoveredX} x2={hoveredX} y1="0" y2={height} />
              <circle cx={hoveredX} cy={hoveredY} r="7" />
            </g>}
          </svg>
          {hoveredCandle && <div className="chart-hover-hud" aria-hidden="true">
            <span>HOURLY CLOSE <strong>{formatPrice(hoveredCandle.close)} USDT</strong></span>
            <span>TIME <strong>{formatUtc(hoveredCandle.timestamp)}</strong></span>
          </div>}
          <span className="visually-hidden" id="rtoken-chart-instructions">Hover over the chart to inspect an hourly close. Focus the chart and use the left and right arrow keys to move between candles.</span>
          </>
        )}
      </div>
      <div className="chart-footnote">
        {hasLiveHistory ? <>
          <span>Bitget public SPOT hourly candles · close prices in USDT · no native-stock series.</span>
          <span>Observed {formatUtc(candles[0]!.timestamp)} – {formatUtc(candles.at(-1)!.timestamp)} · retrieved {candleRetrievedAt ? formatUtc(Date.parse(candleRetrievedAt)) : "time unavailable"}.</span>
        </> : <>
          <span>The chart area remains in place when fresh, validated Bitget candle history is unavailable.</span>
          <span>One-sided rToken evidence only · no native-stock comparison or premium.</span>
        </>}
      </div>
    </Box>
  );
}

function formatUtc(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, { timeZone: "UTC", timeZoneName: "short" });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(price);
}
