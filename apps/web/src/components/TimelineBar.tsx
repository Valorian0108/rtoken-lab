import { useState, useRef, useEffect, useCallback } from "react";
import { Box, Text, Button, Tooltip } from "@rtoken-lab/ui";
import { gsap } from "gsap";

interface TimelineBarProps {
  className?: string;
}

interface TimeRange {
  start: number;
  end: number;
}

export function TimelineBar({ className }: TimelineBarProps) {
  const [timeRange, setTimeRange] = useState<TimeRange | null>(() => {
    const end = Math.floor(Date.now() / 1000);
    const start = end - 7 * 24 * 60 * 60;
    return { start, end };
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Sync with global time range
  useEffect(() => {
    const handleTimeRangeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ start: number; end: number }>;
      if (customEvent.detail?.start && customEvent.detail?.end) {
        setTimeRange({ start: customEvent.detail.start, end: customEvent.detail.end });
      }
    };
    window.addEventListener("timerange-change", handleTimeRangeChange);
    return () => window.removeEventListener("timerange-change", handleTimeRangeChange);
  }, []);

  const drawTimeline = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !timeRange) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const { start, end } = timeRange;
    const duration = end - start;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-bg-base").trim();
    ctx.fillRect(0, 0, width, height);

    // Grid lines (days)
    const dayMs = 24 * 60 * 60;
    const startDay = Math.floor(start / dayMs) * dayMs;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-chart-grid").trim();
    ctx.lineWidth = 1;

    for (let t = startDay; t <= end; t += dayMs) {
      const x = ((t - start) / duration) * width;
      if (x >= 0 && x <= width) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }

    // Premium bands (mock data for now)
    const bands = [
      { label: "+2%", color: "var(--color-heatmap-deep-positive)", threshold: 200 },
      { label: "+1%", color: "var(--color-heatmap-positive)", threshold: 100 },
      { label: "0%", color: "var(--color-heatmap-neutral)", threshold: 0 },
      { label: "-1%", color: "var(--color-heatmap-negative)", threshold: -100 },
      { label: "-2%", color: "var(--color-heatmap-deep-negative)", threshold: -200 },
    ];

    // Draw premium zones (simplified)
    bands.forEach((band, i) => {
      const y = (i / (bands.length - 1)) * height;
      const bandHeight = height / bands.length;
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(band.color).trim() + "20";
      ctx.fillRect(0, y, width, bandHeight);
    });

    // Playhead
    if (isPlaying || playhead > 0) {
      const x = playhead * width;
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-chart-crosshair").trim();
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Playhead label
      const playheadTime = start + playhead * duration;
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-fg-primary").trim();
      ctx.font = "10px var(--font-mono)";
      ctx.textAlign = "center";
      ctx.fillText(new Date(playheadTime * 1000).toLocaleTimeString(), x, 14);
    }

    // Hover time indicator
    if (hoveredTime !== null) {
      const x = ((hoveredTime - start) / duration) * width;
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-accent-highlight").trim();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-fg-primary").trim();
      ctx.font = "10px var(--font-mono)";
      ctx.textAlign = "center";
      ctx.fillText(new Date(hoveredTime * 1000).toLocaleString(), x, height - 4);
    }
  }, [timeRange, isPlaying, playhead, hoveredTime]);

  useEffect(() => {
    drawTimeline();
  }, [drawTimeline]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!timeRange || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const hovered = timeRange.start + ratio * (timeRange.end - timeRange.start);
    setHoveredTime(hovered);
  }, [timeRange]);

  const handleMouseLeave = useCallback(() => {
    setHoveredTime(null);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!timeRange || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const clickedTime = timeRange.start + ratio * (timeRange.end - timeRange.start);
    setPlayhead(ratio);
  }, [timeRange]);

  const togglePlay = useCallback(() => {
    if (!timeRange) return;
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      animatePlayhead();
    }
  }, [isPlaying, timeRange]);

  const animatePlayhead = useCallback(() => {
    if (!isPlaying) return;
    const duration = 10000; // 10 seconds for full range
    const startTime = Date.now() - playhead * duration;

    const tick = () => {
      if (!isPlaying) return;
      const elapsed = Date.now() - startTime;
      const newPlayhead = Math.min(1, elapsed / duration);
      setPlayhead(newPlayhead);
      if (newPlayhead < 1) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        setIsPlaying(false);
        setPlayhead(0);
      }
    };
    animationRef.current = requestAnimationFrame(tick);
  }, [isPlaying, playhead]);

  useEffect(() => {
    if (isPlaying) {
      animatePlayhead();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, animatePlayhead]);

  const formatRange = useCallback((range: TimeRange | null) => {
    if (!range) return "No range";
    return `${new Date(range.start * 1000).toLocaleDateString()} — ${new Date(range.end * 1000).toLocaleDateString()}`;
  }, []);

  return (
    <Box
      className={className}
      style={{
        height: 120,
        background: "transparent",
        borderTop: "1px solid var(--color-border-subtle)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-2) var(--space-4)",
          borderBottom: "1px solid var(--color-border-subtle)",
          flexShrink: 0,
        }}
      >
        <Box flex gap={2} alignItems="center">
          <Text variant="caption" color="muted" weight="medium">TIMELINE</Text>
          <Text variant="body-sm" mono color="secondary" tabularNums>
            {formatRange(timeRange)}
          </Text>
        </Box>
        <Box flex gap={2} alignItems="center">
          <Tooltip content={isPlaying ? "Pause animation" : "Play timeline"} position="top">
            <Button
              variant={isPlaying ? "secondary" : "primary"}
              size="sm"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21" />
                </svg>
              )}
            </Button>
          </Tooltip>
          <Tooltip content="Reset to live" position="top">
            <Button variant="ghost" size="sm" onClick={() => setPlayhead(0)} aria-label="Reset">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M1 4v16M5 4h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4" />
                <line x1="1" y1="10" x2="5" y2="10" />
              </svg>
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <Box
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          aria-label="Timeline with premium bands and playhead"
        />
      </Box>
    </Box>
  );
}