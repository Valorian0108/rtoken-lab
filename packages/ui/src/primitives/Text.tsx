import { cn } from "./Box";
import type { ReactNode, HTMLAttributes, ElementType } from "react";

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  variant?: "display" | "heading-xl" | "heading-lg" | "heading-md" | "heading-sm" | "body" | "body-sm" | "caption" | "overline" | "code" | "mono" | "numeric";
  weight?: "normal" | "medium" | "semibold" | "bold";
  color?: "primary" | "secondary" | "muted" | "inverse" | "positive" | "negative" | "warning" | "info";
  align?: "left" | "center" | "right";
  truncate?: boolean;
  tabularNums?: boolean;
  mono?: boolean;
}

const variantStyles: Record<string, React.CSSProperties> = {
  display: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--text-4xl)",
    fontWeight: "var(--font-bold)",
    lineHeight: "var(--leading-tight)",
    letterSpacing: "var(--tracking-tight)",
  },
  "heading-xl": {
    fontFamily: "var(--font-display)",
    fontSize: "var(--text-3xl)",
    fontWeight: "var(--font-bold)",
    lineHeight: "var(--leading-tight)",
    letterSpacing: "var(--tracking-tight)",
  },
  "heading-lg": {
    fontFamily: "var(--font-display)",
    fontSize: "var(--text-2xl)",
    fontWeight: "var(--font-semibold)",
    lineHeight: "var(--leading-tight)",
  },
  "heading-md": {
    fontFamily: "var(--font-display)",
    fontSize: "var(--text-xl)",
    fontWeight: "var(--font-semibold)",
    lineHeight: "var(--leading-normal)",
  },
  "heading-sm": {
    fontFamily: "var(--font-display)",
    fontSize: "var(--text-lg)",
    fontWeight: "var(--font-medium)",
    lineHeight: "var(--leading-normal)",
  },
  body: {
    fontSize: "var(--text-base)",
    fontWeight: "var(--font-normal)",
    lineHeight: "var(--leading-normal)",
  },
  "body-sm": {
    fontSize: "var(--text-sm)",
    fontWeight: "var(--font-normal)",
    lineHeight: "var(--leading-normal)",
  },
  caption: {
    fontSize: "var(--text-xs)",
    fontWeight: "var(--font-normal)",
    lineHeight: "var(--leading-normal)",
  },
  overline: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--font-semibold)",
    lineHeight: "var(--leading-normal)",
    letterSpacing: "var(--tracking-wide)",
    textTransform: "uppercase",
  },
  code: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-sm)",
    fontWeight: "var(--font-normal)",
    lineHeight: "var(--leading-code)",
    letterSpacing: "var(--tracking-mono)",
  },
  mono: {
    fontFamily: "var(--font-mono)",
    letterSpacing: "var(--tracking-mono)",
  },
  numeric: {
    fontFamily: "var(--font-mono)",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "var(--tracking-mono)",
  },
};

const colorStyles: Record<string, React.CSSProperties> = {
  primary: { color: "var(--color-fg-primary)" },
  secondary: { color: "var(--color-fg-secondary)" },
  muted: { color: "var(--color-fg-muted)" },
  inverse: { color: "var(--color-fg-inverse)" },
  positive: { color: "var(--color-accent-positive-fg)" },
  negative: { color: "var(--color-accent-negative-fg)" },
  warning: { color: "var(--color-accent-warning-fg)" },
  info: { color: "var(--color-accent-info-fg)" },
};

const weightStyles: Record<string, React.CSSProperties> = {
  normal: { fontWeight: "var(--font-normal)" },
  medium: { fontWeight: "var(--font-medium)" },
  semibold: { fontWeight: "var(--font-semibold)" },
  bold: { fontWeight: "var(--font-bold)" },
};

export const Text = ({
  as: Component = "p",
  className,
  style,
  variant = "body",
  weight,
  color = "primary",
  align,
  truncate,
  tabularNums,
  mono,
  children,
  ...props
}: TextProps) => {
  return (
    <Component
      className={cn(className, tabularNums && "tabular-nums")}
      style={{
        ...variantStyles[mono ? "mono" : variant],
        ...weightStyles[weight ?? "normal"],
        ...colorStyles[color],
        textAlign: align,
        textOverflow: truncate ? "ellipsis" : undefined,
        overflow: truncate ? "hidden" : undefined,
        whiteSpace: truncate ? "nowrap" : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
};

export const Heading = ({
  level = 1,
  children,
  ...props
}: Omit<TextProps, "as" | "variant"> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }) => {
  const variantMap: Record<number, TextProps["variant"]> = {
    1: "heading-xl",
    2: "heading-lg",
    3: "heading-md",
    4: "heading-sm",
    5: "body",
    6: "body-sm",
  };
  return <Text as={`h${level}`} variant={variantMap[level]} {...props}>{children}</Text>;
};

export const Mono = ({ children, ...props }: Omit<TextProps, "variant">) => (
  <Text variant="mono" {...props}>{children}</Text>
);

export const Numeric = ({ children, ...props }: Omit<TextProps, "variant">) => (
  <Text variant="numeric" {...props}>{children}</Text>
);

export const Code = ({ children, ...props }: Omit<TextProps, "variant">) => (
  <Text variant="code" {...props}>{children}</Text>
);