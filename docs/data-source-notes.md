# rToken Lab — Data Source Notes (UPDATED)

## Bitget MCP Server — `https://agent.bitget.com/mcp`
**Transport**: HTTP (MCP over SSE)
**Auth**: None required
**Session**: Requires `initialize` handshake, returns `mcp-session-id` header

### S2 scope alignment (2026-09-26)

The S2 handbook supplied for this project documents the Bitget MCP Server as read-only US-stock/ETF data (quotes, historical K-lines, fundamentals, corporate actions, analyst/institutional, ETF, news, and sentiment categories). It does not document the crypto/RWA tools listed below. The current environment could not retrieve a live MCP handshake/catalog, so the legacy crypto/RWA tool availability and the exact current S2 tool schemas are unverified. The web app's quote-pair and historical-series requests are therefore disabled until catalog discovery confirms the supported calls; generated charts remain explicitly illustrative. Do not interpret the legacy catalog table below as a verified S2 API contract.

### Bitget public REST and MCP verification (2026-09-28)

The following Bitget public REST paths were fetched successfully from the local Windows workspace on 2026-09-28 (these are point-in-time probes; deploy connectivity and continued service are not implied):

- `GET /api/v3/market/instruments?category=SPOT`, filtered to online USDT Reality stock instruments; RAAPL remained available.
- `GET /api/v3/market/tickers?category=SPOT&symbol=RAAPLUSDT` and `RNKEUSDT` for selected spot ticker snapshots.
- `GET /api/v3/market/candles?category=SPOT&symbol=RAAPLUSDT&interval=1H&limit=3` and `GET /api/v3/market/history-candles?...&interval=1D&limit=5`, plus corresponding RNKE calls. Both returned OHLCV arrays with candle timestamps. Bitget's [Reality Trading guide](https://www.bitget.com/api-doc/uta/reality/reality-trading-guide) describes Reality tickers/candles as using the public market-data families; Reality candles support a documented subset of intervals. Public hourly/daily history can replace synthetic chart content only after the app integrates it and labels source, timestamp, completeness, and any gaps; it is not a native-stock comparison or historical premium series.
- `GET /api/v3/market/orderbook?category=SPOT&symbol=RAAPLUSDT&limit=5` returned a standard spot depth snapshot with bids, asks, and a timestamp. This verifies the generic SPOT endpoint response, not complete/executable market liquidity. The separate Reality-specific `GET /api/v3/account/reality-orderbook` is API-key and whitelist gated per Bitget's [Reality OrderBook docs](https://www.bitget.com/api-doc/uta/reality/market/Reality-OrderBook).
- `GET /api/v3/reality/market/stock-info?symbol=RAAPLUSDT` returned a mapping to underlying code `AAPL` and trading-period metadata.

The native-stock side has two Bitget routes with different evidence limits:

