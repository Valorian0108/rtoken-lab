import { z } from "zod";

/**
 * Branded type schemas
 */
export const SymbolSchema = z.string().brand<"Symbol">();
export const TimestampSchema = z.number().int().positive().brand<"Timestamp">();
export const PriceSchema = z.number().finite().brand<"Price">();
export const VolumeSchema = z.number().finite().brand<"Volume">();
export const PercentageSchema = z.number().finite().brand<"Percentage">();
export const PremiumBpsSchema = z.number().finite().brand<"PremiumBps">();

export const DataSourceSchema = z.enum(["equity", "crypto-spot", "crypto-futures", "derived"]);

export const IntervalSchema = z.enum(["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]);

export const ExchangeSchema = z.enum(["binance", "bitget"]);

export const AssetTypeSchema = z.enum(["native-equity", "rtoken-perpetual", "rtoken-spot"]);

/**
 * Source metadata schema
 */
export const SourceMetadataSchema = z.object({
  sourceId: z.string(),
  provider: z.literal("bitget-mcp"),
  endpoint: z.string(),
  requestedAt: z.string().datetime(),
  receivedAt: z.string().datetime(),
  dataTimestamp: z.string().datetime().optional(),
  symbol: SymbolSchema.optional(),
  interval: IntervalSchema.optional(),
  isLive: z.boolean(),
  limitations: z.array(z.string()).optional(),
});

/**
 * MCP Response wrapper schemas
 */
export const McpSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    status_code: z.number().int(),
    data: dataSchema,
    error: z.null(),
  });

export const McpErrorResponseSchema = z.object({
  success: z.literal(false),
  status_code: z.number().int(),
  data: z.unknown(),
  error: z.object({
    code: z.number().int(),
    message: z.string(),
  }).nullable(),
});

/**
 * Equity Quote Response (from equity_price_quote)
 */
export const EquityQuoteResultSchema = z.object({
  symbol: SymbolSchema,
  last_price: PriceSchema,
  open: PriceSchema,
  high: PriceSchema,
  low: PriceSchema,
  close: PriceSchema,
  volume: VolumeSchema,
  prev_close: PriceSchema,
  change: z.number(),
  change_percent: PercentageSchema,
  total_shares: z.number().optional(),
  float_shares: z.number().optional(),
  total_market_cap: z.number().optional(),
  float_market_cap: z.number().optional(),
  pb: z.number().optional(),
  turnover_rate: z.number().optional(),
  amplitude: z.number().optional(),
});

export const EquityQuoteDataSchema = z.object({
  id: z.string(),
  results: z.array(EquityQuoteResultSchema),
  provider: z.string(),
  warnings: z.array(z.object({ category: z.string(), message: z.string() })).optional(),
  chart: z.null().optional(),
  extra: z.object({
    metadata: z.object({
      arguments: z.object({
        provider_choices: z.object({ provider: z.string() }).optional(),
        standard_params: z.object({ symbol: z.string() }).optional(),
        extra_params: z.record(z.unknown()).optional(),
      }),
      duration: z.number(),
      route: z.string(),
      timestamp: z.string().datetime(),
    }),
  }).optional(),
});

export type EquityQuoteData = z.infer<typeof EquityQuoteDataSchema>;

export const EquityQuoteResponseSchema = McpSuccessResponseSchema(EquityQuoteDataSchema);

/**
 * Equity Historical Response (from equity_price_historical)
 */
export const EquityKlineResultSchema = z.object({
  timestamp: TimestampSchema,
  open: PriceSchema,
  high: PriceSchema,
  low: PriceSchema,
  close: PriceSchema,
  volume: VolumeSchema,
});

export const EquityHistoricalDataSchema = z.object({
  id: z.string(),
  results: z.array(EquityKlineResultSchema),
  provider: z.string(),
  warnings: z.array(z.object({ category: z.string(), message: z.string() })).optional(),
});

export type EquityHistoricalData = z.infer<typeof EquityHistoricalDataSchema>;

export const EquityHistoricalResponseSchema = McpSuccessResponseSchema(EquityHistoricalDataSchema);

/**
 * Crypto Market List Response (from crypto_market with is_rwa: true)
 */
export const CryptoMarketItemSchema = z.object({
  exchange: z.string(),
  symbol: z.string(),
  base: z.string(),
  quote: z.string(),
  market_type: z.enum(["spot", "perpetual"]),
  is_rwa: z.boolean(),
  category: z.string(),
  price_precision: z.string(),
  quantity_precision: z.string(),
  quote_precision: z.string(),
  status: z.enum(["TRADING", "online", "offline"]),
  update_time: z.string().datetime(),
  launch_time: z.number().optional(),
  min_leverage: z.number().nullable().optional(),
  max_leverage: z.number().nullable().optional(),
});

