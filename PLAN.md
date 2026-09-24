# rToken Lab — Project Plan and Build Record

> **Status:** Working hackathon prototype  
> **Track:** Bitget AI Base Camp Hackathon S2 — Track 3, AI Trading Desk  
> **Repository:** `https://github.com/Valorian0108/rtoken-lab`  
> **Last updated:** 2026-09-24

---

## 1. Product Definition

### 1.1 What we are building

**rToken Lab** is a bespoke, high-density market-research workbench for understanding tokenized US-stock mechanics.

It is designed to help a beginner or retail trader understand:

- Native US stocks versus tokenized US stocks
- rToken premiums and discounts
- 24/7 tokenized-stock trading versus US market hours
- Mint and redeem mechanics
- Weekend and after-hours price discovery
- Funding and carry costs
- Source-aware research explanations
- Historical premium behavior
- Testable trading hypotheses

### 1.2 Product category

The project is designed for **AI Trading Desk / Track 3: AI Research Workbench**.

The AI assists human research. It does not autonomously trade, execute orders, or make unsupported investment recommendations.

### 1.3 Core product principle

> Show the evidence. Explain the uncertainty. Let the human make the decision.

The product must clearly distinguish:

- Live MCP data
- Historical data
- Demo scenario data
- Simulated backtest results
- AI interpretation
- Missing or unavailable data

We must never present generated values as live market data.

---

## 2. Why This Product Exists

The problem is not that traders cannot find another dashboard. The problem is that tokenized US stocks introduce a new market structure that most interfaces do not explain.

The user needs to understand:

1. Why an rToken trades above or below the native stock reference.
2. What happens when the US stock market is closed but the rToken keeps trading.
3. How mint/redeem mechanics affect supply and arbitrage.
4. Which parts of a price difference are observable data versus interpretation.
5. Whether a historical relationship is actually meaningful.

The product therefore prioritizes education, provenance, and research quality over execution.

---

# 3. Phase 0 — Source Research and Validation

## Goal

Before implementing product features, verify which data sources and endpoints actually exist.

## Why this phase matters

The hackathon brief describes broad Bitget capabilities, but it does not guarantee that every rToken-specific field is available. Building against assumptions would create a misleading demo.

## Research completed

### Bitget MCP server

- Endpoint: `https://agent.bitget.com/mcp`
- Transport: HTTP/MCP
- Authentication: none for the public data MCP
- Tools discovered:
  - `guide`
  - `do_query`

### Catalog categories discovered

- `crypto` — RWA markets, crypto spot/perpetual data, funding, on-chain and institutional data
- `equity` — US stock quotes, history, fundamentals, ownership, estimates
- `etf` — ETF data
- `news` — financial news
- `sentiment` — market sentiment

### Important data findings

#### Native equity

- Real-time quote: `equity_price_quote`
- Historical endpoint: `equity_price_historical`
- Symbols include `AAPL`, `NVDA`, `TSLA`, `MSFT`, `GOOGL`, and others.

#### rToken perpetual markets

- Symbols use formats such as:
  - `AAPL/USDT`
  - `NVDA/USDT`
  - `TSLA/USDT`
- Available through:
  - `crypto_futures_ticker`
  - `crypto_futures_kline`
  - `crypto_futures_funding_rate`
  - `crypto_futures_open_interest`

#### rToken spot markets

- Symbols use formats such as:
  - `RAAPL/USDT`
  - `RNVDA/USDT`
  - `RTSLA/USDT`
- Available through:
  - `crypto_spot_ticker`
  - `crypto_spot_kline`

#### Market discovery

- RWA symbols can be found using:
  - `crypto_market`
  - Filter: `is_rwa: true`

### Data gaps identified

- No direct NAV endpoint was confirmed.
- No explicit mint/redeem event endpoint was confirmed.
- Historical responses returned empty data in the first test for some parameter combinations.
- The current network cannot reach the Bitget MCP endpoint from the development environment or the user's current network.

## Decisions made

1. Use native equity quote as the reference price when direct NAV is unavailable.
2. Calculate premium/discount as:

   ```text
   (rToken price - native reference price) / native reference price
   ```

3. Use rToken perpetual data for the strongest available 24/7 historical proxy.
4. Use mechanism diagrams instead of pretending mint/redeem event data exists.
5. Do not claim historical validation until endpoint response formats are verified.

## Phase 0 status

**Research complete. Historical runtime validation deferred due network connectivity.**

---

# 4. Phase 1 — Monorepo Foundation

## Goal

Create a maintainable, expert-level TypeScript foundation before building product features.

## Why this matters

