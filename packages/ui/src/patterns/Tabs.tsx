import { cn } from "../primitives/Box";
import { Text } from "../primitives/Text";
import type { ReactNode, HTMLAttributes } from "react";
import { useState } from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: string | number;
  children?: ReactNode;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  variant?: "line" | "enclosed" | "soft";
  fullWidth?: boolean;
}

const variantStyles: Record<string, { container: string; trigger: string; active: string }> = {
  line: {
    container: "border-b border-[var(--color-border-default)]",
    trigger: "relative py-3 px-1 text-sm font-medium text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)] focus-visible:outline-none focus-visible:text-[var(--color-fg-primary)]",
    active: "text-[var(--color-accent-positive)]",
  },
  enclosed: {
    container: "bg-[var(--color-bg-base)] rounded-[var(--radius-md)] p-1",
    trigger: "rounded-[var(--radius-sm)] py-2 px-3 text-sm font-medium text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)] focus-visible:outline-none focus-visible:bg-[var(--color-bg-hover)]",
    active: "bg-[var(--color-bg-elevated)] text-[var(--color-fg-primary)] shadow-[var(--shadow-sm)]",
  },
  soft: {
    container: "gap-1",
    trigger: "rounded-[var(--radius-md)] py-2 px-3 text-sm font-medium text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)] hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:bg-[var(--color-bg-hover)]",
    active: "bg-[var(--color-accent-positive-bg)] text-[var(--color-accent-positive)]",
  },
};

export const Tabs = ({
  className,
  tabs,
  value,
  onChange,
  variant = "line",
  fullWidth,
  ...props
}: TabsProps) => {
  const styles = variantStyles[variant];

  return (
    <div className={cn("w-full", className)} {...props}>
      <div
        className={cn(
          "flex items-center",
          variant === "line" && styles.container,
          variant !== "line" && styles.container,
          fullWidth && "w-full"
        )}
        role="tablist"
        aria-label="Tabs"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={value === tab.id}
            aria-disabled={tab.disabled}
            disabled={tab.disabled}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap transition-colors duration-fast",
              styles.trigger,
              value === tab.id && styles.active,
              tab.disabled && "opacity-50 cursor-not-allowed",
              fullWidth && "flex-1 justify-center"
            )}
            onClick={() => !tab.disabled && onChange(tab.id)}
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
          >
            {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
            {tab.label}
            {tab.badge && (
              <span
                className={cn(
                  "flex items-center justify-center min-w-[1.25rem] h-5 rounded-full px-1.5 text-[10px] font-medium",
                  value === tab.id
                    ? "bg-[var(--color-accent-positive)] text-[var(--color-fg-inverse)]"
                    : "bg-[var(--color-bg-hover)] text-[var(--color-fg-muted)]"
                )}
              >
                {tab.badge}
              </span>
            )}
            {variant === "line" && value === tab.id && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-accent-positive)] animate-in slide-in-from-left duration-fast"
                aria-hidden="true"
              />
            )}
          </button>
        ))}
      </div>
      <div className="mt-4" role="tabpanel" aria-labelledby={`tab-${value}`} id={`panel-${value}`}>
        {tabs.find((t) => t.id === value)?.children}
      </div>
    </div>
  );
};

Tabs.displayName = "Tabs";

