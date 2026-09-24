import { Box, Text } from "@rtoken-lab/ui";

interface ViewTabsProps {
  activeView: "price" | "premium" | "heatmap" | "flow" | "funding";
  onChange: (view: "price" | "premium" | "heatmap" | "flow" | "funding") => void;
  className?: string;
}

const VIEWS: Array<{
  id: "price" | "premium" | "heatmap" | "flow" | "funding";
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    id: "price",
    label: "Price",
    description: "rToken vs Native comparison",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: "premium",
    label: "Premium",
    description: "NAV premium/discount over time",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: "heatmap",
    label: "Heatmap",
    description: "7×24 premium heatmap",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: "flow",
    label: "Flow",
    description: "Mint/Redeem visualization",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    id: "funding",
    label: "Funding",
    description: "Funding rate surface",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

export function ViewTabs({ activeView, onChange, className }: ViewTabsProps) {
  return (
    <Box
      as="nav"
      className={className}
      role="tablist"
      aria-label="Chart views"
      style={{
        display: "flex",
        gap: "var(--space-1)",
        padding: "var(--space-2) var(--space-4)",
        borderBottom: "1px solid var(--color-border-subtle)",
        background: "var(--color-bg-elevated)",
        overflowX: "auto",
        scrollbarWidth: "thin",
      }}
    >
      {VIEWS.map((view) => (
        <button
          key={view.id}
          role="tab"
          aria-selected={activeView === view.id}
          aria-controls={`panel-${view.id}`}
          id={`tab-${view.id}`}
          onClick={() => onChange(view.id)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-default)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-medium)",
            color: activeView === view.id ? "var(--color-accent-positive)" : "var(--color-fg-secondary)",
            background: activeView === view.id ? "var(--color-accent-positive-bg)" : "transparent",
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "all var(--duration-fast) var(--ease-out)",
          }}
          onMouseEnter={(e) => {
            if (activeView !== view.id) {
              e.currentTarget.style.color = "var(--color-fg-primary)";
              e.currentTarget.style.background = "var(--color-bg-hover)";
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== view.id) {
              e.currentTarget.style.color = "var(--color-fg-secondary)";
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          <span style={{ display: "inline-flex" }}>{view.icon}</span>
          <span>{view.label}</span>
        </button>
      ))}
    </Box>
  );
}