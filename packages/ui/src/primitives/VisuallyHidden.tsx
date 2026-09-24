import { cn } from "./Box";
import type { HTMLAttributes } from "react";

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
  as?: "span" | "div";
}

/**
 * Visually hidden but accessible to screen readers.
 * Use for labels that should not be visible but need to be announced.
 */
export function VisuallyHidden({
  as: Component = "span",
  className,
  children,
  ...props
}: VisuallyHiddenProps) {
  return (
    <Component
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        "opacity-0 pointer-events-none",
        "[clip:rect(0,0,0,0)]",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

VisuallyHidden.displayName = "VisuallyHidden";

/**
 * Focusable visually hidden - becomes visible on focus (for skip links)
 */
export function FocusableVisuallyHidden({
  as: Component = "span",
  className,
  children,
  ...props
}: VisuallyHiddenProps) {
  return (
    <Component
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        "opacity-0 pointer-events-none",
        "[clip:rect(0,0,0,0)]",
        "focus:static focus:w-auto focus:h-auto focus:p-2 focus:m-0 focus:opacity-100 focus:pointer-events-auto focus:clip-auto",
        "focus:z-[var(--z-focus-trap)] focus:bg-[var(--color-bg-base)] focus:text-[var(--color-fg-primary)]",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

FocusableVisuallyHidden.displayName = "FocusableVisuallyHidden";