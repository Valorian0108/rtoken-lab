import { HttpMcpTransport } from "../transport";
import type {
  EquityQuoteData,
  EquityHistoricalData,
  CryptoMarketData,
  CryptoSpotTickerData,
  CryptoFuturesKlineData,
  CryptoFuturesFundingData,
  CryptoFuturesOIData,
  NormalizedQuote,
  NormalizedKline,
  NormalizedPremium,
  Symbol,
  Timestamp,
  SourceMetadata,
} from "@rtoken-lab/core";
import {
  EquityQuoteResponseSchema,
  EquityHistoricalResponseSchema,
  CryptoMarketResponseSchema,
  CryptoSpotTickerResponseSchema,
  CryptoFuturesKlineResponseSchema,
  CryptoFuturesFundingResponseSchema,
  CryptoFuturesOIResponseSchema,
  EquityQuoteParamsSchema,
  EquityHistoricalParamsSchema,
  CryptoMarketParamsSchema,
  CryptoSpotTickerParamsSchema,
  CryptoFuturesKlineParamsSchema,
  CryptoFuturesFundingParamsSchema,
  NormalizedQuoteSchema,
  buildPremiumData,
  toPerpetualSymbol,
  toSpotSymbol,
  EXCHANGES,
} from "@rtoken-lab/core";

/**
 * Typed MCP Client for Bitget data
 */
export class BitgetMcpClient {
  constructor(private readonly transport: HttpMcpTransport) {}

  async initialize(): Promise<void> {
    await this.transport.initialize();
  }

  // ========================================================================
  // Catalog Discovery
  // ========================================================================

  async listCategories(): Promise<unknown> {
    return this.transport.callGuide({});
  }

  async listCategoryEntries(category: string): Promise<unknown> {
    return this.transport.callGuide({ category });
  }

  // ========================================================================
  // Equity (Native US Stocks)
  // ========================================================================

  async getEquityQuote(symbol: string): Promise<EquityQuoteData> {
    const params = EquityQuoteParamsSchema.parse({ symbol });
    const result = await this.transport.callDoQuery("equity_price_quote", params);
    return EquityQuoteResponseSchema.parse(result).data;
  }

  async getEquityHistorical(
    symbol: string,
    startTime: Timestamp,
    endTime: Timestamp
  ): Promise<EquityHistoricalData> {
    const params = EquityHistoricalParamsSchema.parse({
      symbol,
      start_time: startTime,
      end_time: endTime,
    });
    const result = await this.transport.callDoQuery("equity_price_historical", params);
    return EquityHistoricalResponseSchema.parse(result).data;
  }

  // ========================================================================
  // Crypto Market Discovery (RWA/rToken)
  // ========================================================================

  async getRwaMarkets(params: {
    page?: number;
    size?: number;
    symbol?: string;
  } = {}): Promise<CryptoMarketData> {
    const validated = CryptoMarketParamsSchema.parse({
      is_rwa: true,
      ...params,
    });
    const result = await this.transport.callDoQuery("crypto_market", validated);
    return CryptoMarketResponseSchema.parse(result).data;
  }

  async findRwaSymbol(nativeSymbol: Symbol): Promise<{
    perpetual?: { symbol: string; exchange: string };
    spot?: { symbol: string; exchange: string };
  }> {
    const markets = await this.getRwaMarkets({ symbol: nativeSymbol, size: 10 });
    const results = markets.results ?? [];

    const perpetual = results.find(
      r => r.base === nativeSymbol && r.market_type === "perpetual"
    );
    const spot = results.find(
      r => r.base === `r${nativeSymbol}` && r.market_type === "spot"
    );

    return {
      perpetual: perpetual ? { symbol: perpetual.symbol, exchange: perpetual.exchange } : undefined,
      spot: spot ? { symbol: spot.symbol, exchange: spot.exchange } : undefined,
    };
  }

  // ========================================================================
  // rToken Spot (Bitget)
  // ========================================================================

  async getSpotTicker(symbol: string, exchange = EXCHANGES.BITGET): Promise<CryptoSpotTickerData> {
    const params = CryptoSpotTickerParamsSchema.parse({ symbol, exchange });
    const result = await this.transport.callDoQuery("crypto_spot_ticker", params);
    return CryptoSpotTickerResponseSchema.parse(result).data;
  }

  async getSpotKlines(
    symbol: string,
    startTime: Timestamp,
    endTime: Timestamp,
    exchange = EXCHANGES.BITGET,
    interval = "1h"
  ): Promise<CryptoFuturesKlineData> {
    // Using futures kline endpoint for spot as well (same schema)
    const params = CryptoFuturesKlineParamsSchema.parse({
      symbol,
      exchange,
      start_time: startTime,
      end_time: endTime,
      interval,
    });
    const result = await this.transport.callDoQuery("crypto_spot_kline", params);
    return CryptoFuturesKlineResponseSchema.parse(result).data;
  }

  // ========================================================================
  // rToken Perpetual (Binance) - Better historical depth
  // ========================================================================

