import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ReactNode } from "react";

export function cn(...inputs: unknown[]): string {
  return twMerge(clsx(inputs));
}

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  p?: number | string;
  px?: number | string;
  py?: number | string;
  pt?: number | string;
  pr?: number | string;
  pb?: number | string;
  pl?: number | string;
  m?: number | string;
  mx?: number | string;
  my?: number | string;
  mt?: number | string;
  mr?: number | string;
  mb?: number | string;
  ml?: number | string;
  gap?: number | string;
  flex?: boolean | string;
  flexDir?: "row" | "col" | "row-reverse" | "col-reverse";
  alignItems?: "start" | "center" | "end" | "stretch" | "baseline";
  justifyContent?: "start" | "center" | "end" | "between" | "space-between" | "around" | "evenly";
  grid?: boolean | string;
  gridCols?: string;
  gridRows?: string;
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
  overflow?: "auto" | "hidden" | "scroll" | "visible";
  overflowX?: "auto" | "hidden" | "scroll" | "visible";
  overflowY?: "auto" | "hidden" | "scroll" | "visible";
  border?: boolean;
  borderColor?: string;
  rounded?: boolean | "sm" | "default" | "md" | "lg" | "full";
  shadow?: "none" | "sm" | "default" | "md" | "lg";
  bg?: string;
  textColor?: string;
}

function getSpacingValue(value: number | string | undefined): string {
  if (value === undefined) return "";
  if (typeof value === "number") return `var(--space-${value})`;
  return value;
}

function getColorValue(value: string | undefined): string {
  if (!value) return "";
  if (value.startsWith("var(")) return value;
  return `var(--color-${value})`;
}

export function Box({
  as: Component = "div",
  className,
  style,
  p,
  px,
  py,
  pt,
  pr,
  pb,
  pl,
  m,
  mx,
  my,
  mt,
  mr,
  mb,
  ml,
  gap,
  flex,
  flexDir,
  alignItems,
  justifyContent,
  grid,
  gridCols,
  gridRows,
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  overflow,
  overflowX,
  overflowY,
  border,
  borderColor,
  rounded,
  shadow,
  bg,
  textColor,
  children,
  ...props
}: BoxProps) {
  const computedStyle: React.CSSProperties = {
    ...style,
    padding: getSpacingValue(p),
    paddingLeft: getSpacingValue(pl ?? px),
    paddingRight: getSpacingValue(pr ?? px),
    paddingTop: getSpacingValue(pt ?? py),
    paddingBottom: getSpacingValue(pb ?? py),
    margin: getSpacingValue(m),
    marginLeft: getSpacingValue(ml ?? mx),
    marginRight: getSpacingValue(mr ?? mx),
    marginTop: getSpacingValue(mt ?? my),
    marginBottom: getSpacingValue(mb ?? my),
    gap: getSpacingValue(gap),
    display: flex ? (typeof flex === "string" ? flex : "flex") : grid ? (typeof grid === "string" ? grid : "grid") : undefined,
    flex: typeof flex === "number" ? `${flex} 1 0%` : flex === true ? "1 1 auto" : undefined,
    flexDirection: flexDir === "col" ? "column" : flexDir === "col-reverse" ? "column-reverse" : flexDir,
    alignItems,
    justifyContent: justifyContent === "space-between" ? "space-between" : justifyContent,
    gridTemplateColumns: gridCols,
    gridTemplateRows: gridRows,
    width: width ? (width.startsWith("var(") ? width : width) : undefined,
    height: height ? (height.startsWith("var(") ? height : height) : undefined,
    minWidth: minWidth ? (minWidth.startsWith("var(") ? minWidth : minWidth) : undefined,
    minHeight: minHeight ? (minHeight.startsWith("var(") ? minHeight : minHeight) : undefined,
    maxWidth: maxWidth ? (maxWidth.startsWith("var(") ? maxWidth : maxWidth) : undefined,
    maxHeight: maxHeight ? (maxHeight.startsWith("var(") ? maxHeight : maxHeight) : undefined,
    overflow,
    overflowX,
    overflowY,
    borderWidth: border ? "1px" : undefined,
    borderStyle: border ? "solid" : undefined,
    borderColor: getColorValue(borderColor ?? "border-default"),
    borderRadius: rounded
      ? rounded === true
        ? "var(--radius-default)"
        : `var(--radius-${rounded})`
      : undefined,
    boxShadow: shadow ? `var(--shadow-${shadow})` : undefined,
    backgroundColor: getColorValue(bg),
    color: getColorValue(textColor),
  };

  return (
    <Component
      className={cn(className)}
      style={computedStyle}
      {...props}
    >
      {children}
    </Component>
  );
}