export const CryptoMarketDataSchema = z.object({
  id: z.string(),
  results: z.array(CryptoMarketItemSchema),
  provider: z.string(),
  total: z.number().optional(),
  page: z.number().optional(),
  size: z.number().optional(),
});

export type CryptoMarketData = z.infer<typeof CryptoMarketDataSchema>;

export const CryptoMarketResponseSchema = McpSuccessResponseSchema(CryptoMarketDataSchema);

/**
 * Crypto Spot Ticker Response (from crypto_spot_ticker)
 */
export const CryptoSpotTickerResultSchema = z.object({
  symbol: z.string(),
  exchange: z.string(),
  timestamp: z.string().datetime(),
  last: PriceSchema,
  open: PriceSchema,
  high: PriceSchema,
  low: PriceSchema,
  bid: PriceSchema,
  ask: PriceSchema,
  vwap: PriceSchema,
  volume: VolumeSchema,
  quote_volume: VolumeSchema,
  prev_close: PriceSchema.nullable(),
  change: z.number(),
  change_percent: PercentageSchema,
  market_cap: z.number().nullable(),
  bid_volume: VolumeSchema,
  ask_volume: VolumeSchema,
  average: PriceSchema,
});

export const CryptoSpotTickerDataSchema = z.object({
  id: z.string(),
  results: CryptoSpotTickerResultSchema,
  provider: z.string(),
  warnings: z.array(z.object({ category: z.string(), message: z.string() })).optional(),
});

export type CryptoSpotTickerData = z.infer<typeof CryptoSpotTickerDataSchema>;

export const CryptoSpotTickerResponseSchema = McpSuccessResponseSchema(CryptoSpotTickerDataSchema);

/**
 * Crypto Futures Kline Response (from crypto_futures_kline)
 */
export const CryptoFuturesKlineResultSchema = z.object({
  timestamp: TimestampSchema,
  open: PriceSchema,
  high: PriceSchema,
  low: PriceSchema,
  close: PriceSchema,
  volume: VolumeSchema,
});

export const CryptoFuturesKlineDataSchema = z.object({
  id: z.string(),
  results: z.array(CryptoFuturesKlineResultSchema),
  provider: z.string(),
  warnings: z.array(z.object({ category: z.string(), message: z.string() })).optional(),
});

export type CryptoFuturesKlineData = z.infer<typeof CryptoFuturesKlineDataSchema>;

export const CryptoFuturesKlineResponseSchema = McpSuccessResponseSchema(CryptoFuturesKlineDataSchema);

/**
 * Crypto Futures Funding Rate Response (from crypto_futures_funding_rate)
 */
export const CryptoFuturesFundingResultSchema = z.object({
  timestamp: TimestampSchema,
  funding_rate: PercentageSchema,
});

export const CryptoFuturesFundingDataSchema = z.object({
  id: z.string(),
  results: z.array(CryptoFuturesFundingResultSchema),
  provider: z.string(),
  warnings: z.array(z.object({ category: z.string(), message: z.string() })).optional(),
});

export type CryptoFuturesFundingData = z.infer<typeof CryptoFuturesFundingDataSchema>;

export const CryptoFuturesFundingResponseSchema = McpSuccessResponseSchema(CryptoFuturesFundingDataSchema);

/**
 * Crypto Futures Open Interest Response (from crypto_futures_open_interest)
 */
export const CryptoFuturesOIResultSchema = z.object({
  timestamp: TimestampSchema,
  open_interest: VolumeSchema,
});

export const CryptoFuturesOIDataSchema = z.object({
  id: z.string(),
  results: z.array(CryptoFuturesOIResultSchema),
  provider: z.string(),
  warnings: z.array(z.object({ category: z.string(), message: z.string() })).optional(),
});

export type CryptoFuturesOIData = z.infer<typeof CryptoFuturesOIDataSchema>;

export const CryptoFuturesOIResponseSchema = McpSuccessResponseSchema(CryptoFuturesOIDataSchema);

/**
 * Normalized internal types (after parsing)
 */
export const NormalizedQuoteSchema = z.object({
  symbol: SymbolSchema,
  lastPrice: PriceSchema,
  open: PriceSchema,
  high: PriceSchema,
  low: PriceSchema,
  close: PriceSchema,
  volume: VolumeSchema,
  prevClose: PriceSchema,
  change: z.number(),
  changePercent: PercentageSchema,
  timestamp: TimestampSchema,
  source: DataSourceSchema,
  sourceMetadata: SourceMetadataSchema,
});

export const NormalizedKlineSchema = z.object({
  symbol: SymbolSchema,
  timestamp: TimestampSchema,
  open: PriceSchema,
  high: PriceSchema,
  low: PriceSchema,
  close: PriceSchema,
  volume: VolumeSchema,
  source: DataSourceSchema,
  sourceMetadata: SourceMetadataSchema,
});