A single-file prototype would make the project difficult to extend, test, deploy, or explain to judges. The product is a workbench, not a single widget.

## Structure

```text
rtoken-lab/
├─ apps/
│  └─ web/
│     ├─ api/
│     │  ├─ mcp.ts
│     │  └─ qwen.ts
│     ├─ src/
│     │  ├─ components/
│     │  ├─ features/
│     │  ├─ styles/
│     │  ├─ state/
│     │  └─ App.tsx
│     └─ package.json
├─ packages/
│  ├─ core/
│  │  └─ src/
│  │     ├─ calculations/
│  │     ├─ events/
│  │     ├─ schemas/
│  │     └─ types/
│  ├─ mcp-client/
│  │  └─ src/
│  │     ├─ endpoints/
│  │     ├─ qwen.ts
│  │     └─ transport/
│  └─ ui/
│     └─ src/
│        ├─ patterns/
│        ├─ primitives/
│        └─ tokens/
├─ docs/
├─ scripts/
│  └─ verify-history.mjs
└─ package.json
```

## Technology decisions

- TypeScript
- React
- Vite
- Turborepo
- pnpm
- Zod
- GSAP
- Jotai
- Vitest
- Vercel-compatible API routes
- React Three Fiber dependencies retained for future advanced visualization work

## Quality gates

Passed:

```text
pnpm typecheck
pnpm build
```

## Important implementation decisions

- The browser must not call Bitget MCP directly because the endpoint does not expose browser CORS headers.
- A same-origin `/api/mcp` proxy is used.
- A server-side Qwen proxy is used so the API key never enters the browser bundle.
- React Three Fiber peer compatibility required React 18 rather than React 19.

---

# 5. Phase 2 — Visual System and Application Layout

## Goal

Create a bespoke dark market-research workbench rather than a generic dashboard.

## Strict layout requirements

The root layout is a full-screen CSS grid:

```text
Width: 100vw
Height: 100vh
Overflow: hidden
Columns: 320px | minmax(0, 1fr) | 360px
Rows: 72px | minmax(0, 1fr)
```

### Header

Spans all three columns and contains:

- rToken Lab branding
- Subtitle
- Symbol search
- Live status badge
- Source/freshness information
- Premium/discount status when available

### Left column: Research Assistant

Fixed `320px` width and internally scrollable.

Contains:

- Qwen context
- Suggested questions
- Research response history
- Prompt input anchored to the bottom
- Loading/error/empty states

### Center column: Mechanics Canvas

Flexible `1fr` width and full remaining height.

Contains:

- View tabs:
  - Price
  - Premium
  - Heatmap
  - Flow
  - Funding
- Main visualization
- Chart legend and source state
- Bottom timeline/playback control

### Right column: Thesis Sandbox

Fixed `360px` width and internally scrollable.

Contains:

- Thesis input
- Strategy selector
- Entry/exit rules
- Position size
- Stop assumptions
- Simulation button
- Simulated results
- Assumptions and limitations

## Visual direction

- Dark slate / pitch-black foundation
- High-contrast typography
- Fine 1px borders
- Dense information hierarchy
- Muted blue for native equity
- Coral/red for rToken or negative premium
- Acid lime for positive premium
- Monospaced labels for timestamps, values, and provenance
- No generic card grid
- No floating overlay layout hacks
- No default browser controls

## Styling system

The UI uses named design tokens and a custom control system. Components must not depend on unprocessed utility classes.

Controls include:

- `.ui-input`
- `.ui-textarea`
- `.ui-select`
- `.ui-button`

All controls have:

- Default state
- Hover state
- Focus-visible state
- Disabled state
- Error state where relevant

## Phase 2 status

**Layout refactored. Styling system repaired. Visual polish still requires screenshot-based iteration.**

---

# 6. Phase 3 — Typed MCP Client

## Goal

Create a reliable data boundary between the UI and Bitget MCP.

## Responsibilities

- MCP initialization
- MCP session ID management
- `guide` catalog requests
- `do_query` requests
- Request validation
- Response validation
- Timeout handling
- Error handling
- Source metadata
- Normalized quote data
- Normalized kline data
- Premium calculation

## Data honesty requirements

Every normalized result should retain:

- Provider
- Endpoint
- Requested timestamp
- Received timestamp
- Symbol
- Interval
- Live/historical status
- Limitations

## Current limitation

The Bitget endpoint is not reachable from the current network. The UI therefore supports demo fallback behavior and clearly labels simulated data.

## Phase 3 status

**MCP transport and proxy implemented. Live endpoint validation blocked by network access.**

---

# 7. Phase 4 — Qwen Research Assistant

## Goal

