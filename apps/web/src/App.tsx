import { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";

import { Header } from "./components/Header";
import type { RTokenMarket } from "./features/rtoken-markets";
import { fetchRTokenMarkets } from "./features/rtoken-markets";
import { ResearchPanel } from "./features/research-panel/ResearchPanel";
import { MechanicsCanvas } from "./features/mechanics-canvas/MechanicsCanvas";
import { fetchRTokenSnapshot, RTOKEN_SNAPSHOT_MAX_AGE_MS } from "./features/rtoken-snapshot";
import type { RTokenSnapshot } from "./features/rtoken-snapshot";
import { fetchRTokenCandles, isRTokenCandleHistoryStale, selectRTokenCandleRange } from "./features/rtoken-candles";
import type { RTokenCandle, RTokenCandleHistory, RTokenCandleRange } from "./features/rtoken-candles";
import { fetchRTokenStockClose } from "./features/rtoken-stock-close";
import type { RTokenStockClose } from "./features/rtoken-stock-close";
import { LandingPage } from "./features/landing/LandingPage";
import { ArrowLeftIcon } from "./components/Icons";

// ============================================================================
// Main App Component
// ============================================================================

function AppInner() {
  const [selectedMarket, setSelectedMarket] = useState<RTokenMarket>({ symbol: "RAAPLUSDT", baseCoin: "rAAPL" });
  const [markets, setMarkets] = useState<RTokenMarket[]>([]);
  const [marketsStatus, setMarketsStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [rTokenSnapshot, setRTokenSnapshot] = useState<RTokenSnapshot | null>(null);
  const [snapshotStatus, setSnapshotStatus] = useState<"loading" | "live" | "unavailable">("loading");
  const [candleState, setCandleState] = useState<{
    symbol: string;
    status: "loading" | "live" | "unavailable";
    history?: RTokenCandleHistory;
    error?: string;
  } | null>(null);
  const [showWorkbench, setShowWorkbench] = useState(false);
  const [candleRange, setCandleRange] = useState<RTokenCandleRange>("1W");
  const [stockCloseState, setStockCloseState] = useState<{
    symbol: string;
    status: "loading" | "available" | "unavailable";
    data?: RTokenStockClose;
    error?: string;
  } | null>(null);
  const transitionRef = useRef<HTMLDivElement>(null);
  const handleMarketChange = (market: RTokenMarket) => {
    setRTokenSnapshot(null);
    setSnapshotStatus("loading");
    setSelectedMarket(market);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchRTokenMarkets(controller.signal)
      .then((availableMarkets) => {
        setMarkets(availableMarkets);
        setSelectedMarket((current) => availableMarkets.find((market) => market.symbol === current.symbol) ?? current);
        setMarketsStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.warn("Bitget Reality market list unavailable.", error);
        setMarketsStatus("unavailable");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let active = true;
    let inFlight = false;
    const controller = new AbortController();
    setRTokenSnapshot(null);
    setSnapshotStatus("loading");
    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const snapshot = await fetchRTokenSnapshot(selectedMarket.symbol, controller.signal);
        if (!active) return;
        setRTokenSnapshot(snapshot);
        setSnapshotStatus("live");
      } catch (error) {
        if (!active) return;
        console.warn(`Bitget ${selectedMarket.symbol} spot snapshot unavailable.`, error);
        setRTokenSnapshot(null);
        setSnapshotStatus("unavailable");
      } finally {
        inFlight = false;
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30_000);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
    };
  }, [selectedMarket.symbol]);

  useEffect(() => {
    if (!rTokenSnapshot) return;
    const ageMs = Date.now() - Date.parse(rTokenSnapshot.tickerTimestamp);
    const expiresIn = Math.max(0, RTOKEN_SNAPSHOT_MAX_AGE_MS - ageMs);
    const timeout = window.setTimeout(() => {
      setRTokenSnapshot(null);
      setSnapshotStatus("unavailable");
    }, expiresIn);
    return () => window.clearTimeout(timeout);
  }, [rTokenSnapshot]);

  useEffect(() => {
    if (!showWorkbench) return;
    const symbol = selectedMarket.symbol;
    const controller = new AbortController();
    let active = true;
    setCandleState({ symbol, status: "loading" });
    fetchRTokenCandles(symbol, controller.signal)
      .then((history) => {
        if (!active) return;
        setCandleState({ symbol, status: "live", history });
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return;
        console.warn(`Bitget ${symbol} hourly candles unavailable.`, error);
        setCandleState({
          symbol,
          status: "unavailable",
          error: error instanceof Error ? error.message : "Bitget candle history is unavailable.",
        });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedMarket.symbol, showWorkbench]);

  const stockSymbol = selectedMarket.baseCoin.replace(/^r/, "");
  useEffect(() => {
    if (!showWorkbench) return;
    const controller = new AbortController();
    let active = true;
    setStockCloseState({ symbol: stockSymbol, status: "loading" });
    fetchRTokenStockClose(stockSymbol, controller.signal)
      .then((data) => {
        if (active) setStockCloseState({ symbol: stockSymbol, status: "available", data });
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return;
        setStockCloseState({
          symbol: stockSymbol,
          status: "unavailable",
          error: error instanceof Error ? error.message : "Daily stock close unavailable.",
        });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [showWorkbench, stockSymbol]);

  const currentCandleState = candleState?.symbol === selectedMarket.symbol
    ? candleState
    : { symbol: selectedMarket.symbol, status: "loading" as const };
  const candles: RTokenCandle[] = currentCandleState.history?.candles ?? [];
  const candleHistory: RTokenCandleHistory | null = currentCandleState.history ?? null;
  const visibleCandles = selectRTokenCandleRange(candles, candleRange);
  const candleHistoryStale = currentCandleState.status === "live" && isRTokenCandleHistoryStale(candles);
  const currentStockClose = stockCloseState?.symbol === stockSymbol ? stockCloseState : null;

  const transitionView = useCallback((nextView: boolean) => {
    const curtain = transitionRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!curtain || reducedMotion) {
      setShowWorkbench(nextView);
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    gsap.killTweensOf(curtain);
    gsap.set(curtain, { transformOrigin: nextView ? "bottom center" : "top center" });
    gsap.to(curtain, {
      scaleY: 1,
      duration: 0.48,
      ease: "power3.inOut",
      onComplete: () => {
        setShowWorkbench(nextView);
        window.scrollTo({ top: 0, behavior: "auto" });
        requestAnimationFrame(() => {
          gsap.to(curtain, {
            scaleY: 0,
            duration: 0.62,
            ease: "power3.inOut",
            onComplete: () => gsap.set(curtain, { clearProps: "all" }),
          });
        });
      },
    });
  }, []);
  const openWorkbench = useCallback(() => transitionView(true), [transitionView]);
  const panelTitleId = "research-panel-title";

  return (
    <div className="app-document">
      <div className="app-transition-curtain" aria-hidden="true" ref={transitionRef} />
      {showWorkbench ? (
        <section className="app-workbench" id="workbench" aria-label="rToken Lab workbench">
          <div className="app-workbench__return">
            <button type="button" onClick={() => transitionView(false)}><ArrowLeftIcon className="ui-icon" /> Return to field note</button>
            <span>LIVE BITGET EVIDENCE · RESEARCH WORKBENCH</span>
          </div>
          <div className="app-layout">
            <Header
              dataStatus={snapshotStatus}
              selectedMarket={selectedMarket}
              markets={markets}
              marketsStatus={marketsStatus}
              onMarketChange={handleMarketChange}
            />
            <aside className="app-research-panel panel" aria-labelledby={panelTitleId}>
              <ResearchPanel
                titleId={panelTitleId}
                rTokenSnapshot={rTokenSnapshot}
                snapshotStatus={snapshotStatus}
                candles={visibleCandles}
                candleStatus={currentCandleState.status}
                candleHistoryStale={candleHistoryStale}
                candleRetrievedAt={candleHistory?.retrievedAt ?? null}
                symbol={selectedMarket.baseCoin.replace(/^r/, "")}
                candleRange={candleRange}
                stockClose={currentStockClose?.data ?? null}
                stockCloseStatus={currentStockClose?.status ?? "loading"}
                stockCloseError={currentStockClose?.error ?? null}
              />
            </aside>
            <main className="app-center-canvas">
              <div className="canvas-container">
                <MechanicsCanvas
                  symbol={selectedMarket.baseCoin.replace(/^r/, "")}
                  pricePrecision={selectedMarket.pricePrecision}
                  rTokenSnapshot={rTokenSnapshot}
                  snapshotStatus={snapshotStatus}
                  candles={visibleCandles}
                  candleStatus={currentCandleState.status}
                  candleHistoryStale={candleHistoryStale}
                  candleRetrievedAt={candleHistory?.retrievedAt ?? null}
                  candleError={currentCandleState.error ?? null}
                  candleRange={candleRange}
                  onCandleRangeChange={setCandleRange}
                  stockClose={currentStockClose?.data ?? null}
                  stockCloseStatus={currentStockClose?.status ?? "loading"}
                  stockCloseError={currentStockClose?.error ?? null}
                />
              </div>
            </main>
          </div>
        </section>
      ) : (
        <LandingPage onOpenWorkbench={openWorkbench} />
      )}
    </div>
  );
}

export function App() {
  return <AppInner />;
}
