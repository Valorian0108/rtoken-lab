import { cn } from "../primitives/Box";
import { Text } from "../primitives/Text";
import { Button } from "../primitives/Button";
import type { ReactNode, HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
}

const variantStyles: Record<string, string> = {
  default: "bg-[var(--color-bg-elevated)]",
  elevated: "bg-[var(--color-bg-elevated)] shadow-[var(--shadow-md)]",
  outlined: "bg-[var(--color-bg-base)] border border-[var(--color-border-default)]",
};

const paddingStyles: Record<string, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export const Card = ({
  className,
  variant = "default",
  padding = "md",
  hoverable,
  children,
  ...props
}: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] transition-shadow duration-normal",
        variantStyles[variant],
        paddingStyles[padding],
        hoverable && "hover:shadow-[var(--shadow-lg)] cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

Card.displayName = "Card";

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const CardHeader = ({ className, title, subtitle, action, ...props }: CardHeaderProps) => (
  <div className={cn("flex items-start justify-between gap-4 mb-4", className)} {...props}>
    <div className="flex-1 min-w-0">
      <Text variant="heading-sm" weight="semibold" truncate>
        {title}
      </Text>
      {subtitle && (
        <Text variant="caption" color="muted" className="mt-0.5">
          {subtitle}
        </Text>
      )}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

CardHeader.displayName = "CardHeader";

export const CardContent = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(className)} {...props}>{children}</div>
);

CardContent.displayName = "CardContent";

export const CardFooter = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center gap-3 mt-4 pt-4 border-t border-[var(--color-border-subtle)]", className)} {...props}>
    {children}
  </div>
);

CardFooter.displayName = "CardFooter";