Use Qwen as a source-aware research assistant, not a blind trading bot.

## Configuration

```text
Model: qwen3.8-max
Base URL: https://hackathon.bitgetops.com/v1
```

The Qwen key is stored in:

```text
apps/web/.env.local
```

The key is ignored by Git and never exposed to the browser.

## Qwen receives

- User question
- Selected symbol
- Active demo scenario
- Scenario explanation
- Native price when available
- rToken price when available
- Premium/discount when available
- Observation timestamp
- Source endpoint names

## Qwen rules

The system prompt requires Qwen to:

- Separate observed data from interpretation
- Avoid inventing unavailable values
- Explain tokenized-stock mechanics clearly
- State uncertainty
- Avoid trade execution
- Avoid unsupported buy/sell instructions
- Remind the user that historical data may be simulated when applicable

## Research questions intended for support

- What is the current premium?
- Why did the premium widen?
- Compare rToken and native movement.
- What happened during the weekend?
- What is the mint/redeem mechanism?
- What data is unavailable?

## Phase 4 status

**Qwen integration implemented and tested when the server is reachable. Research panel is scenario-aware.**

---

# 8. Phase 5 — Mechanics Canvas

## Goal

Make rToken mechanics visible, understandable, and visually intriguing.

## Views

### Price view

- Native line
- rToken line
- Price divergence
- Current value labels
- Source status

### Premium view

- Premium/discount line
- Zero baseline
- Positive/negative states
- Current premium label

### Heatmap view

- Time blocks
- Date/time structure
- Premium intensity
- Weekend periods
- Event markers when historical data becomes available

### Flow view

- Native side
- rToken side
- Mint pressure
- Redeem pressure
- Educational mechanism diagram when event data is unavailable

### Funding view

- Funding-rate visualization
- Carry-cost context
- Explicit simulated/live labeling

## GSAP motion

GSAP is used only for meaningful product motion:

- Chart line drawing
- View transitions
- Heatmap cell reveal
- Symbol change transitions
- Future AI-linked time highlights
- Future backtest replay

GSAP must not be used as generic decoration.

## Current data state

Historical Bitget data is deferred. The canvas uses deterministic demo scenarios and labels them clearly.

## Demo scenarios

- `AAPL` → `WEEKEND PREMIUM`
- `NVDA` → `MINT PRESSURE`
- `TSLA` → `DISCOUNT REVERSION`
- Other symbols → `MARKET HOURS`

The same symbol and time range produce repeatable demo data.

## Phase 5 status

**Visual mechanics canvas implemented with GSAP and deterministic scenarios. Historical data deferred.**

---

# 9. Phase 6 — Thesis Sandbox

## Goal

Allow users to express and test a hypothesis without pretending to execute trades.

## Current behavior

- User writes a thesis
- User adds rules
- User selects direction
- User enters size and stop assumptions
- User runs a simulation
- User sees simulated metrics
- User sees simulated trade log
- User can replay the result

## Required labels

- `SIMULATION`
- `SIMULATED RESULTS`
- No live execution
- No account access
- No investment advice

## Assumptions shown in the interface

- Binance perpetual klines are used as an rToken historical proxy when live history is unavailable.
- Fees: 0.04% per side
- Slippage: 0.02%
- Funding costs included
- No mint/redeem execution modeled
- Fixed fractional position sizing
- Hard stop assumptions
- Past performance does not guarantee future results

## Future upgrade

When historical data is reachable:

- Fetch real historical native and rToken candles
- Align timestamps
- Run the backtest in a Web Worker
- Show real historical metrics
- Add a GSAP replay timeline
- Preserve clear limitations and source labels

## Phase 6 status

**Simulation UI implemented and clearly labeled. Real historical backtest deferred.**

---

# 10. Phase 7 — Data Integration and Resilience

## Required data flows

### Current premium

```text
Native equity quote
        +
rToken perpetual/spot quote
        ↓
Premium/discount calculation
        ↓
Header status + Research context
```

### Historical premium

```text
Native historical candles
        +
rToken historical candles
        ↓
Timestamp alignment
        ↓
Premium series
        ↓
Price/premium/heatmap views
```

## Failure handling

The application must handle:

- MCP unavailable
- Rate limits
- Invalid symbols
- Empty history
- Partial data
- Stale data
- Qwen unavailable
- Qwen timeout
- Qwen empty response
- WebGL/canvas failure
- Worker failure
- Mobile memory limitations

No failure may produce:

- A blank screen
- A fake value
- An unlabeled zero
- A silent failure
- An AI answer without provenance

## Network blocker

Current Bitget verification result:

```text
TcpTestSucceeded: False
curl: Could not connect to server
```

