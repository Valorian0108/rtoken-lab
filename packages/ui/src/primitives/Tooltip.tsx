import { cn } from "./Box";
import { Text } from "./Text";
import { useState, useRef, useEffect, type ReactNode } from "react";

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  offset?: number;
}

const positionStyles: Record<string, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowStyles: Record<string, string> = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-[var(--color-bg-elevated)]",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-[var(--color-bg-elevated)]",
  left: "left-full top-1/2 -translate-y-1/2 border-l-[var(--color-bg-elevated)]",
  right: "right-full top-1/2 -translate-y-1/2 border-r-[var(--color-bg-elevated)]",
};

export function Tooltip({
  content,
  children,
  position = "top",
  delay = 200,
  offset = 8,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const child = (
    <span
      tabIndex={0}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
    </span>
  );

  return (
    <span className="relative inline-block" tabIndex={0} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {child}
      {isVisible && (
        <div
          className={cn(
            "absolute z-[var(--z-tooltip)] whitespace-nowrap",
            "bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]",
            "rounded-[var(--radius-sm)] shadow-[var(--shadow-md)]",
            "px-3 py-1.5 text-sm",
            "animate-in fade-in-0 zoom-in-95 duration-fast",
            positionStyles[position]
          )}
          style={{ transformOrigin: position === "top" ? "bottom center" : position === "bottom" ? "top center" : position === "left" ? "center right" : "center left" }}
          role="tooltip"
        >
          <Text variant="body-sm" color="primary">{content}</Text>
          <div
            className={cn(
              "absolute w-0 h-0 border-4 border-transparent",
              arrowStyles[position]
            )}
          />
        </div>
      )}
    </span>
  );
}

Tooltip.displayName = "Tooltip";