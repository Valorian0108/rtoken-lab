import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { Box, Text } from "@rtoken-lab/ui";
import type { NormalizedPremium } from "@rtoken-lab/core";
import { getDemoScenario } from "./demo-scenarios";

type ViewMode = "price" | "premium" | "heatmap" | "flow" | "funding";

interface MechanicsCanvasProps {
  symbol: string | null;
  timeRange: { start: number; end: number } | null;
  view: ViewMode;
  livePremium?: NormalizedPremium | null;
}

interface Point {
  timestamp: number;
  native: number;
  rToken: number;
  premium: number;
}

function createDemoData(symbol: string, timeRange: { start: number; end: number }): { points: Point[]; scenario: string } {
  const base = symbol === "NVDA" ? 850 : symbol === "TSLA" ? 250 : symbol === "MSFT" ? 400 : 180;
  const points: Point[] = [];
  let native = base;
  let rToken = base * 1.003;
  let seed = [...symbol].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const scenario = getDemoScenario(symbol);

  for (let timestamp = timeRange.start; timestamp <= timeRange.end; timestamp += 3600) {
    const date = new Date(timestamp * 1000);
    const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
    const scenarioBias = scenario.bias && (scenario.id !== "market-hours" || isWeekend) ? scenario.bias : 0;
    native *= 1 + (random() - 0.5) * 0.0018;
    rToken *= 1 + (random() - 0.5) * 0.003 + scenarioBias;
    const premium = ((rToken - native) / native) * 10000;
    points.push({ timestamp, native, rToken, premium });
  }
  return { points, scenario: scenario.label };
}

function pathFor(values: number[], width: number, height: number, min: number, max: number): string {
  const range = max - min || 1;
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function MechanicsCanvas({ symbol, timeRange, view, livePremium }: MechanicsCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const viewLayerRef = useRef<SVGGElement>(null);
  const demo = useMemo(
    () => (symbol && timeRange ? createDemoData(symbol, timeRange) : { points: [], scenario: "WAITING" }),
    [symbol, timeRange],
  );
  const data = demo.points;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const paths = svg.querySelectorAll<SVGPathElement>("path[data-animated]");
    const context = gsap.context(() => {
      paths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.fromTo(
          path,
          { strokeDasharray: length, strokeDashoffset: length, opacity: 0.25 },
          { strokeDashoffset: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
        );
      });
      gsap.fromTo(
        svg.querySelectorAll("rect[data-heat-cell]"),
        { opacity: 0, scale: 0.96, transformOrigin: "center" },
        { opacity: 1, scale: 1, duration: 0.45, stagger: 0.002, ease: "power1.out" },
      );
    }, svg);
    return () => context.revert();
  }, [data, view, symbol]);

  useEffect(() => {
    const layer = viewLayerRef.current;
    if (!layer) return;
    const context = gsap.context(() => {
      gsap.fromTo(
        layer,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power3.out", overwrite: true },
      );
    }, layer);
    return () => context.revert();
  }, [view]);

  if (!symbol || !timeRange || data.length < 2) {
    return (
      <Box className="canvas-placeholder">
        <Text variant="heading-md" color="secondary">Select an instrument to begin</Text>
        <Text variant="body-sm" color="muted">The research surface will show price, premium, and 7×24 behavior here.</Text>
      </Box>
    );
  }

  const width = 1000;
  const height = 460;
  const nativeValues = data.map((point) => point.native);
  const rTokenValues = data.map((point) => point.rToken);
  const allPrices = [...nativeValues, ...rTokenValues];
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const maxPremium = Math.max(...data.map((point) => Math.abs(point.premium)), 1);
  const nativePath = pathFor(nativeValues, width, height, minPrice, maxPrice);
  const rTokenPath = pathFor(rTokenValues, width, height, minPrice, maxPrice);
  const premiumPath = pathFor(data.map((point) => point.premium), width, height, -maxPremium, maxPremium);
  const last = data.at(-1);
  if (!last) return null;

  return (
    <Box className="mechanics-surface">
      <Box className="mechanics-toolbar">
        <Text variant="overline" color="muted">Mechanics canvas · {symbol}</Text>
        <span className="demo-badge"><span className="demo-badge__dot" /> {demo.scenario} · DEMO SERIES</span>
      </Box>

      <svg ref={svgRef} className="mechanics-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${symbol} rToken mechanics visualization`}>
        <defs>
          <linearGradient id="premium-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-positive)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-accent-positive)" stopOpacity="0" />
          </linearGradient>
          <pattern id="instrument-grid" width="100" height="76" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 76" fill="none" stroke="var(--color-chart-grid)" strokeWidth="1" />
          </pattern>
        </defs>
        <g ref={viewLayerRef}>
        <rect width={width} height={height} fill="transparent" />
        <rect width={width} height={height} fill="url(#instrument-grid)" />

        {view === "price" && (
          <>
            <line x1="0" x2={width} y1={height / 2} y2={height / 2} stroke="var(--color-chart-grid)" />
            <path data-animated d={nativePath} fill="none" stroke="var(--color-series-native)" strokeWidth="2.5" />
            <path data-animated d={rTokenPath} fill="none" stroke="var(--color-series-rtoken-spot)" strokeWidth="2.5" />
            <text x="18" y="44" fill="var(--color-series-native)" fontSize="12" fontFamily="var(--font-mono)">native {livePremium?.nativePrice.toFixed(2) ?? last.native.toFixed(2)}</text>
            <text x="18" y="62" fill="var(--color-series-rtoken-spot)" fontSize="12" fontFamily="var(--font-mono)">rToken {livePremium?.rTokenPrice.toFixed(2) ?? last.rToken.toFixed(2)}</text>
          </>
        )}

        {view === "premium" && (
          <>
            <line x1="0" x2={width} y1={height / 2} y2={height / 2} stroke="var(--color-chart-grid)" strokeDasharray="6 6" />
            <path data-animated d={`${premiumPath} L ${width},${height / 2} L 0,${height / 2} Z`} fill="url(#premium-fill)" />
            <path data-animated d={premiumPath} fill="none" stroke="var(--color-series-premium)" strokeWidth="2.5" />
            <text x="18" y="44" fill="var(--color-series-premium)" fontSize="12" fontFamily="var(--font-mono)">premium {livePremium?.premiumBps.toFixed(1) ?? last.premium.toFixed(1)} bps</text>
          </>
        )}

        {view === "heatmap" && <Heatmap data={data} width={width} height={height} />}
        {view === "flow" && <FlowDiagram width={width} height={height} premium={last.premium} />}
        {view === "funding" && <FundingSurface data={data} width={width} height={height} />}

        <text x="18" y="24" fill="var(--color-fg-muted)" fontSize="12" fontFamily="var(--font-mono)">
          {view.toUpperCase()} · {new Date(timeRange.start * 1000).toLocaleDateString()} — {new Date(timeRange.end * 1000).toLocaleDateString()}
        </text>
        </g>
      </svg>
    </Box>
  );
}