This is a network/connectivity issue, not an application-code issue.

Verification script:

```text
scripts/verify-history.mjs
```

## Phase 7 status

**Architecture supports live data. Network validation remains blocked.**

---

# 11. Phase 8 — Demo and Presentation

## Demo flow

1. Open rToken Lab.
2. Select a symbol.
3. Show the deterministic demo scenario.
4. Ask a research question.
5. Qwen explains the active scenario.
6. Switch chart views.
7. Show GSAP transitions.
8. Run a simulated thesis.
9. Show assumptions and limitations.
10. Explain that historical live data is pending network access.

## Demo honesty

The demo must clearly show:

- `DEMO SERIES`
- `SIMULATION`
- Live status only when the MCP connection succeeds
- Unavailable historical data when the endpoint cannot be reached

## X post requirements

The eventual submission post must include:

- `#BitgetHackathon`
- `@Bitget_AI`
- Product introduction
- Screen recording or screenshots
- Demo link
- No invented metrics
- No fake testimonials

## Phase 8 status

**Demo flow exists. Final polish and submission materials remain.**

---

# 12. Phase 9 — Validation

## Required checks

### Functional

- Header search
- Symbol switching
- Research question submission
- Qwen response rendering
- View switching
- GSAP animation
- Timeline playback
- Simulation run
- Simulation result rendering
- Reset behavior
- Error states

### Data

- Live vs demo labels
- Source endpoint labels
- Timestamp freshness
- Empty data behavior
- Historical data limitations

### Calculations

- Premium formula
- Basis-point conversion
- Timestamp alignment
- Drawdown
- Win rate
- Simulation assumptions

### AI

- Source context included
- Missing data handled honestly
- No trade execution
- No unsupported recommendations
- Prompt-injection resistance
- Qwen failure behavior

### Browser

- Desktop layout
- 320px width
- 375px width
- 414px width
- 768px width
- Keyboard navigation
- Reduced motion
- No horizontal overflow

## Quality gates

```text
pnpm typecheck
pnpm build
```

Both currently pass.

---

# 13. Phase 10 — Submission

## Track

Primary target:

```text
Track 3 — AI Trading Desk
```

Possible sub-theme:

```text
Personalized Research Workbench
```

or:

```text
Information Extraction & Signal Generation
```

The final sub-theme should be selected only after the strongest implemented feature is known.

## Submission requirements

- Complete project description
- Role of the LLM
- Accessible demo
- Source code or documentation link
- Compliant X post
- Optional Demo Day application
- Optional university information if applicable

## Submission principles

- Do not claim live historical validation if it was not completed.
- Do not claim profitability.
- Do not claim the AI autonomously trades.
- Do not fabricate metrics or testimonials.
- Explain the educational/research value clearly.

---

# 14. Current Completed Work

- Product definition finalized
- Hackathon track selected
- Bitget MCP research completed
- MCP tool surface discovered
- RWA symbol mapping documented
- Monorepo created
- TypeScript strictness configured
- React application scaffolded
- MCP proxy implemented
- Qwen proxy implemented
- Qwen key stored securely outside Git
- Research panel connected to Qwen
- Qwen receives scenario context
- Three-column application layout implemented
- Research panel placed in left column
- Mechanics canvas placed in center column
- Thesis sandbox placed in right column
- Timeline moved into center column
- GSAP chart motion implemented
- Deterministic demo scenarios implemented
- Demo and simulation labels implemented
- Default browser control styling repaired
- Flex panel layout repaired
- Production build passing
- Typecheck passing
- Project pushed to private GitHub repository

---

# 15. Current Deferred Work

- Live historical Bitget data
- Real premium time series
- Historical heatmap
- Real backtest
- Web Worker backtest engine
- Real GSAP replay based on historical data
- Full mobile visual pass
- Final screenshot-based design polish
- Final hackathon submission copy
- X promotional post
- Deployed accessible demo

---

# 16. Working Agreement

We will continue to follow these rules:

1. Research before implementing uncertain data behavior.
2. Do not invent market data.
3. Do not label simulated data as live.
4. Keep the three-column workbench structure.
5. Do not return to a generic dashboard layout.
6. Do not add decorative features without product value.
7. Use GSAP only for meaningful transitions.
8. Ask the user when a decision requires information we do not have.
9. Run typecheck and build before advancing phases.
10. Keep the GitHub repository private.
11. Never commit `.env.local` or the Qwen key.
12. Use the screenshot as the visual acceptance test for UI work.

---

# 17. Repository

```text
https://github.com/Valorian0108/rtoken-lab
```

The repository is intended to remain private until submission materials are ready.
