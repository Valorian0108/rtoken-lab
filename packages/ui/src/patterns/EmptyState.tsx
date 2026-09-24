import { cn } from "../primitives/Box";
import { Text } from "../primitives/Text";
import { Button } from "../primitives/Button";
import type { ReactNode, HTMLAttributes } from "react";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "ghost";
  };
  illustration?: ReactNode;
}

export const EmptyState = ({
  className,
  title,
  description,
  icon,
  action,
  illustration,
  ...props
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center text-center p-12 rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]",
      className
    )}
    {...props}
  >
    {illustration ? (
      <div className="mb-6 text-[var(--color-fg-muted)]">{illustration}</div>
    ) : icon ? (
      <div className="mb-6 w-16 h-16 rounded-full bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-fg-muted)] mx-auto">
        {icon}
      </div>
    ) : null}
    <Text variant="heading-md" weight="semibold" className="mb-2">
      {title}
    </Text>
    {description && (
      <Text variant="body" color="secondary" className="mb-6 max-w-sm">
        {description}
      </Text>
    )}
    {action && (
      <Button variant={action.variant ?? "primary"} onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
);

EmptyState.displayName = "EmptyState";

export const EmptyStateIllustrations = {
  noData: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-fg-muted)]">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 9h6M9 13h6M9 17h4" />
    </svg>
  ),
  noResults: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-fg-muted)]">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M8 8l6 6" />
    </svg>
  ),
  noConnection: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-fg-muted)]">
      <path d="M1 1l22 22" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  ),
  error: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-accent-negative)]">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
} as const;