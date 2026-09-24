import { cn } from "../primitives/Box";
import { Text } from "../primitives/Text";
import { Tooltip } from "../primitives/Tooltip";
import type { ReactNode, HTMLAttributes } from "react";

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  change?: {
    value: number;
    label?: string;
    positive?: boolean;
  };
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  precision?: number;
  unit?: string;
  helpText?: string;
}

export const StatCard = ({
  className,
  label,
  value,
  change,
  icon,
  trend,
  unit,
  helpText,
  ...props
}: StatCardProps) => {
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] p-5 transition-all duration-normal hover:border-[var(--color-border-strong)]",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Text variant="caption" color="muted" weight="medium">
              {label}
            </Text>
            {helpText && (
              <Tooltip content={helpText} position="top">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-fg-muted)] cursor-help">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </Tooltip>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <Text variant="heading-xl" weight="bold" color="primary" tabularNums>
              {displayValue}
              {unit && <span className="text-[var(--color-fg-secondary)] font-normal">{unit}</span>}
            </Text>
            {change && (
              <Tooltip content={`${change.label ?? "Change"}: ${change.value >= 0 ? "+" : ""}${change.value.toFixed(2)}%`} position="top">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium tabular-nums",
                    change.positive !== false && change.value >= 0
                      ? "bg-[var(--color-accent-positive-bg)] text-[var(--color-accent-positive-fg)]"
                      : "bg-[var(--color-accent-negative-bg)] text-[var(--color-accent-negative-fg)]"
                  )}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    {change.value >= 0 ? (
                      <path d="M18 15l-6-6-6 6" />
                    ) : (
                      <path d="M6 9l6 6 6-6" />
                    )}
                  </svg>
                  {change.value >= 0 ? "+" : ""}{change.value.toFixed(2)}%
                </span>
              </Tooltip>
            )}
          </div>
        </div>
        {icon && <div className="flex-shrink-0 text-[var(--color-fg-muted)]">{icon}</div>}
      </div>
    </div>
  );
};

StatCard.displayName = "StatCard";

export interface StatGridProps extends HTMLAttributes<HTMLDivElement> {
  stats: Array<StatCardProps & { key?: string }>;
  columns?: 1 | 2 | 3 | 4;
}

export const StatGrid = ({
  className,
  stats,
  columns = 3,
  ...props
}: StatGridProps) => (
  <div
    className={cn(
      "grid gap-4",
      columns === 1 && "grid-cols-1",
      columns === 2 && "grid-cols-1 sm:grid-cols-2",
      columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      className
    )}
    {...props}
  >
    {stats.map((stat, i) => (
      <StatCard key={stat.key ?? `stat-${i}`} {...stat} />
    ))}
  </div>
);

StatGrid.displayName = "StatGrid";