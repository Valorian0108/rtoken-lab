import { useState, useRef, useEffect } from "react";
import type { NormalizedPremium } from "@rtoken-lab/core";
import { Box, Text, Button, Input, Select, Tooltip } from "@rtoken-lab/ui";
import type { SelectOption } from "@rtoken-lab/ui";

interface HeaderProps {
  selectedSymbol: string | null;
  onSymbolChange: (symbol: string | null) => void;
  activeView: string;
  onViewChange: (view: "price" | "premium" | "heatmap" | "flow" | "funding") => void;
  livePremium?: NormalizedPremium | null;
}

const COMMON_SYMBOLS: SelectOption[] = [
  { value: "AAPL", label: "AAPL — Apple" },
  { value: "NVDA", label: "NVDA — NVIDIA" },
  { value: "TSLA", label: "TSLA — Tesla" },
  { value: "MSFT", label: "MSFT — Microsoft" },
  { value: "GOOGL", label: "GOOGL — Alphabet" },
  { value: "AMZN", label: "AMZN — Amazon" },
  { value: "META", label: "META — Meta" },
  { value: "AMD", label: "AMD — AMD" },
  { value: "INTC", label: "INTC — Intel" },
  { value: "AVGO", label: "AVGO — Broadcom" },
];

export function Header({
  selectedSymbol,
  onSymbolChange,
  activeView,
  onViewChange,
  livePremium,
}: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSymbols = COMMON_SYMBOLS.filter((s) =>
    s.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="app-header" style={{
      background: "var(--color-bg-elevated)",
      borderBottom: "1px solid var(--color-border-subtle)",
      padding: "var(--space-3) var(--space-4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-4)",
      flexWrap: "wrap",
      position: "relative",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: "var(--radius-md)",
          background: "linear-gradient(135deg, var(--color-accent-positive), var(--color-accent-warning))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <Text variant="heading-md" weight="bold" color="primary">rToken Lab</Text>
          <Text variant="caption" color="muted">Research Instrument for Tokenized Stock Mechanics</Text>
        </div>
      </div>

      <div ref={searchRef} style={{ position: "relative", flex: 1, maxWidth: 400 }}>
        <Box flex alignItems="center" gap={2}>
          <Input
            placeholder="Search symbol (AAPL, NVDA, TSLA...)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            size="sm"
            style={{ width: isSearchOpen ? "100%" : 200, transition: "width var(--duration-fast)" }}
          />
          {isSearchOpen && searchQuery && (
            <div style={{
              position: "absolute",
              top: "calc(100% + var(--space-2))",
              left: 0,
              right: 0,
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-md)",
              zIndex: "var(--z-dropdown)",
              maxHeight: 280,
              overflow: "auto",
            }}>
              {filteredSymbols.length === 0 ? (
                <div style={{ padding: "var(--space-3)", color: "var(--color-fg-muted)", fontSize: "var(--text-sm)" }}>
                  No matches found
                </div>
              ) : (
                filteredSymbols.map((sym) => (
                  <button
                    key={sym.value}
                    onClick={() => {
                      onSymbolChange(sym.value);
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }}
                    style={{
                      width: "100%",
                      padding: "var(--space-2) var(--space-3)",
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      color: "var(--color-fg-primary)",
                      fontSize: "var(--text-sm)",
                      cursor: "pointer",
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "var(--color-bg-hover)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <Text variant="body-sm" weight="medium" mono>{sym.value}</Text>
                    <Text variant="caption" color="muted" className="block">{sym.label.split("—")[1]?.trim()}</Text>
                  </button>
                ))
              )}
            </div>
          )}
        </Box>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        {livePremium && (
          <Tooltip
            content={`Native ${livePremium.nativePrice} · rToken ${livePremium.rTokenPrice} · ${livePremium.nativeSource.endpoint} + ${livePremium.rTokenSource.endpoint}`}
            position="bottom"
          >
            <span className="premium-indicator" data-testid="header-premium">
              <span className="premium-indicator__value" style={{ color: livePremium.premiumBps >= 0 ? "var(--color-accent-positive)" : "var(--color-accent-negative)" }}>
                {livePremium.premiumBps >= 0 ? "+" : ""}{livePremium.premiumBps.toFixed(0)} bps
              </span>
              <span className="premium-indicator__label">premium</span>
            </span>
          </Tooltip>
        )}
        <Tooltip content="Live data from Bitget MCP" position="top">
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-1)",
            padding: "var(--space-1) var(--space-2)",
            borderRadius: "var(--radius-full)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-medium)",
            fontFamily: "var(--font-mono)",
            background: "var(--color-accent-positive-bg)",
            color: "var(--color-accent-positive-fg)",
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--color-accent-positive)",
              animation: "pulse 2s infinite",
            }} />
            LIVE
          </span>
        </Tooltip>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSymbolChange(null)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span style={{ display: "none" }}>Reset</span>
        </Button>
      </div>
    </header>
  );
}