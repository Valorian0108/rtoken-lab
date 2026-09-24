import { cn } from "./Box";
import { Text } from "./Text";
import type { ButtonHTMLAttributes, ForwardRefExoticComponent, RefAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const variantBase = `
  inline-flex items-center justify-center font-medium transition-all duration-fast
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  active:scale-[0.98]
`;

const variantStyles: Record<string, string> = {
  primary: `
    ${variantBase}
    bg-[var(--color-accent-positive)] text-[var(--color-fg-inverse)]
    hover:bg-[var(--color-accent-positive)]/90
    focus-visible:ring-[var(--color-accent-positive)]
  `,
  secondary: `
    ${variantBase}
    bg-[var(--color-bg-elevated)] text-[var(--color-fg-primary)]
    border border-[var(--color-border-default)]
    hover:bg-[var(--color-bg-hover)]
    focus-visible:ring-[var(--color-border-focus)]
  `,
  ghost: `
    ${variantBase}
    text-[var(--color-fg-secondary)]
    hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]
    focus-visible:ring-[var(--color-border-focus)]
  `,
  destructive: `
    ${variantBase}
    bg-[var(--color-accent-negative)] text-[var(--color-fg-inverse)]
    hover:bg-[var(--color-accent-negative)]/90
    focus-visible:ring-[var(--color-accent-negative)]
  `,
  outline: `
    ${variantBase}
    bg-transparent text-[var(--color-fg-primary)]
    border border-[var(--color-border-default)]
    hover:bg-[var(--color-bg-hover)]
    focus-visible:ring-[var(--color-border-focus)]
  `,
};

const sizeStyles: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
};

export const Button = (
  {
    className,
    variant = "primary",
    size = "md",
    loading,
    fullWidth,
    disabled,
    children,
    ...props
  }: ButtonProps
) => {
  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        "ui-button",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className
      )}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
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
      )}
      {children}
    </button>
  );
};

Button.displayName = "Button";