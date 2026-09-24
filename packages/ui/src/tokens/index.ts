/**
 * rToken Lab — Design Tokens
 *
 * A research instrument aesthetic: precise, data-dense, calm.
 * Not a fintech dashboard. Not a crypto neon site.
 * Think: Bloomberg terminal meets scientific instrument.
 */

// ============================================================================
// COLOR TOKENS (OKLCH for perceptual uniformity)
// ============================================================================

export const colors = {
  // Background layers
  bg: {
    base: "oklch(0.12 0.01 240)",       // Deep charcoal, not pure black
    elevated: "oklch(0.16 0.01 240)",   // Panel backgrounds
    hover: "oklch(0.20 0.01 240)",      // Hover states
    active: "oklch(0.24 0.01 240)",     // Active/pressed
  },

  // Foreground text
  fg: {
    primary: "oklch(0.96 0.01 240)",    // Main text - warm off-white
    secondary: "oklch(0.72 0.01 240)",  // Labels, timestamps
    muted: "oklch(0.52 0.01 240)",      // Helper text, disabled
    inverse: "oklch(0.12 0.01 240)",    // Text on accent backgrounds
  },

  // Accent colors (semantic, not decorative)
  accent: {
    positive: "oklch(0.62 0.18 142)",   // Acid lime - gains, long, buy
    positiveBg: "oklch(0.62 0.18 142 / 0.12)",
    positiveFg: "oklch(0.62 0.18 142)",

    warning: "oklch(0.74 0.16 78)",     // Amber - premium, caution
    warningBg: "oklch(0.74 0.16 78 / 0.12)",
    warningFg: "oklch(0.74 0.16 78)",

    negative: "oklch(0.58 0.22 25)",    // Coral red - losses, short, sell, premium
    negativeBg: "oklch(0.58 0.22 25 / 0.12)",
    negativeFg: "oklch(0.58 0.22 25)",

    info: "oklch(0.58 0.15 240)",       // Muted blue - native stock, reference
    infoBg: "oklch(0.58 0.15 240 / 0.12)",
    infoFg: "oklch(0.58 0.15 240)",

    highlight: "oklch(0.78 0.12 95)",   // Yellow highlight - selection, focus
  },

  // Borders & dividers
  border: {
    subtle: "oklch(0.24 0.01 240 / 0.6)",
    default: "oklch(0.28 0.01 240 / 0.8)",
    strong: "oklch(0.36 0.01 240)",
    focus: "oklch(0.62 0.18 142)",      // Acid lime focus ring
  },

  // Data visualization specific
  chart: {
    grid: "oklch(0.24 0.01 240 / 0.4)",
    axis: "oklch(0.52 0.01 240)",
    crosshair: "oklch(0.74 0.16 78 / 0.6)",
    tooltip: "oklch(0.16 0.01 240 / 0.95)",
    tooltipBorder: "oklch(0.28 0.01 240 / 0.8)",
  },

  // Heatmap gradient stops (premium/discount)
  heatmap: {
    deepNegative: "oklch(0.45 0.20 25)",   // Deep discount
    negative: "oklch(0.55 0.18 25)",
    slightNegative: "oklch(0.65 0.12 25)",
    neutral: "oklch(0.28 0.01 240)",       // Zero premium
    slightPositive: "oklch(0.55 0.15 142)",
    positive: "oklch(0.62 0.18 142)",
    deepPositive: "oklch(0.70 0.20 142)",  // Deep premium
  },

  // Series colors (for multi-line charts)
  series: {
    native: "oklch(0.58 0.15 240)",        // Muted blue - native stock
    rTokenSpot: "oklch(0.58 0.22 25)",     // Coral - rToken spot
    rTokenPerp: "oklch(0.74 0.16 78)",     // Amber - rToken perpetual
    premium: "oklch(0.62 0.18 142)",       // Acid lime - premium line
    funding: "oklch(0.68 0.14 300)",       // Purple - funding rate
  },
} as const;

// ============================================================================
// SPACING SCALE (4pt base)
// ============================================================================