  async getFuturesTicker(symbol: string, exchange = EXCHANGES.BINANCE): Promise<CryptoSpotTickerData> {
    const params = CryptoSpotTickerParamsSchema.parse({ symbol, exchange });
    const result = await this.transport.callDoQuery("crypto_futures_ticker", params);
    return CryptoSpotTickerResponseSchema.parse(result).data;
  }

  async getFuturesKlines(
    symbol: string,
    startTime: Timestamp,
    endTime: Timestamp,
    exchange = EXCHANGES.BINANCE,
    interval = "1h"
  ): Promise<CryptoFuturesKlineData> {
    const params = CryptoFuturesKlineParamsSchema.parse({
      symbol,
      exchange,
      start_time: startTime,
      end_time: endTime,
      interval,
    });
    const result = await this.transport.callDoQuery("crypto_futures_kline", params);
    return CryptoFuturesKlineResponseSchema.parse(result).data;
  }

  async getFundingRates(
    symbol: string,
    startTime: Timestamp,
    endTime: Timestamp,
    exchange = EXCHANGES.BINANCE,
    interval = "1h"
  ): Promise<CryptoFuturesFundingData> {
    const params = CryptoFuturesFundingParamsSchema.parse({
      symbol,
      exchange,
      start_time: startTime,
      end_time: endTime,
      interval,
    });
    const result = await this.transport.callDoQuery("crypto_futures_funding_rate", params);
    return CryptoFuturesFundingResponseSchema.parse(result).data;
  }

  async getOpenInterest(
    symbol: string,
    startTime: Timestamp,
    endTime: Timestamp,
    exchange = EXCHANGES.BINANCE,
    interval = "1h"
  ): Promise<CryptoFuturesOIData> {
    const params = CryptoFuturesFundingParamsSchema.parse({
      symbol,
      exchange,
      start_time: startTime,
      end_time: endTime,
      interval,
    });
    const result = await this.transport.callDoQuery("crypto_futures_open_interest", params);
    return CryptoFuturesOIResponseSchema.parse(result).data;
  }

  // ========================================================================
  // Normalized Data (Ready for UI)
  // ========================================================================

  /**
   * Get normalized quote for native equity
   */
  async getNormalizedEquityQuote(symbol: Symbol): Promise<NormalizedQuote> {
    const raw = await this.getEquityQuote(symbol);
    const result = raw.results?.[0];
    if (!result) throw new Error(`No quote data for ${symbol}`);

    const metadata: SourceMetadata = {
      sourceId: raw.id,
      provider: "bitget-mcp",
      endpoint: "equity_price_quote",
      requestedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      symbol,
      isLive: true,
      limitations: ["The equity response has no quote-level timestamp; receivedAt is retrieval time."],
    };

    return NormalizedQuoteSchema.parse({
      symbol,
      lastPrice: result.last_price,
      open: result.open,
      high: result.high,
      low: result.low,
      close: result.close,
      volume: result.volume,
      prevClose: result.prev_close,
      change: result.change,
      changePercent: result.change_percent,
      timestamp: Math.floor(Date.now() / 1000) as Timestamp,
      source: "equity",
      sourceMetadata: metadata,
    });
  }

  /**
   * Get normalized quote for rToken spot
   */
  async getNormalizedSpotQuote(rTokenSymbol: Symbol): Promise<NormalizedQuote> {
    const raw = await this.getSpotTicker(rTokenSymbol, EXCHANGES.BITGET);
    const result = raw.results;

    const metadata: SourceMetadata = {
      sourceId: raw.id,
      provider: "bitget-mcp",
      endpoint: "crypto_spot_ticker",
      requestedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      dataTimestamp: result.timestamp,
      symbol: rTokenSymbol,
      isLive: true,
      limitations: ["Spot quote is denominated in USDT; this comparison does not convert USDT to USD."],
    };

    return NormalizedQuoteSchema.parse({
      symbol: rTokenSymbol,
      lastPrice: result.last,
      open: result.open,
      high: result.high,
      low: result.low,
      close: result.last, // spot ticker uses 'last' as close
      volume: result.volume,
      prevClose: result.prev_close ?? 0,
      change: result.change,
      changePercent: result.change_percent,
      timestamp: Math.floor(new Date(result.timestamp).getTime() / 1000) as Timestamp,
      source: "crypto-spot",
      sourceMetadata: metadata,
    });
  }

  /**
   * Get normalized quote for rToken perpetual
   */
  async getNormalizedPerpetualQuote(rTokenSymbol: Symbol): Promise<NormalizedQuote> {
    const raw = await this.getFuturesTicker(rTokenSymbol, EXCHANGES.BINANCE);
    const result = raw.results;

    const metadata: SourceMetadata = {
      sourceId: raw.id,
      provider: "bitget-mcp",
      endpoint: "crypto_futures_ticker",
      requestedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      dataTimestamp: result.timestamp,
      symbol: rTokenSymbol,
      isLive: true,
      limitations: ["This is a USDT-margined perpetual contract quote, not a native share or an rToken spot quote."],
    };

    return NormalizedQuoteSchema.parse({
      symbol: rTokenSymbol,
      lastPrice: result.last,
      open: result.open,
      high: result.high,
      low: result.low,
      close: result.last,
      volume: result.volume,
      prevClose: result.prev_close ?? 0,
      change: result.change,
      changePercent: result.change_percent,
      timestamp: Math.floor(new Date(result.timestamp).getTime() / 1000) as Timestamp,
      source: "crypto-futures",
      sourceMetadata: metadata,
    });
  }

