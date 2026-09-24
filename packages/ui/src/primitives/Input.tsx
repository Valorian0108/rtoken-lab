import { cn } from "./Box";
import { Text } from "./Text";
import type { InputHTMLAttributes, ForwardRefExoticComponent, RefAttributes, ChangeEvent } from "react";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const baseStyles = `
  w-full bg-[var(--color-bg-base)] text-[var(--color-fg-primary)]
  border border-[var(--color-border-default)]
  rounded-[var(--radius-default)]
  transition-all duration-fast
  placeholder:text-[var(--color-fg-muted)]
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:border-transparent
  disabled:opacity-50 disabled:cursor-not-allowed
`;

const sizeStyles: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-5 py-2.5 text-lg",
};

export const Input = ({
  className,
  label,
  error,
  hint,
  leadingIcon,
  trailingIcon,
  size = "md",
  fullWidth,
  id,
  ...props
}: InputProps) => {
  const inputId = id ?? `input-${Math.random().toString(36).slice(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-fg-secondary)]">
          {label}
        </label>
      )}
      <div className="relative">
        {leadingIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)] pointer-events-none">
            {leadingIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            "ui-input",
            baseStyles,
            sizeStyles[size],
            leadingIcon && "pl-10",
            trailingIcon && "pr-10",
            error && "border-[var(--color-accent-negative)] focus-visible:ring-[var(--color-accent-negative)]",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={cn(errorId, hintId)}
          {...props}
        />
        {trailingIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)] pointer-events-none">
            {trailingIcon}
          </div>
        )}
      </div>
      {error && (
        <Text id={errorId} variant="caption" color="negative" role="alert">
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text id={hintId} variant="caption" color="muted">
          {hint}
        </Text>
      )}
    </div>
  );
};

Input.displayName = "Input";

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Textarea = ({
  className,
  label,
  error,
  hint,
  size = "md",
  fullWidth,
  id,
  ...props
}: TextareaProps) => {
  const inputId = id ?? `textarea-${Math.random().toString(36).slice(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-fg-secondary)]">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "ui-textarea",
          baseStyles,
          sizeStyles[size],
          "resize-y min-h-[80px]",
          error && "border-[var(--color-accent-negative)] focus-visible:ring-[var(--color-accent-negative)]",
          className
        )}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={cn(errorId, hintId)}
        {...props}
      />
      {error && (
        <Text id={errorId} variant="caption" color="negative" role="alert">
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text id={hintId} variant="caption" color="muted">
          {hint}
        </Text>
      )}
    </div>
  );
};

Textarea.displayName = "Textarea";