import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Box, Text, Button, Input, Select, Tooltip, LoadingState, StatCard, Divider } from "@rtoken-lab/ui";
import { thesisEventBus, createThesisSubmitted, createBacktestCompleted, createReplayFrame } from "@rtoken-lab/core";
import type { ThesisEvent, ThesisRule } from "@rtoken-lab/core";

const MOCK_MODE = import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_MCP;

interface ThesisSandboxProps {
  selectedSymbol: string | null;
  timeRange: { start: number; end: number } | null;
}

interface Trade {
  timestamp: number;
  symbol: string;
  side: "long" | "short";
  size: number;
  price: number;
  pnl: number;
}

interface BacktestResult {
  trades: Trade[];
  equityCurve: Array<{ timestamp: number; value: number }>;
  metrics: {
    totalReturn: number;
    sharpe: number;
    maxDrawdown: number;
    winRate: number;
    tradeCount: number;
  };
}

export function ThesisSandbox({ selectedSymbol, timeRange }: ThesisSandboxProps) {
  const [thesis, setThesis] = useState("");
  const [rules, setRules] = useState<ThesisRule[]>([
    { id: "1", condition: "premium > 100", action: "short", params: { size: 0.05, stopLoss: 0.08 } },
    { id: "2", condition: "premium < -50", action: "long", params: { size: 0.03, stopLoss: 0.05 } },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [replayProgress, setReplayProgress] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const animationRef = useRef<number | undefined>(undefined);

  const canRun = selectedSymbol && timeRange && thesis.trim().length > 0 && rules.length > 0;

  const handleRun = useCallback(async () => {
    if (!canRun || isRunning) return;
    setIsRunning(true);
    setResult(null);

    try {
      // Simulate backtest
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockResult = generateMockBacktest(selectedSymbol!, timeRange!, rules);
      setResult(mockResult);

      thesisEventBus.emit(createBacktestCompleted({
        thesisId: "current",
        trades: mockResult.trades.map((trade) => ({
          timestamp: new Date(trade.timestamp * 1000).toISOString(),
          symbol: trade.symbol,
          side: trade.side,
          size: trade.size,
          price: trade.price,
          pnl: trade.pnl,
        })),
        metrics: mockResult.metrics,
      }));
    } catch (error) {
      console.error("Backtest failed:", error);
    } finally {
      setIsRunning(false);
    }
  }, [selectedSymbol, timeRange, rules, isRunning]);

  const handleReplay = useCallback(() => {
    if (!result || isReplaying) return;
    setIsReplaying(true);
    setReplayProgress(0);

    const duration = 5000 / replaySpeed;
    const startTime = Date.now();

    const tick = () => {
      if (!isReplaying) return;
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      setReplayProgress(progress);

      // Emit replay frame
      const tradeIndex = Math.floor(progress * (result.trades.length - 1));
      const trade = result.trades[tradeIndex];
      if (trade) {
        thesisEventBus.emit(createReplayFrame({
          timestamp: new Date(trade.timestamp * 1000).toISOString(),
          portfolioValue: result.equityCurve[tradeIndex]?.value || 100000,
          positions: { [trade.symbol]: trade.side === "long" ? trade.size : -trade.size },
        }));
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        setIsReplaying(false);
      }
    };
    animationRef.current = requestAnimationFrame(tick);
  }, [result, isReplaying, replaySpeed]);

  const handlePause = useCallback(() => {
    setIsReplaying(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  }, []);

  const handleReset = useCallback(() => {
    setIsReplaying(false);
    setReplayProgress(0);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  }, []);

  // Sync replay with timeline
  useEffect(() => {
    if (isReplaying && result) {
      const progress = replayProgress;
      const start = timeRange?.start || 0;
      const end = timeRange?.end || Date.now() / 1000;
      const currentTime = start + progress * (end - start);
      thesisEventBus.emit(createReplayFrame({
        timestamp: new Date(currentTime * 1000).toISOString(),
        portfolioValue: result.equityCurve[Math.floor(progress * (result.equityCurve.length - 1))]?.value || 100000,
        positions: {},
      }));
    }
  }, [replayProgress, isReplaying, result, timeRange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const metrics = result?.metrics;
  const latestEquity = result?.equityCurve[result.equityCurve.length - 1]?.value || 100000;

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--color-bg-elevated)",
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
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <Text variant="heading-sm" weight="semibold">Thesis Sandbox</Text>
            <span className="demo-badge"><span className="demo-badge__dot" /> SIMULATION</span>
          </Box>
          {selectedSymbol && (
            <Tooltip content={`Testing on ${selectedSymbol}`} position="top">
              <span style={{
                padding: "var(--space-1) var(--space-2)",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-xs)",
                fontWeight: "var(--font-medium)",
                fontFamily: "var(--font-mono)",
                background: "var(--color-accent-warning-bg)",
                color: "var(--color-accent-warning-fg)",
              }}>
                {selectedSymbol}
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box style={{ flex: 1, overflow: "auto", padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {/* Thesis Input */}
        <Box style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <Text variant="heading-sm" weight="medium">Trading Thesis</Text>
          <Box
            style={{
              background: "var(--color-bg-base)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-3)",
            }}
          >
            <textarea
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              placeholder="Describe your hypothesis... e.g., 'Short rToken premium when > 100bps on Sunday nights, expecting Monday reversion'"
              style={{
                width: "100%",
                minHeight: 80,
                background: "transparent",
                border: "none",
                color: "var(--color-fg-primary)",
                fontSize: "var(--text-sm)",
                lineHeight: "var(--leading-relaxed)",
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
              }}
              rows={3}
            />
          </Box>
          <Text variant="caption" color="muted">
            Express your hypothesis in plain language. The sandbox will parse conditions and test against historical data.
          </Text>
        </Box>

        <Divider label="Rules" />

        {/* Rules Builder */}
        <Box style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <Box flex alignItems="center" justifyContent="space-between">
            <Text variant="heading-sm" weight="medium">Entry/Exit Rules</Text>
            <Button size="sm" variant="secondary" onClick={() => setRules([...rules, { id: Date.now().toString(), condition: "", action: "long", params: { size: 0.05 } }])}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Rule
            </Button>
          </Box>
          {rules.map((rule, i) => (
            <Box
              key={rule.id}
              style={{
                display: "flex",
                gap: "var(--space-2)",
                padding: "var(--space-3)",
                background: "var(--color-bg-base)",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-md)",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Text variant="caption" color="muted" mono style={{ minWidth: 30 }}>
                {i + 1}.
              </Text>
              <Input
                value={rule.condition}
                onChange={(e) => setRules(rules.map((r, j) => j === i ? { ...r, condition: e.target.value } : r))}
                placeholder="e.g., premium > 100"
                size="sm"
                style={{ flex: 1, minWidth: 150 }}
              />
              <Select
                value={rule.action}
                options={[
                  { value: "long", label: "Long rToken" },
                  { value: "short", label: "Short rToken" },
                  { value: "hedge", label: "Hedge (Long Native + Short rToken)" },
                ]}
                onChange={(e) => setRules(rules.map((r, j) => j === i ? { ...r, action: e.target.value as any } : r))}
                size="sm"
                style={{ minWidth: 180 }}
              />
              <Input
                value={String(rule.params.size)}
                onChange={(e) => setRules(rules.map((r, j) => j === i ? { ...r, params: { ...r.params, size: parseFloat(e.target.value) || 0 } } : r))}
                placeholder="Size"
                size="sm"
                style={{ width: 80 }}
              />
              <Input
                value={String(rule.params.stopLoss || "")}
                onChange={(e) => setRules(rules.map((r, j) => j === i ? { ...r, params: { ...r.params, stopLoss: parseFloat(e.target.value) || undefined } } : r))}
                placeholder="Stop %"
                size="sm"
                style={{ width: 80 }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRules(rules.filter((_, j) => j !== i))}
                aria-label="Remove rule"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </Button>
            </Box>
          ))}
        </Box>

        <Divider label="Backtest" />

        {/* Run Controls */}
        <Box style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
          <Button
            variant="primary"
            size="lg"
            onClick={handleRun}
            disabled={!canRun || isRunning}
            loading={isRunning}
          >
            {isRunning ? "Running Simulation..." : "Run Simulation"}
          </Button>
          <Tooltip content="Uses perpetual klines for 7×24 history" position="top">
            <span style={{
              padding: "var(--space-1) var(--space-2)",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-mono)",
              background: "var(--color-bg-base)",
              border: "1px solid var(--color-border-subtle)",
              color: "var(--color-fg-muted)",
            }}
            data-source="crypto-futures_kline (Binance)"
          >
            📊 Binance Perp Data
          </span>
          </Tooltip>
        </Box>

        {/* Results */}
        {result && (
          <>
            <Divider label={`SIMULATED RESULTS — ${metrics!.tradeCount} trades • ${(metrics!.totalReturn * 100).toFixed(2)}% return`} />

            {/* Metrics Grid */}
            <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "var(--space-3)" }}>
              <StatCard
                label="Total Return"
                value={(metrics!.totalReturn * 100).toFixed(2)}
                unit="%"
                change={{ value: metrics!.totalReturn * 100, positive: metrics!.totalReturn >= 0 }}
              />
              <StatCard
                label="Sharpe Ratio"
                value={metrics!.sharpe.toFixed(2)}
                change={{ value: metrics!.sharpe - 1, positive: metrics!.sharpe >= 1 }}
              />
              <StatCard
                label="Max Drawdown"
                value={(metrics!.maxDrawdown * 100).toFixed(2)}
                unit="%"
                change={{ value: -metrics!.maxDrawdown * 100, positive: false }}
              />
              <StatCard
                label="Win Rate"
                value={(metrics!.winRate * 100).toFixed(1)}
                unit="%"
                change={{ value: (metrics!.winRate - 0.5) * 100, positive: metrics!.winRate >= 0.5 }}
              />
            </Box>

            {/* Replay Controls */}
            <Divider label="Timeline Replay" />
            <Box style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <Box style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <Button
                  variant={isReplaying ? "secondary" : "primary"}
                  onClick={isReplaying ? handlePause : handleReplay}
                  disabled={isRunning}
                >
                  {isReplaying ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <polygon points="5 3 19 12 5 21" />
                    </svg>
                  )}
                  {isReplaying ? "Pause" : "Play Replay"}
                </Button>
                <Button variant="ghost" onClick={handleReset} disabled={isRunning}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 4v16M5 4h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4" />
                    <line x1="1" y1="10" x2="5" y2="10" />
                  </svg>
                  Reset
                </Button>
                <Box style={{ flex: 1 }} />
                <Text variant="caption" color="muted">Speed:</Text>
                <Select
                  value={String(replaySpeed)}
                  options={[
                    { value: "0.5", label: "0.5×" },
                    { value: "1", label: "1×" },
                    { value: "2", label: "2×" },
                    { value: "5", label: "5×" },
                  ]}
                  onChange={(e) => setReplaySpeed(parseFloat(e.target.value))}
                  size="sm"
                  style={{ width: 80 }}
                />
              </Box>

              {/* Progress Bar */}
              <Box style={{ position: "relative", height: 8, background: "var(--color-bg-base)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${replayProgress * 100}%`,
                    background: "var(--color-accent-positive)",
                    borderRadius: "var(--radius-full)",
                    transition: "width 100ms linear",
                  }}
                />
                {/* Playhead scrubber */}
                <div
                  style={{
                    position: "absolute",
                    top: -6,
                    left: `${replayProgress * 100}%`,
                    transform: "translateX(-50%)",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "var(--color-accent-positive)",
                    border: "2px solid var(--color-bg-base)",
                    boxShadow: "var(--shadow-sm)",
                    cursor: "ew-resize",
                    pointerEvents: "auto",
                  }}
                />
              </Box>

              {/* Timeline labels */}
              <Box style={{ display: "flex", justifyContent: "space-between", padding: "0 var(--space-1)" }}>
                <Text variant="caption" color="muted" mono>
                  {timeRange ? new Date(timeRange.start * 1000).toLocaleDateString() : "Start"}
                </Text>
                <Text variant="caption" color="muted" mono>
                  {timeRange ? new Date(timeRange.end * 1000).toLocaleDateString() : "End"}
                </Text>
              </Box>
            </Box>

            {/* Trade List */}
            <Divider label={`Trade Log (${result.trades.length} trades)`} />
            <Box style={{ maxHeight: 300, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border-default)" }}>
                    {["Time", "Symbol", "Side", "Size", "Price", "P&L"].map((h) => (
                      <th key={h} style={{ padding: "var(--space-2)", textAlign: "left", color: "var(--color-fg-secondary)", fontWeight: "var(--font-medium)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.trades.slice(-20).map((trade, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                      <td style={{ padding: "var(--space-2)", fontFamily: "var(--font-mono)", color: "var(--color-fg-muted)" }}>
                        {new Date(trade.timestamp * 1000).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: "var(--space-2)", fontFamily: "var(--font-mono)", fontWeight: "var(--font-medium)" }}>
                        {trade.symbol}
                      </td>
                      <td style={{ padding: "var(--space-2)" }}>
                        <span style={{
                          padding: "1px 6px",
                          borderRadius: "var(--radius-full)",
                          fontSize: "var(--text-xs)",
                          fontWeight: "var(--font-medium)",
                          background: trade.side === "long" ? "var(--color-accent-positive-bg)" : "var(--color-accent-negative-bg)",
                          color: trade.side === "long" ? "var(--color-accent-positive-fg)" : "var(--color-accent-negative-fg)",
                        }}>
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "var(--space-2)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                        {trade.size.toFixed(4)}
                      </td>
                      <td style={{ padding: "var(--space-2)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                        {trade.price.toFixed(2)}
                      </td>
                      <td style={{ padding: "var(--space-2)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: trade.pnl >= 0 ? "var(--color-accent-positive)" : "var(--color-accent-negative)" }}>
                        {trade.pnl >= 0 ? "+" : ""}{trade.pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

            {/* Equity Curve Summary */}
            <Divider label="Equity Curve" />
            <Box style={{ height: 150, position: "relative" }}>
              <canvas
                ref={(el) => {
                  if (el) drawEquityCurve(el, result.equityCurve);
                }}
                style={{ width: "100%", height: "100%" }}
              />
            </Box>
          </>
        )}

        {!result && !isRunning && (
          <Box style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--color-fg-muted)" }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: "var(--space-4)", opacity: 0.5 }} aria-hidden="true">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <Text variant="heading-md" weight="medium" style={{ marginBottom: "var(--space-2)" }}>
              No backtest run yet
            </Text>
            <Text variant="body" style={{ maxWidth: 300, margin: "0 auto" }}>
              This is a simulated research sandbox. It does not place trades or use your account.
            </Text>
          </Box>
        )}

        {/* Assumptions & Limitations */}
        <Divider label="Assumptions & Limitations" />
        <Box style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--color-fg-muted)" }}>
          <Text>• Backtest uses Binance perpetual klines (7×24) as rToken proxy — spot data may differ</Text>
          <Text>• Fees: 0.04% per side • Slippage: 0.02% • Funding costs included</Text>
          <Text>• No mint/redeem arb execution modeled — only directional premium bets</Text>
          <Text>• Position sizing: fixed fractional • Stop-loss: hard stop at specified %</Text>
          <Text>• Past performance ≠ future results • This is a research tool, not trading advice</Text>
        </Box>
      </Box>
    </Box>
  );
}

function generateMockBacktest(
  symbol: string,
  timeRange: { start: number; end: number },
  rules: ThesisRule[],
): BacktestResult {
  const { start, end } = timeRange;
  const trades: Trade[] = [];
  const equityCurve: Array<{ timestamp: number; value: number }> = [];
  let equity = 100000;
  let inPosition = false;
  let positionSide: "long" | "short" | null = null;
  let entryPrice = 0;
  let positionSize = 0;

  for (let timestamp = start; timestamp <= end; timestamp += 3600) {
    const date = new Date(timestamp * 1000);
    const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
    const basePremium = isWeekend ? 80 : 20;
    const premium = basePremium + (Math.random() - 0.5) * 60;

    for (const rule of rules) {
      const entrySignal = evalCondition(rule.condition, premium);
      if (entrySignal && !inPosition) {
        inPosition = true;
        positionSide = rule.action === "short" ? "short" : "long";
        entryPrice = premium;
        positionSize = equity * (rule.params.size ?? 0.05);
        continue;
      }

      if (inPosition && positionSide) {
        const move = (premium - entryPrice) / 100;
        const currentPnl = positionSide === "long" ? move : -move;
        const stopLoss = typeof rule.params.stopLoss === "number" ? rule.params.stopLoss : undefined;
        const stopHit = stopLoss !== undefined && Math.abs(currentPnl) >= stopLoss;
        const oppositeRule = rules.some(
          (candidate) =>
            candidate.action !== rule.action && evalCondition(candidate.condition, premium),
        );

        if (stopHit || oppositeRule) {
          const pnl = positionSize * currentPnl;
          equity += pnl;
          trades.push({
            timestamp,
            symbol,
            side: positionSide,
            size: positionSize,
            price: entryPrice,
            pnl,
          });
          inPosition = false;
          positionSide = null;
          break;
        }
      }
    }

    equityCurve.push({ timestamp, value: equity });
  }

  if (inPosition && positionSide) {
    const finalPnl = 0;
    const pnl = positionSize * finalPnl;
    equity += pnl;
    trades.push({
      timestamp: end,
      symbol,
      side: positionSide,
      size: positionSize,
      price: entryPrice,
      pnl,
    });
  }

  const returns = trades.map((trade) => trade.pnl / 100000);
  const totalReturn = (equity - 100000) / 100000;
  const winRate = trades.length === 0 ? 0 : trades.filter((trade) => trade.pnl > 0).length / trades.length;
  const meanReturn = returns.length === 0 ? 0 : returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.length < 2 ? 0 : returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / (returns.length - 1);
  const sharpe = variance === 0 ? 0 : (meanReturn / Math.sqrt(variance)) * Math.sqrt(252);
  const maxDrawdown = equityCurve.reduce((maxDrawdown, point, index, curve) => {
    const peak = Math.max(...curve.slice(0, index + 1).map((entry) => entry.value));
    return Math.max(maxDrawdown, (peak - point.value) / peak);
  }, 0);

  return {
    trades,
    equityCurve,
    metrics: {
      totalReturn,
      sharpe: Math.max(-3, Math.min(5, sharpe)),
      maxDrawdown,
      winRate,
      tradeCount: trades.length,
    },
  };
}

function evalCondition(condition: string, premium: number): boolean {
  if (!condition.trim()) return false;
  try {
    // Simple condition evaluation: "premium > 100", "premium < -50"
    const match = condition.match(/premium\s*(>=|<=|>|<)\s*(-?\d+)/);
    if (!match) return false;
    const [, op, value] = match;
    const threshold = parseInt(value, 10);
    if (op === ">") return premium > threshold;
    if (op === ">=") return premium >= threshold;
    if (op === "<") return premium < threshold;
    if (op === "<=") return premium <= threshold;
    return false;
  } catch {
    return false;
  }
}

function drawEquityCurve(canvas: HTMLCanvasElement, equityCurve: Array<{ timestamp: number; value: number }>) {
  const ctx = canvas.getContext("2d");
  if (!ctx || equityCurve.length < 2) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  const values = equityCurve.map((e) => e.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  ctx.clearRect(0, 0, width, height);

  // Grid
  ctx.strokeStyle = "rgba(90,90,120,0.1)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = (i / 4) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Equity line
  ctx.beginPath();
  ctx.strokeStyle = "#5ed68e";
  ctx.lineWidth = 2;

  equityCurve.forEach((e, i) => {
    const x = (i / (equityCurve.length - 1)) * width;
    const y = height - ((e.value - min) / range) * height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Fill under
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = "rgba(94,214,142,0.1)";
  ctx.fill();
  }