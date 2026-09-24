import { cn } from "../primitives/Box";
import { Text } from "../primitives/Text";
import { Divider } from "../primitives/Divider";
import type { ReactNode, HTMLAttributes } from "react";

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export const Panel = ({
  className,
  title,
  subtitle,
  icon,
  actions,
  collapsible,
  defaultOpen = true,
  children,
  ...props
}: PanelProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] overflow-hidden",
        className
      )}
      {...props}
    >
      {(title || actions) && (
        <div
          className={cn(
            "flex items-center justify-between gap-4 p-4 border-b border-[var(--color-border-subtle)]",
            collapsible && "cursor-pointer"
          )}
          onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
        >
          <div className="flex items-center gap-3 min-w-0">
            {icon && <div className="flex-shrink-0 text-[var(--color-fg-muted)]">{icon}</div>}
            <div className="min-w-0">
              {title && (
                <Text variant="heading-sm" weight="semibold" truncate>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text variant="caption" color="muted" className="mt-0.5">
                  {subtitle}
                </Text>
              )}
            </div>
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
          {collapsible && (
            <svg
              className={cn(
                "w-4 h-4 text-[var(--color-fg-muted)] flex-shrink-0 transition-transform duration-fast",
                isOpen && "rotate-180"
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          )}
        </div>
      )}
      <div
        className={cn("transition-all duration-normal overflow-hidden", isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0")}
        style={{ overflow: "hidden" }}
      >
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

import { useState } from "react";

Panel.displayName = "Panel";

export interface PanelSectionProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export const PanelSection = ({ className, title, description, children, ...props }: PanelSectionProps) => (
  <div className={cn("space-y-3", className)} {...props}>
    {(title || description) && (
      <div className="pb-3 border-b border-[var(--color-border-subtle)]">
        {title && <Text variant="heading-sm" weight="medium">{title}</Text>}
        {description && <Text variant="caption" color="muted" className="mt-0.5">{description}</Text>}
      </div>
    )}
    <div>{children}</div>
  </div>
);

PanelSection.displayName = "PanelSection";

export const PanelRow = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center gap-4 flex-wrap", className)} {...props}>
    {children}
  </div>
);

PanelRow.displayName = "PanelRow";