export const spacing = {
  0: "0",
  1: "0.25rem",   // 4px
  2: "0.5rem",    // 8px
  3: "0.75rem",   // 12px
  4: "1rem",      // 16px
  5: "1.25rem",   // 20px
  6: "1.5rem",    // 24px
  8: "2rem",      // 32px
  10: "2.5rem",   // 40px
  12: "3rem",     // 48px
  16: "4rem",     // 64px
  20: "5rem",     // 80px
  24: "6rem",     // 96px
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const fontFamily = {
  mono: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  display: '"Space Grotesk", "Inter", sans-serif',
} as const;

export const fontSize = {
  xs: "0.7rem",     // 11px - timestamps, micro labels
  sm: "0.8125rem",  // 13px - axis labels, metadata
  base: "0.9375rem", // 15px - body text
  lg: "1.0625rem",  // 17px - emphasized values
  xl: "1.25rem",    // 20px - section headers
  "2xl": "1.5rem",  // 24px - major headers
  "3xl": "2rem",    // 32px - hero numbers
  "4xl": "3rem",    // 48px - display
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeight = {
  tight: 1.1,
  normal: 1.5,
  relaxed: 1.75,
  code: 1.6,
} as const;

export const letterSpacing = {
  tight: "-0.02em",
  normal: "0",
  wide: "0.02em",
  mono: "0.03em",
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: "0",
  sm: "0.125rem",   // 2px - tight elements
  default: "0.25rem", // 4px - standard
  md: "0.375rem",   // 6px - cards
  lg: "0.5rem",     // 8px - panels
  full: "9999px",   // pills
} as const;

// ============================================================================
// SHADOWS / DEPTH
// ============================================================================

export const shadow = {
  none: "none",
  sm: "0 1px 2px oklch(0 0 0 / 0.3)",
  default: "0 4px 8px oklch(0 0 0 / 0.4)",
  md: "0 8px 16px oklch(0 0 0 / 0.45)",
  lg: "0 16px 32px oklch(0 0 0 / 0.5)",
  inset: "inset 0 1px 2px oklch(0 0 0 / 0.3)",
  focus: "0 0 0 2px oklch(0.62 0.18 142)",
} as const;

// ============================================================================
// MOTION / ANIMATION
// ============================================================================

export const duration = {
  instant: "0ms",
  fast: "80ms",
  normal: "160ms",
  slow: "240ms",
  slower: "320ms",
} as const;

export const easing = {
  linear: "linear",
  easeOut: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  easeIn: "cubic-bezier(0.55, 0.06, 0.68, 0.19)",
  easeInOut: "cubic-bezier(0.42, 0, 0.58, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const zIndex = {
  base: 0,
  canvas: 10,
  tooltip: 50,
  dropdown: 100,
  modal: 200,
  toast: 300,
  focusTrap: 400,
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  xs: "320px",
  sm: "375px",
  md: "414px",
  lg: "768px",
  xl: "1024px",
  "2xl": "1440px",
} as const;

// ============================================================================
// CSS VARIABLES GENERATOR
// ============================================================================

export function generateCssVariables(): string {
  const cssVars: Record<string, string> = {};

  // Colors
  Object.entries(flatten(colors)).forEach(([key, value]) => {
    cssVars[`--color-${key}`] = value;
  });

  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    cssVars[`--space-${key}`] = value;
  });

  // Typography
  Object.entries(fontSize).forEach(([key, value]) => {
    cssVars[`--text-${key}`] = value;
  });
  Object.entries(fontWeight).forEach(([key, value]) => {
    cssVars[`--font-${key}`] = String(value);
  });
  Object.entries(lineHeight).forEach(([key, value]) => {
    cssVars[`--leading-${key}`] = String(value);
  });
  Object.entries(letterSpacing).forEach(([key, value]) => {
    cssVars[`--tracking-${key}`] = value;
  });

  // Radius
  Object.entries(borderRadius).forEach(([key, value]) => {
    cssVars[`--radius-${key}`] = value;
  });

  // Shadows
  Object.entries(shadow).forEach(([key, value]) => {
    cssVars[`--shadow-${key}`] = value;
  });

  // Motion
  Object.entries(duration).forEach(([key, value]) => {
    cssVars[`--duration-${key}`] = value;
  });
  Object.entries(easing).forEach(([key, value]) => {
    cssVars[`--ease-${key}`] = value;
  });

  // Z-index
  Object.entries(zIndex).forEach(([key, value]) => {
    cssVars[`--z-${key}`] = String(value);
  });

  return Object.entries(cssVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
}

function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}-${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flatten(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = String(value);
    }
  }
  return result;
}

// ============================================================================
// TOKEN TYPES (for TypeScript)
// ============================================================================

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;
export type BorderRadiusToken = keyof typeof borderRadius;
export type ShadowToken = keyof typeof shadow;
export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
export type ZIndexToken = keyof typeof zIndex;
export type BreakpointToken = keyof typeof breakpoints;

// ============================================================================
// THEME CONTRACT (for documentation)
// ============================================================================

export const themeContract = {
  name: "rToken Lab",
  description: "Research instrument aesthetic for tokenized stock mechanics",
  mode: "dark" as const,
  tokens: {
    colors: Object.keys(flatten(colors)).length,
    spacing: Object.keys(spacing).length,
    fontSizes: Object.keys(fontSize).length,
    fontWeights: Object.keys(fontWeight).length,
    radii: Object.keys(borderRadius).length,
    shadows: Object.keys(shadow).length,
    durations: Object.keys(duration).length,
    easings: Object.keys(easing).length,
    zIndices: Object.keys(zIndex).length,
  },
} as const;