function Heatmap({ data, width, height }: { data: Point[]; width: number; height: number }) {
  const columns = 24;
  const rows = Math.max(1, Math.ceil(data.length / columns));
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const max = Math.max(...data.map((point) => Math.abs(point.premium)), 1);

  return (
    <g>
      {data.map((point, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const intensity = Math.min(Math.abs(point.premium) / max, 1);
        return (
          <rect
            key={point.timestamp}
            data-heat-cell
            x={column * cellWidth}
            y={row * cellHeight}
            width={cellWidth + 0.5}
            height={cellHeight + 0.5}
            fill={point.premium >= 0 ? "var(--color-accent-positive)" : "var(--color-accent-negative)"}
            opacity={0.16 + intensity * 0.7}
          >
            <title>{`${new Date(point.timestamp * 1000).toLocaleString()}: ${point.premium.toFixed(1)} bps`}</title>
          </rect>
        );
      })}
    </g>
  );
}

function FlowDiagram({ width, height, premium }: { width: number; height: number; premium: number }) {
  return (
    <g>
      <line x1={width / 2 - 120} x2={width / 2 + 120} y1={height / 2} y2={height / 2} stroke="var(--color-chart-axis)" strokeWidth="2" />
      <circle cx={width / 2 - 120} cy={height / 2} r="52" fill="var(--color-accent-info-bg)" stroke="var(--color-accent-info)" strokeWidth="2" />
      <circle cx={width / 2 + 120} cy={height / 2} r="52" fill="var(--color-accent-negative-bg)" stroke="var(--color-accent-negative)" strokeWidth="2" />
      <text x={width / 2 - 120} y={height / 2 + 5} textAnchor="middle" fill="var(--color-fg-primary)" fontSize="12" fontFamily="var(--font-mono)">NATIVE</text>
      <text x={width / 2 + 120} y={height / 2 + 5} textAnchor="middle" fill="var(--color-fg-primary)" fontSize="12" fontFamily="var(--font-mono)">rTOKEN</text>
      <text x={width / 2} y={height / 2 - 24} textAnchor="middle" fill="var(--color-fg-secondary)" fontSize="13">
        {premium >= 0 ? "Mint pressure: rToken premium" : "Redeem pressure: rToken discount"}
      </text>
    </g>
  );
}

function FundingSurface({ data, width, height }: { data: Point[]; width: number; height: number }) {
  const values = data.filter((_, index) => index % 8 === 0).map((point) => Math.sin(point.timestamp / 100000) * 0.00008);
  const max = Math.max(Math.abs(values[0] ?? 0.01), 0.01);
  return (
    <g>
      {values.map((value, index) => {
        const barHeight = Math.max(8, (Math.abs(value) / max) * (height * 0.36));
        return <rect key={index} x={index * (width / Math.max(values.length, 1)) + 3} y={height / 2 - barHeight / 2} width={Math.max(3, width / Math.max(values.length, 1) - 6)} height={barHeight} fill={value >= 0 ? "var(--color-accent-negative)" : "var(--color-accent-positive)"} rx="2" />;
      })}
      <line x1="0" x2={width} y1={height / 2} y2={height / 2} stroke="var(--color-chart-axis)" />
    </g>
  );
}