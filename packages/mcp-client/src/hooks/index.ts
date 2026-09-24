import { useState, useEffect, useCallback, useRef } from "react";
import { BitgetMcpClient, createClient } from "../endpoints";
import type {
  NormalizedQuote,
  NormalizedKline,
  NormalizedPremium,
  Symbol,
  Timestamp,
  SourceMetadata,
} from "@rtoken-lab/core";

/**
 * Global client instance (singleton pattern for React)
 */
let globalClient: BitgetMcpClient | null = null;

export function getMcpClient(): BitgetMcpClient {
  if (!globalClient) {
    globalClient = createClient();
  }
  return globalClient;
}

export function initializeMcpClient(): Promise<void> {
  const client = getMcpClient();
  return client.initialize();
}

/**
 * Hook for native equity quote
 */
export function useEquityQuote(symbol: Symbol | null, options: { enabled?: boolean; refetchInterval?: number } = {}) {
  const { enabled = true, refetchInterval } = options;
  const [data, setData] = useState<NormalizedQuote | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const clientRef = useRef(getMcpClient());

  const fetch = useCallback(async () => {
    if (!symbol) return;
    setIsLoading(true);
    setError(null);
    try {
      const quote = await clientRef.current.getNormalizedEquityQuote(symbol);
      setData(quote);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch quote"));
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (enabled && symbol) fetch();
  }, [enabled, symbol, fetch]);

  useEffect(() => {
    if (!refetchInterval || !enabled) return;
    const interval = setInterval(fetch, refetchInterval);
    return () => clearInterval(interval);
  }, [refetchInterval, enabled, fetch]);

  return { data, error, isLoading, refetch: fetch };
}

/**
 * Hook for rToken spot quote
 */
export function useSpotQuote(symbol: Symbol | null, options: { enabled?: boolean; refetchInterval?: number } = {}) {
  const { enabled = true, refetchInterval } = options;
  const [data, setData] = useState<NormalizedQuote | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const clientRef = useRef(getMcpClient());

  const fetch = useCallback(async () => {
    if (!symbol) return;
    setIsLoading(true);
    setError(null);
    try {
      const quote = await clientRef.current.getNormalizedSpotQuote(symbol);
      setData(quote);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch spot quote"));
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (enabled && symbol) fetch();
  }, [enabled, symbol, fetch]);

  useEffect(() => {
    if (!refetchInterval || !enabled) return;
    const interval = setInterval(fetch, refetchInterval);
    return () => clearInterval(interval);
  }, [refetchInterval, enabled, fetch]);

  return { data, error, isLoading, refetch: fetch };
}

/**
 * Hook for rToken perpetual quote
 */
export function usePerpetualQuote(symbol: Symbol | null, options: { enabled?: boolean; refetchInterval?: number } = {}) {
  const { enabled = true, refetchInterval } = options;
  const [data, setData] = useState<NormalizedQuote | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const clientRef = useRef(getMcpClient());

  const fetch = useCallback(async () => {
    if (!symbol) return;
    setIsLoading(true);
    setError(null);
    try {
      const quote = await clientRef.current.getNormalizedPerpetualQuote(symbol);
      setData(quote);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch perpetual quote"));
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (enabled && symbol) fetch();
  }, [enabled, symbol, fetch]);

  useEffect(() => {
    if (!refetchInterval || !enabled) return;
    const interval = setInterval(fetch, refetchInterval);
    return () => clearInterval(interval);
  }, [refetchInterval, enabled, fetch]);

  return { data, error, isLoading, refetch: fetch };
}

/**
 * Hook for premium data (native vs rToken)
 */
export function usePremium(
  nativeSymbol: Symbol | null,
  options: { usePerpetual?: boolean; enabled?: boolean; refetchInterval?: number } = {}
) {
  const { usePerpetual = true, enabled = true, refetchInterval } = options;
  const [data, setData] = useState<NormalizedPremium | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const clientRef = useRef(getMcpClient());

  const fetch = useCallback(async () => {
    if (!nativeSymbol) return;
    setIsLoading(true);
    setError(null);
    try {
      const premium = await clientRef.current.getPremiumData(nativeSymbol, usePerpetual);
      setData(premium);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch premium"));
    } finally {
      setIsLoading(false);
    }
  }, [nativeSymbol, usePerpetual]);

  useEffect(() => {
    if (enabled && nativeSymbol) fetch();
  }, [enabled, nativeSymbol, usePerpetual, fetch]);

  useEffect(() => {
    if (!refetchInterval || !enabled) return;
    const interval = setInterval(fetch, refetchInterval);
    return () => clearInterval(interval);
  }, [refetchInterval, enabled, fetch]);

  return { data, error, isLoading, refetch: fetch };
}

/**
 * Hook for premium time series (historical)
 */
export function usePremiumSeries(
  nativeSymbol: Symbol | null,
  timeRange: { start: Timestamp; end: Timestamp } | null,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const [data, setData] = useState<NormalizedPremium[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const clientRef = useRef(getMcpClient());

  const fetch = useCallback(async () => {
    if (!nativeSymbol || !timeRange) return;
    setIsLoading(true);
    setError(null);
    try {
      const series = await clientRef.current.getPremiumSeries(
        nativeSymbol,
        timeRange.start,
        timeRange.end
      );
      setData(series);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch premium series"));
    } finally {
      setIsLoading(false);
    }
  }, [nativeSymbol, timeRange]);

  useEffect(() => {
    if (enabled && nativeSymbol && timeRange) fetch();
  }, [enabled, nativeSymbol, timeRange, fetch]);

  return { data, error, isLoading, refetch: fetch };
}

/**
 * Hook for RWA market list (symbol discovery)
 */
export function useRwaMarkets(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [data, setData] = useState<{ symbol: string; base: string; market_type: string; exchange: string }[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const clientRef = useRef(getMcpClient());

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const markets = await clientRef.current.getRwaMarkets({ size: 500 });
      const simplified = markets.results?.map(r => ({
        symbol: r.symbol,
        base: r.base,
        market_type: r.market_type,
        exchange: r.exchange,
      })) ?? [];
      setData(simplified);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch RWA markets"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) fetch();
  }, [enabled, fetch]);

  return { data, error, isLoading, refetch: fetch };
}

/**
 * Hook for finding rToken symbols for a native symbol
 */
export function useRwaSymbol(nativeSymbol: Symbol | null) {
  const [data, setData] = useState<{ perpetual?: string; spot?: string } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const clientRef = useRef(getMcpClient());

  const fetch = useCallback(async () => {
    if (!nativeSymbol) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await clientRef.current.findRwaSymbol(nativeSymbol);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to find RWA symbol"));
    } finally {
      setIsLoading(false);
    }
  }, [nativeSymbol]);

  useEffect(() => {
    if (nativeSymbol) fetch();
  }, [nativeSymbol, fetch]);

  return { data, error, isLoading, refetch: fetch };
}

/**
 * Hook for funding surface data
 */
export function useFundingSurface(
  symbols: Symbol[],
  timeRange: { start: Timestamp; end: Timestamp } | null,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const [data, setData] = useState<Map<Symbol, NormalizedKline[]>>(new Map());
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const clientRef = useRef(getMcpClient());

  const fetch = useCallback(async () => {
    if (symbols.length === 0 || !timeRange) return;
    setIsLoading(true);
    setError(null);
    try {
      const surface = await clientRef.current.getFundingSurface(symbols, timeRange.start, timeRange.end);
      setData(surface);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch funding surface"));
    } finally {
      setIsLoading(false);
    }
  }, [symbols, timeRange]);

  useEffect(() => {
    if (enabled && symbols.length > 0 && timeRange) fetch();
  }, [enabled, symbols, timeRange, fetch]);

  return { data, error, isLoading, refetch: fetch };
}