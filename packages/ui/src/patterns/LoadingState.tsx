import { cn } from "../primitives/Box";
import { Text } from "../primitives/Text";
import type { HTMLAttributes, ReactNode } from "react";

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "spinner" | "dots" | "pulse" | "skeleton" | "progress";
  size?: "sm" | "md" | "lg";
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

export const LoadingState = ({
  className,
  variant = "spinner",
  size = "md",
  message,
  progress,
  showProgress = false,
  ...props
}: LoadingStateProps) => {
  const sizeClasses = {
    spinner: { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" },
    dots: { sm: "w-1.5 h-1.5", md: "w-2.5 h-2.5", lg: "w-3.5 h-3.5" },
    pulse: { sm: "h-4", md: "h-6", lg: "h-8" },
  };

  if (variant === "spinner") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 p-8",
          className
        )}
        {...props}
      >
        <svg
          className={cn(
            "animate-spin text-[var(--color-accent-positive)]",
            sizeClasses.spinner[size]
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {message && <Text variant="body-sm" color="secondary">{message}</Text>}
        {showProgress && progress !== undefined && (
          <Text variant="caption" color="muted" tabularNums>
            {Math.round(progress)}%
          </Text>
        )}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-1.5",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "rounded-full bg-[var(--color-accent-positive)] animate-bounce",
            sizeClasses.dots[size]
          )}
          style={{ animationDelay: "0ms" }}
          aria-hidden="true"
        />
        <span
          className={cn(
            "rounded-full bg-[var(--color-accent-positive)] animate-bounce",
            sizeClasses.dots[size]
          )}
          style={{ animationDelay: "150ms" }}
          aria-hidden="true"
        />
        <span
          className={cn(
            "rounded-full bg-[var(--color-accent-positive)] animate-bounce",
            sizeClasses.dots[size]
          )}
          style={{ animationDelay: "300ms" }}
          aria-hidden="true"
        />
        {message && <Text variant="body-sm" color="secondary" className="ml-3">{message}</Text>}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div
        className={cn(
          "w-full space-y-3",
          className
        )}
        {...props}
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-[var(--radius-default)] bg-[var(--color-bg-hover)] animate-pulse",
              sizeClasses.pulse[size]
            )}
            style={{ width: i === 1 ? "60%" : i === 2 ? "40%" : "100%" }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (variant === "skeleton") {
    return (
      <div
        className={cn(
          "space-y-3",
          className
        )}
        {...props}
      >
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-[var(--color-bg-hover)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-[var(--color-bg-hover)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--color-bg-hover)]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "progress") {
    return (
      <div
        className={cn(
          "w-full space-y-2",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          {message && <Text variant="body-sm" color="secondary">{message}</Text>}
          {showProgress && progress !== undefined && (
            <Text variant="caption" color="muted" tabularNums>
              {Math.round(progress)}%
            </Text>
          )}
        </div>
        <div className="h-2 w-full bg-[var(--color-bg-base)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent-positive)] rounded-full transition-all duration-normal ease-out"
            style={{ width: `${Math.max(0, Math.min(100, progress ?? 0))}%` }}
            role="progressbar"
            aria-valuenow={progress ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={message ?? "Loading progress"}
          />
        </div>
      </div>
    );
  }

  return null;
};

LoadingState.displayName = "LoadingState";

export interface InlineLoadingProps extends HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md";
  color?: "positive" | "primary";
}

export const InlineLoading = ({
  className,
  size = "md",
  color = "positive",
  ...props
}: InlineLoadingProps) => (
  <span
    className={cn(
      "inline-block animate-spin",
      size === "sm" && "w-4 h-4",
      size === "md" && "w-5 h-5",
      color === "positive" && "text-[var(--color-accent-positive)]",
      color === "primary" && "text-[var(--color-fg-primary)]",
      className
    )}
    {...props}
    aria-hidden="true"
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </span>
);

InlineLoading.displayName = "InlineLoading";

export interface PageLoadingProps {
  message?: string;
}

export const PageLoading = ({ message = "Loading..." }: PageLoadingProps) => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
    <LoadingState variant="spinner" size="lg" message={message} />
  </div>
);

PageLoading.displayName = "PageLoading";