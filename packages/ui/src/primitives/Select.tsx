import { cn } from "./Box";
import { Text } from "./Text";
import type { SelectHTMLAttributes, ForwardRefExoticComponent, RefAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Select = ({
  className,
  label,
  error,
  hint,
  options,
  placeholder,
  size = "md",
  fullWidth,
  id,
  ...props
}: SelectProps) => {
  const selectId = id ?? `select-${Math.random().toString(36).slice(2, 9)}`;
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint ? `${selectId}-hint` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-[var(--color-fg-secondary)]">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            "ui-select",
            `
              w-full appearance-none bg-[var(--color-bg-base)] text-[var(--color-fg-primary)]
              border border-[var(--color-border-default)]
              rounded-[var(--radius-default)]
              transition-all duration-fast
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
            `,
            size === "sm" && "px-3 py-1.5 text-sm pr-8",
            size === "md" && "px-4 py-2 text-base pr-8",
            size === "lg" && "px-5 py-2.5 text-lg pr-10",
            error && "border-[var(--color-accent-negative)] focus-visible:ring-[var(--color-accent-negative)]",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={cn(errorId, hintId)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled selected>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-fg-muted)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
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

Select.displayName = "Select";

export interface MultiSelectProps extends Omit<SelectProps, "options" | "onChange"> {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  maxDisplay?: number;
}

export const MultiSelect = ({
  className,
  label,
  error,
  hint,
  options,
  value,
  onChange,
  placeholder = "Select...",
  maxDisplay = 3,
  size = "md",
  fullWidth,
  id,
  disabled,
  ...props
}: MultiSelectProps) => {
  const selectId = id ?? `multiselect-${Math.random().toString(36).slice(2, 9)}`;
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const [isOpen, setIsOpen] = useState(false);

  const selectedOptions = options.filter((o) => value.includes(o.value));
  const displayText =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length <= maxDisplay
      ? selectedOptions.map((o) => o.label).join(", ")
      : `${selectedOptions.slice(0, maxDisplay).map((o) => o.label).join(", ")} +${selectedOptions.length - maxDisplay} more`;

  const toggle = (optValue: string) => {
    onChange(value.includes(optValue) ? value.filter((v) => v !== optValue) : [...value, optValue]);
  };

  return (
    <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-[var(--color-fg-secondary)]">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          id={selectId}
          className={cn(
            `
              w-full text-left appearance-none bg-[var(--color-bg-base)] text-[var(--color-fg-primary)]
              border border-[var(--color-border-default)]
              rounded-[var(--radius-default)]
              transition-all duration-fast
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
            `,
            size === "sm" && "px-3 py-1.5 text-sm pr-8",
            size === "md" && "px-4 py-2 text-base pr-8",
            size === "lg" && "px-5 py-2.5 text-lg pr-10",
            error && "border-[var(--color-accent-negative)] focus-visible:ring-[var(--color-accent-negative)]",
            className
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={cn(errorId, hintId)}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className={cn("truncate block", value.length === 0 && "text-[var(--color-fg-muted)]")}>
            {displayText}
          </span>
        </button>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-fg-muted)]">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn("transition-transform", isOpen && "rotate-180")}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
        {isOpen && (
          <div className="absolute z-[var(--z-dropdown)] mt-1 w-full max-h-60 overflow-auto bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-[var(--radius-default)] shadow-[var(--shadow-md)]">
            <ul role="listbox" aria-multiselectable="true">
              {options.map((opt) => (
                <li key={opt.value} role="option" aria-selected={value.includes(opt.value)}>
                  <label className={cn("flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--color-bg-hover)]", opt.disabled && "opacity-50 cursor-not-allowed")}>
                    <input
                      type="checkbox"
                      checked={value.includes(opt.value)}
                      disabled={opt.disabled}
                      onChange={() => !opt.disabled && toggle(opt.value)}
                      className="w-4 h-4 accent-[var(--color-accent-positive)]"
                    />
                    <Text variant="body-sm" color={value.includes(opt.value) ? "primary" : "secondary"}>
                      {opt.label}
                    </Text>
                  </label>
                </li>
              ))}
            </ul>
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

import { useState } from "react";

MultiSelect.displayName = "MultiSelect";