- The existing read-only Bitget MCP `equity_price_quote` call for `AAPL` returned `success: true` and HTTP 200 twice, with `provider: bitget_data`, prices around USD 340.52, and response metadata `extra_params.source: iex`. However the result has no market-observation timestamp, bid/ask, quote condition, or session. The metadata timestamp is the service request time, not proof of observation time; the meaning/coverage of the `iex` source metadata has not been independently verified. The MCP `equity_price_historical` query returned HTTP 204 with empty data in the tested recent range.
- The official [Stock+ quote endpoint](https://www.bitget.com/api-doc/uta/stockplus/market/equity-etf/Get-Quote), `GET /api/v3/stockplus/market/quote?symbol=AAPL.US`, requires signed API-key headers in its request example; Bitget says Stock Level 1 data is whitelist-only. An unauthenticated request returned HTTP 400. No credentials were used.

Therefore the present setup does **not** justify calculating a synchronized rToken/native-stock premium: the MCP quote lacks an observation timestamp and two-sided quote, and Stock+ is gated. A separate provider is not mandatory just to fetch a reference (MCP succeeded), but may be needed if Bitget cannot provide an authorized, timestamped, adequate native quote. Keep the current app on its one-sided rToken snapshot task until then. The app does not yet consume the probed public candle/order-book/stock-info endpoints or the MCP native quote, and deployment is unverified. See `docs/research-log.md` for probe details.

### Third-party public-display screening (2026-09-28)

- Alpaca's [support FAQ on redistribution](https://alpaca.markets/support/redistribute-alpaca-api) explicitly says Alpaca API data cannot be redistributed. Treat displaying Alpaca-sourced AAPL prices in this public demo as unauthorized unless Alpaca separately grants permission; do not integrate data from an ordinary API subscription for this use. Alpaca remains screened out despite its accessible API and timestamped market-data features.
- The free/basic feed's IEX coverage is also not full-market coverage. This is a separate data-quality limitation and does not change the redistribution decision.
- No public-display permission or exception has been established. This is a screening conclusion based on Alpaca's published support guidance, not legal advice.

### Tools Exposed
| Tool | Purpose |
|------|---------|
| `guide` | List categories or entries within a category |
| `do_query` | Execute a catalog entry by ID with parameters |

---

## Catalog Categories

### 1. Equity (美股) — 22 entries — **Native US Stock Data**
| Entry ID | Subcategory | Title | Key Params |
|----------|-------------|-------|------------|
| `equity_price_quote` | 行情 | 实时报价 | `symbol` (required) |
| `equity_price_historical` | 行情 | 历史K线 | `symbol`, `symbols`, `start_time`, `end_time` |
| `equity_profile` | 基本面 | 公司基本信息 | `symbol` |
| `equity_fundamental_management` | 基本面 | 管理层信息 | `symbol` |
| `equity_calendar` | 基本面 | 财报日历 | `symbol`, `fiscal_year`, `start_date`, `end_date` |
| `equity_fundamental_balance` | 基本面 | 资产负债表 | `symbol`, `limit`, `report_type`, `statement_year`... |
| `equity_fundamental_income` | 基本面 | 利润表 | `symbol`, `limit`, `report_type`, `statement_year`... |
| `equity_fundamental_cash` | 基本面 | 现金流量表 | `symbol`, `limit`, `report_type`, `statement_year`... |
| `equity_fundamental_metrics` | 基本面 | 财务分析指标 | `symbol`, `report_type`, `report_annual`... |
| `equity_fundamental_ratios` | 基本面 | 估值指标 | `symbol`, `limit`, `start_date`, `end_date`... |
| `equity_fundamental_dividends` | 基本面 | 股票分红 | `symbol`, `start_time`, `end_time`, `event_type` |
| `equity_ownership_insider_trading` | 机构持仓 | 内部人交易 | `symbol`, `limit`, `start_time`, `end_time`... |
| `equity_ownership_major_holders` | 机构持仓 | 主要股东持股 | `symbol`, `start_date`, `end_date`... |
| `equity_ownership_form_13f` | 机构持仓 | 13F持仓明细 | `symbol`, `date`, `limit`... |
| `equity_ownership_inst_position_detail` | 机构持仓 | 机构持仓明细 | `symbol`, `start_date`, `end_date`... |
| `equity_ownership_inst_position_summary` | 机构持仓 | 机构持仓汇总 | `symbol`, `start_date`, `end_date`... |
| `equity_estimates_price_target` | 分析师评级 | 价格预测 | `symbol`, `limit`, `start_time`, `end_time`, `rating_org` |
| `equity_estimates_forward_pe` | 分析师评级 | 前瞻PE | `symbol`, `annual`, `is_actual_value` |
| `equity_estimates_forward_eps` | 分析师评级 | 前瞻EPS | `symbol`, `annual`, `is_actual_value` |
| `equity_estimates_forward_ebitda` | 分析师评级 | 前瞻EBITDA | `symbol`, `annual`, `is_actual_value` |
| `equity_estimates_forward_sales` | 分析师评级 | 前瞻营收 | `symbol`, `annual`, `is_actual_value` |
| `equity_estimates_consensus` | 分析师评级 | 一致预期 | `symbol`, `fore_indicator_name` |

**Tested**: `equity_price_quote` works ✅ — returns last_price, open, high, low, close, volume, change, change_percent, market_cap, etc.
**Tested**: `equity_price_historical` returned 204 (no content) for 30-day range — may need different params

**Runtime recheck (2026-09-25)**: MCP `initialize`, the initialized notification, and `tools/call` are reachable through both the Vite same-origin proxy and direct HTTPS from this development environment. The current follow-up calls for `equity_price_quote`, `equity_price_historical`, `crypto_spot_ticker`, `crypto_spot_kline`, and `crypto_futures_ticker` returned Bitget MCP tool envelopes with `success: false`, `status_code: 503`, and an upstream “503 Service Temporarily Unavailable” HTML body. Therefore the MCP transport is reachable, but current market data and historical observations are unavailable; prior “works” results are not evidence of current availability.

---

### 2. Crypto — 39 entries — **rToken & Crypto Data**

#### RWA / rToken Markets
| Entry | Purpose | Key Params |
|-------|---------|------------|
| `crypto_market` | List markets | `is_rwa: true`, `symbol`, `base`, `category`, `page`, `size` |
| `crypto_spot_ticker` | Spot real-time | `symbol`, `exchange` (required for rToken: `bitget`) |
| `crypto_spot_kline` | Spot historical | `symbol`, `exchange`, `start_time`, `end_time`, `interval`, `limit`, `days` |
| `crypto_futures_ticker` | Perpetual real-time | `symbol`, `exchange` |
| `crypto_futures_kline` | Perpetual historical | `symbol`, `exchange`, `start_time`, `end_time`, `interval`, `limit`, `days` |
| `crypto_futures_funding_rate` | Funding rate | `symbol`, `exchange`, `interval`, `limit`, `start_time`, `end_time`, `days` |
| `crypto_futures_open_interest` | Open interest | `symbol`, `exchange`, `interval`, `start_time`, `end_time`, `limit` |

#### rToken Symbol Mapping
| Native | rToken Perpetual (Binance) | rToken Spot (Bitget) |
|--------|---------------------------|---------------------|
| `AAPL` | `AAPL/USDT` | `RAAPL/USDT` (base: `rAAPL`) |
| `NVDA` | `NVDA/USDT` | `RNVDA/USDT` (base: `rNVDA`) |
| `TSLA` | `TSLA/USDT` | `RTSLA/USDT` (base: `rTSLA`) |
| ... | 395 perpetuals | 101 spot |

**Tested**: 
- `crypto_market` with `is_rwa: true` ✅ — returns 500 RWA tokens (395 unique bases)
- `crypto_spot_ticker` with `exchange: "bitget"` ✅ — returns last, bid, ask, volume, change_percent
- `crypto_spot_kline` returned 204 (no content) — spot markets may be too new
- **Perpetual klines likely have more history** — should test `crypto_futures_kline`

See the 2026-09-25 runtime recheck above: the tool catalog handshake succeeds, while current quote/history tool calls reported upstream 503 responses.

#### Other Crypto Data (for context)
- On-chain: fund_flow, trading_signal, exchange_flows, stablecoin_flow, token_unlock_event
- Institutional: company_flow, etf_flows, mining_company_flow, country_flow
- Technical: technical_indicators (23 indicators)
- Hyperliquid: position distributions, whale sentiment, whale alerts
- Big trades windows (spot & futures)

---

### 3. ETF — 3 entries
### 4. News — 1 entry (财经新闻检索)
### 5. Sentiment — 2 entries (市场情绪指数)

---

## Data Architecture for rToken Lab

### Primary Data Flows
```
Native Stock (equity)          rToken (crypto)
┌─────────────────────┐        ┌─────────────────────┐
│ equity_price_quote  │        │ crypto_spot_ticker  │  ← Real-time comparison
│ equity_price_historical│      │ crypto_futures_kline│  ← Historical (perpetual)
│ equity_fundamental_*│        │ crypto_market       │  ← Symbol discovery
└─────────────────────┘        └─────────────────────┘
         │                              │
         └──────────────┬───────────────┘
                        ▼
            ┌─────────────────────┐
            │ Premium Calculation │
            │ (rToken - Native) / │
            │ Native * 100        │
            └─────────────────────┘
```

### Symbol Resolution Strategy
1. User selects native symbol (e.g., `AAPL`)
2. Map to rToken:
   - Perpetual: `${symbol}/USDT` on `binance`
   - Spot: `R${symbol}/USDT` on `bitget` (base: `r${symbol}`)
3. Fetch both in parallel
3. Calculate premium/discount

### Known Limitations
- rToken **spot historical data** may be sparse (new markets)
- rToken **perpetual data** on Binance likely has better history
- `equity_price_historical` needs parameter investigation
- No explicit NAV data — premium = (rToken - Native) / Native
- No mint/redeem event data in current catalog

---

## Next Steps for Implementation

### Phase 3 (MCP Client) Schemas Needed
```typescript
// Equity
EquityQuoteResponse    // from equity_price_quote
EquityHistoricalResponse // from equity_price_historical (when working)

// Crypto rToken
CryptoMarketResponse   // from crypto_market (is_rwa: true)
CryptoSpotTickerResponse // from crypto_spot_ticker (exchange: bitget)
CryptoFuturesKlineResponse // from crypto_futures_kline (for history)
CryptoFuturesFundingResponse // from crypto_futures_funding_rate
```

### Phase 4-6 Feature Implications
- **Canvas**: Use perpetual klines for 7×24 heatmap (more history)
- **Real-time**: Use spot ticker (Bitget) for live premium
- **Funding surface**: Use `crypto_futures_funding_rate` 
- **Symbol picker**: Use `crypto_market` with `is_rwa: true`
- **NAV proxy**: Native equity quote as reference price
