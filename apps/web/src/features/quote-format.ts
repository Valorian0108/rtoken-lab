export function formatQuotePrice(price: number, precision?: number, locale?: string): string {
  if (!Number.isFinite(price) || price <= 0) return "Unavailable";
  const formatter = Number.isInteger(precision) && precision! >= 0 && precision! <= 12
    ? new Intl.NumberFormat(locale, { minimumFractionDigits: precision, maximumFractionDigits: precision })
    : new Intl.NumberFormat(locale, { maximumSignificantDigits: 12, maximumFractionDigits: 12 });
  return formatter.format(price);
}

/** Format the provider's size number without asserting its asset unit. */
export function formatQuoteSize(size: number, locale?: string): string {
  if (!Number.isFinite(size) || size < 0) return "Unavailable";
  return new Intl.NumberFormat(locale, { maximumSignificantDigits: 8 }).format(size);
}
