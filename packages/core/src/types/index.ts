import { z } from "zod";

/**
 * Branded types for type-safe domain primitives
 */
export type Brand<T, _B> = T;

export type Symbol = Brand<string, "Symbol">;
export type Timestamp = Brand<number, "Timestamp">;
export type Price = Brand<number, "Price">;
export type Volume = Brand<number, "Volume">;
export type PremiumBps = Brand<number, "PremiumBps">;
export type Percentage = Brand<number, "Percentage">;

export function createSymbol(value: string): Symbol {
  return value as Symbol;
}

export function createTimestamp(value: number): Timestamp {
  return value as Timestamp;
}

export function createPrice(value: number): Price {
  return value as Price;
}

export function createVolume(value: number): Volume {
  return value as Volume;
}

export function createPremiumBps(value: number): PremiumBps {
  return value as PremiumBps;
}

export function createPercentage(value: number): Percentage {
  return value as Percentage;
}

/**
 * Market data types
 */
export interface QuoteData {
  symbol: Symbol;
  lastPrice: Price;
  open: Price;
  high: Price;
  low: Price;
  close: Price;
  volume: Volume;
  prevClose: Price;
  change: number;
  changePercent: Percentage;
  timestamp: Timestamp;
  source: DataSource;
}

export interface KlineData {
  symbol: Symbol;
  timestamp: Timestamp;
  open: Price;
  high: Price;
  low: Price;
  close: Price;
  volume: Volume;
  source: DataSource;
}

export interface FundingRateData {
  symbol: Symbol;
  timestamp: Timestamp;
  rate: Percentage;
  source: DataSource;
}

export interface OpenInterestData {
  symbol: Symbol;
  timestamp: Timestamp;
  value: Volume;
  source: DataSource;
}

export interface NormalizedQuote extends QuoteData {
  sourceMetadata: SourceMetadata;
}

export interface NormalizedKline extends KlineData {
  sourceMetadata: SourceMetadata;
}

export interface NormalizedPremium extends PremiumData {}

/**
 * Data source metadata for traceability
 */
export type DataSource = "equity" | "crypto-spot" | "crypto-futures" | "derived";

export interface SourceMetadata {
  sourceId: string;
  provider: "bitget-mcp";
  endpoint: string;
  requestedAt: string;
  receivedAt: string;
  symbol?: Symbol;
  interval?: string;
  isLive: boolean;
  limitations?: string[];
}

/**
 * Premium calculation result
 */
export interface PremiumData {
  nativeSymbol: Symbol;
  rTokenSymbol: Symbol;
  nativePrice: Price;
  rTokenPrice: Price;
  premiumBps: PremiumBps;
  premiumPercent: Percentage;
  timestamp: Timestamp;
  nativeSource: SourceMetadata;
  rTokenSource: SourceMetadata;
}

/**
 * Time range for queries
 */
export interface TimeRange {
  start: Timestamp;
  end: Timestamp;
}

/**
 * Supported intervals
 */
export type Interval = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";

/**
 * Supported exchanges
 */
export type Exchange = "binance" | "bitget";

/**
 * Asset type classification
 */
export type AssetType = "native-equity" | "rtoken-perpetual" | "rtoken-spot";

/**
 * Validation error types
 */
export class DataValidationError extends Error {
  constructor(
    message: string,
    public readonly endpoint: string,
    public readonly rawData: unknown
  ) {
    super(message);
    this.name = "DataValidationError";
  }
}

export class DataUnavailableError extends Error {
  constructor(
    message: string,
    public readonly endpoint: string,
    public readonly symbol: Symbol
  ) {
    super(message);
    this.name = "DataUnavailableError";
  }
}