export const NormalizedPremiumSchema = z.object({
  nativeSymbol: SymbolSchema,
  rTokenSymbol: SymbolSchema,
  nativePrice: PriceSchema,
  rTokenPrice: PriceSchema,
  premiumBps: PremiumBpsSchema,
  premiumPercent: PercentageSchema,
  timestamp: TimestampSchema,
  nativeSource: SourceMetadataSchema,
  rTokenSource: SourceMetadataSchema,
});

/**
 * Query parameter schemas
 */
export const EquityQuoteParamsSchema = z.object({
  symbol: z.string().min(1),
});

export const EquityHistoricalParamsSchema = z.object({
  symbol: z.string().optional(),
  symbols: z.string().optional(),
  start_time: z.number().int().positive().optional(),
  end_time: z.number().int().positive().optional(),
});

export const CryptoMarketParamsSchema = z.object({
  symbol: z.string().optional(),
  base: z.string().optional(),
  market_type: z.string().optional(),
  is_rwa: z.boolean().optional(),
  category: z.string().optional(),
  page: z.number().int().positive().optional(),
  size: z.number().int().positive().optional(),
});

export const CryptoSpotTickerParamsSchema = z.object({
  symbol: z.string().min(1),
  exchange: ExchangeSchema,
});

export const CryptoFuturesKlineParamsSchema = z.object({
  symbol: z.string().min(1),
  exchange: ExchangeSchema,
  start_time: z.number().int().positive().optional(),
  end_time: z.number().int().positive().optional(),
  interval: IntervalSchema.optional(),
  limit: z.number().int().positive().optional(),
  days: z.number().int().positive().optional(),
});

export const CryptoFuturesFundingParamsSchema = z.object({
  symbol: z.string().min(1),
  exchange: ExchangeSchema,
  interval: IntervalSchema.optional(),
  limit: z.number().int().positive().optional(),
  start_time: z.number().int().positive().optional(),
  end_time: z.number().int().positive().optional(),
  days: z.number().int().positive().optional(),
});

/**
 * Schema exports
 */
export const Schemas = {
  Symbol: SymbolSchema,
  Timestamp: TimestampSchema,
  Price: PriceSchema,
  Volume: VolumeSchema,
  Percentage: PercentageSchema,
  PremiumBps: PremiumBpsSchema,
  DataSource: DataSourceSchema,
  Interval: IntervalSchema,
  Exchange: ExchangeSchema,
  AssetType: AssetTypeSchema,
  SourceMetadata: SourceMetadataSchema,
  EquityQuoteResult: EquityQuoteResultSchema,
  EquityQuoteData: EquityQuoteDataSchema,
  EquityQuoteResponse: EquityQuoteResponseSchema,
  EquityKlineResult: EquityKlineResultSchema,
  EquityHistoricalData: EquityHistoricalDataSchema,
  EquityHistoricalResponse: EquityHistoricalResponseSchema,
  CryptoMarketItem: CryptoMarketItemSchema,
  CryptoMarketData: CryptoMarketDataSchema,
  CryptoMarketResponse: CryptoMarketResponseSchema,
  CryptoSpotTickerResult: CryptoSpotTickerResultSchema,
  CryptoSpotTickerData: CryptoSpotTickerDataSchema,
  CryptoSpotTickerResponse: CryptoSpotTickerResponseSchema,
  CryptoFuturesKlineResult: CryptoFuturesKlineResultSchema,
  CryptoFuturesKlineData: CryptoFuturesKlineDataSchema,
  CryptoFuturesKlineResponse: CryptoFuturesKlineResponseSchema,
  CryptoFuturesFundingResult: CryptoFuturesFundingResultSchema,
  CryptoFuturesFundingData: CryptoFuturesFundingDataSchema,
  CryptoFuturesFundingResponse: CryptoFuturesFundingResponseSchema,
  CryptoFuturesOIResult: CryptoFuturesOIResultSchema,
  CryptoFuturesOIData: CryptoFuturesOIDataSchema,
  CryptoFuturesOIResponse: CryptoFuturesOIResponseSchema,
  NormalizedQuote: NormalizedQuoteSchema,
  NormalizedKline: NormalizedKlineSchema,
  NormalizedPremium: NormalizedPremiumSchema,
  EquityQuoteParams: EquityQuoteParamsSchema,
  EquityHistoricalParams: EquityHistoricalParamsSchema,
  CryptoMarketParams: CryptoMarketParamsSchema,
  CryptoSpotTickerParams: CryptoSpotTickerParamsSchema,
  CryptoFuturesKlineParams: CryptoFuturesKlineParamsSchema,
  CryptoFuturesFundingParams: CryptoFuturesFundingParamsSchema,
} as const;

export type Schemas = typeof Schemas;
