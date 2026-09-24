import { cn } from "./Box";
import { Text } from "./Text";
import type { HTMLAttributes } from "react";

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical";
  variant?: "subtle" | "default" | "strong";
  label?: string;
  labelPosition?: "start" | "center" | "end";
}

export const Divider = ({
  className,
  orientation = "horizontal",
  variant = "default",
  label,
  labelPosition = "center",
  ...props
}: DividerProps) => {
  const variantStyles = {
    subtle: "bg-[var(--color-border-subtle)]",
    default: "bg-[var(--color-border-default)]",
    strong: "bg-[var(--color-border-strong)]",
  };

  if (orientation === "vertical") {
    return (
      <div
        className={cn(
          "h-full w-px",
          variantStyles[variant],
          className
        )}
        role="separator"
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div className={cn("flex items-center gap-3", className)} role="separator" {...props}>
        <div className={cn("flex-1 h-px", variantStyles[variant], labelPosition === "start" && "flex-initial", labelPosition === "end" && "flex-initial")} />
        <Text variant="overline" color="muted">{label}</Text>
        <div className={cn("flex-1 h-px", variantStyles[variant], labelPosition === "end" && "flex-initial", labelPosition === "start" && "flex-initial")} />
      </div>
    );
  }

  return (
    <hr
      className={cn(
        "border-0",
        variantStyles[variant],
        className
      )}
      role="separator"
      {...props}
    />
  );
};

Divider.displayName = "Divider";