  /**
   * Get a cross-instrument price gap (native equity vs rToken spot by default).
   */
  async getPremiumData(
    nativeSymbol: Symbol,
    usePerpetual = false
  ): Promise<NormalizedPremium> {
    const [nativeQuote, rTokenQuote] = await Promise.all([
      this.getNormalizedEquityQuote(nativeSymbol),
      usePerpetual
        ? this.getNormalizedPerpetualQuote(toPerpetualSymbol(nativeSymbol) as Symbol)
        : this.getNormalizedSpotQuote(toSpotSymbol(nativeSymbol) as Symbol),
    ]);

    return buildPremiumData(nativeQuote, rTokenQuote);
  }

  /**
   * Get a timestamp-aligned price-gap series for the selected rToken market.
   */
  async getPremiumSeries(
    nativeSymbol: Symbol,
    startTime: Timestamp,
    endTime: Timestamp,
    interval = "1h",
    market: "spot" | "perpetual" = "spot"
  ): Promise<NormalizedPremium[]> {
    const rTokenSymbol = (market === "perpetual" ? toPerpetualSymbol(nativeSymbol) : toSpotSymbol(nativeSymbol)) as Symbol;

    const [nativeKlinesRaw, rTokenKlinesRaw] = await Promise.all([
      this.getEquityHistorical(nativeSymbol, startTime, endTime),
      market === "perpetual"
        ? this.getFuturesKlines(rTokenSymbol, startTime, endTime, EXCHANGES.BINANCE, interval)
        : this.getSpotKlines(rTokenSymbol, startTime, endTime, EXCHANGES.BITGET, interval),
    ]);

    // Normalize klines
    const nativeKlines: NormalizedKline[] = (nativeKlinesRaw.results ?? []).map(k => ({
      symbol: nativeSymbol,
      timestamp: k.timestamp,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
      volume: k.volume,
      source: "equity" as const,
      sourceMetadata: {
        sourceId: nativeKlinesRaw.id,
        provider: "bitget-mcp",
        endpoint: "equity_price_historical",
        requestedAt: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        symbol: nativeSymbol,
        interval,
        isLive: false,
      },
    }));

    const rTokenKlines: NormalizedKline[] = (rTokenKlinesRaw.results ?? []).map(k => ({
      symbol: rTokenSymbol,
      timestamp: k.timestamp,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
      volume: k.volume,
      source: (market === "perpetual" ? "crypto-futures" : "crypto-spot") as "crypto-futures" | "crypto-spot",
      sourceMetadata: {
        sourceId: rTokenKlinesRaw.id,
        provider: "bitget-mcp",
        endpoint: market === "perpetual" ? "crypto_futures_kline" : "crypto_spot_kline",
        requestedAt: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        symbol: rTokenSymbol,
        interval,
        isLive: false,
      },
    }));

    // Calculate premium series
    const { calculatePremiumSeries } = await import("@rtoken-lab/core");
    return calculatePremiumSeries(nativeKlines, rTokenKlines);
  }

  /**
   * Get funding rate history for funding surface visualization
   */
  async getFundingSurface(
    symbols: Symbol[],
    startTime: Timestamp,
    endTime: Timestamp,
    interval = "1h"
  ): Promise<Map<Symbol, NormalizedKline[]>> {
    const surface = new Map<Symbol, NormalizedKline[]>();

    for (const symbol of symbols) {
      const perpetualSymbol = toPerpetualSymbol(symbol);
      const raw = await this.getFundingRates(perpetualSymbol, startTime, endTime, EXCHANGES.BINANCE, interval);

      const klines: NormalizedKline[] = (raw.results ?? []).map(k => ({
        symbol: perpetualSymbol as Symbol,
        timestamp: k.timestamp,
        open: 0,
        high: 0,
        low: 0,
        close: k.funding_rate,
        volume: 0,
        source: "crypto-futures" as const,
        sourceMetadata: {
          sourceId: raw.id,
          provider: "bitget-mcp",
          endpoint: "crypto_futures_funding_rate",
          requestedAt: new Date().toISOString(),
          receivedAt: new Date().toISOString(),
          symbol: perpetualSymbol as Symbol,
          interval,
          isLive: false,
        },
      }));

      surface.set(symbol, klines);
    }

    return surface;
  }
}

/**
 * Create client with default transport
 */
export function createClient(endpoint = "/api/mcp"): BitgetMcpClient {
  const transport = new HttpMcpTransport({ endpoint });
  return new BitgetMcpClient(transport);
}
