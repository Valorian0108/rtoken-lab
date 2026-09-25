import { useState, useEffect, createContext, useContext } from "react";
import { getMcpClient, initializeMcpClient } from "@rtoken-lab/mcp-client";

import { Header } from "./components/Header";
import { ResearchPanel } from "./features/research-panel/ResearchPanel";
import { MechanicsCanvas } from "./features/mechanics-canvas/MechanicsCanvas";
import { ThesisSandbox } from "./features/thesis-sandbox/ThesisSandbox";
import { TimelineBar } from "./components/TimelineBar";
import { LiquidityBackground } from "./components/LiquidityBackground";
import { ViewTabs } from "./components/ViewTabs";
import { useStore } from "./state/store";
import { canvasEventBus, createSymbol } from "@rtoken-lab/core";
import type { CanvasEvent, NormalizedPremium } from "@rtoken-lab/core";

const MCP_ENABLED = import.meta.env.VITE_ENABLE_LIVE_MCP !== "false";

// ============================================================================
// App Providers
// ============================================================================

interface AppContextValue {
  selectedSymbol: string | null;
  setSelectedSymbol: (symbol: string | null) => void;
  timeRange: { start: number; end: number } | null;
  setTimeRange: (range: { start: number; end: number } | null) => void;
  activeView: "price" | "premium" | "heatmap" | "flow" | "funding";
  setActiveView: (view: "price" | "premium" | "heatmap" | "flow" | "funding") => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}

function AppProvider({ children }: { children: React.ReactNode }) {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>("AAPL");
  const [timeRange, setTimeRange] = useState<{ start: number; end: number } | null>(() => {
    const end = Math.floor(Date.now() / 1000);
    const start = end - 7 * 24 * 60 * 60;
    return { start, end };
  });
  const [activeView, setActiveView] = useState<"price" | "premium" | "heatmap" | "flow" | "funding">("price");

  return (
    <AppContext.Provider
      value={{
        selectedSymbol,
        setSelectedSymbol,
        timeRange,
        setTimeRange,
        activeView,
        setActiveView,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ============================================================================
// Main App Component
// ============================================================================

function AppInner() {
  const { selectedSymbol, setSelectedSymbol, timeRange, setTimeRange, activeView, setActiveView } = useAppContext();
  const { addNotification } = useStore();
  const [livePremium, setLivePremium] = useState<NormalizedPremium | null>(null);

  useEffect(() => {
    if (!MCP_ENABLED || !selectedSymbol) return;
    let cancelled = false;
    getMcpClient()
      .getPremiumData(createSymbol(selectedSymbol), true)
      .then((premium) => {
        if (!cancelled) setLivePremium(premium);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLivePremium(null);
          console.warn("Live premium unavailable; using demo surface.", error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSymbol]);

  // Initialize MCP client
  useEffect(() => {
    if (MCP_ENABLED) {
      initializeMcpClient().catch((err) => {
        console.error("Failed to initialize MCP client:", err);
        addNotification({
          type: "error",
          title: "Connection Error",
          message: "Failed to connect to Bitget MCP server. Running in demo mode.",
        });
      });
    }
  }, [addNotification]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("rtoken-view-change", { detail: activeView }));
  }, [activeView]);

  // Listen for canvas events from Research Panel
  useEffect(() => {
    const unsub = canvasEventBus.on("set-comparison", (event: CanvasEvent) => {
      if (event.type === "set-comparison") {
        setSelectedSymbol(event.symbol);
      }
    });
    return unsub;
  }, [setSelectedSymbol]);

  useEffect(() => {
    const unsub = canvasEventBus.on("set-view", (event: CanvasEvent) => {
      if (event.type === "set-view") {
        setActiveView(event.view);
      }
    });
    return unsub;
  }, [setActiveView]);

  useEffect(() => {
    const unsub = canvasEventBus.on("set-time-range", (event: CanvasEvent) => {
      if (event.type === "set-time-range") {
        setTimeRange({
          start: Math.floor(new Date(event.start).getTime() / 1000),
          end: Math.floor(new Date(event.end).getTime() / 1000),
        });
      }
    });
    return unsub;
  }, [setTimeRange]);

  useEffect(() => {
    const unsub = canvasEventBus.on("highlight-time-range", (event: CanvasEvent) => {
      if (event.type === "highlight-time-range") {
        setTimeRange({
          start: Math.floor(new Date(event.start).getTime() / 1000),
          end: Math.floor(new Date(event.end).getTime() / 1000),
        });
      }
    });
    return unsub;
  }, [setTimeRange]);

  return (
    <div className="app-layout">
      <LiquidityBackground />
      <Header
        selectedSymbol={selectedSymbol}
        onSymbolChange={setSelectedSymbol}
        activeView={activeView}
        onViewChange={setActiveView}
        livePremium={livePremium}
      />

      <aside className="app-left-panel panel">
        <ResearchPanel
          selectedSymbol={selectedSymbol}
          timeRange={timeRange}
          livePremium={livePremium}
        />
      </aside>

      <main className="app-center-canvas">
        <ViewTabs
          activeView={activeView}
          onChange={setActiveView}
          className="app-tabs"
        />
        <div className="canvas-container">
          <MechanicsCanvas
            symbol={selectedSymbol}
            timeRange={timeRange}
            view={activeView}
            livePremium={livePremium}
          />
        </div>
        <TimelineBar className="app-footer" />
      </main>

      <aside className="app-right-panel panel">
        <ThesisSandbox
          selectedSymbol={selectedSymbol}
          timeRange={timeRange}
        />
      </aside>
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}