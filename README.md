# rToken Lab

**An AI-assisted research workbench for investigating Bitget Reality tokenized-stock markets.** It brings together a live rToken spot-market snapshot, Bitget rToken-only hourly history, a separately dated daily stock-close reference, and a natural-language research assistant. It is built for research and education: the AI does not place orders, and the app does not calculate a premium or claim that a ticker match proves an rToken's underlying, backing, redemption rights, or value.

> **Bitget Builder Base Camp Hackathon S2** · Track 3: **AI Trading Desk** · Intended sub-theme: **Personalized Research Workbench**

## Demo and project links

- **Live demo:** [rtoken-lab.vercel.app](https://rtoken-lab.vercel.app/)
- **Source:** [github.com/Valorian0108/rtoken-lab](https://github.com/Valorian0108/rtoken-lab)
- **Hackathon handbook:** [Bitget Builder Base Camp Hackathon S2](https://bitget-ai.gitbook.io/bitgetai_hackathons2/)

The S2 brief requires submission materials to be accessible without login. The source repository currently renders as **Public** on GitHub, and the deployed demo is linked above. Recheck both links in a signed-out browser before submission; optional recordings or screenshots should also be publicly accessible.

## Project description

### 1. Thesis

Tokenized US-stock markets trade as crypto spot instruments and may have different trading hours, quotes, and available history from the named US stock. A ticker resemblance alone does not tell a trader what backs a token or whether it can be redeemed. rToken Lab addresses this evidence gap with a workbench that keeps the observations, sources, timestamps, and limitations visible while a person investigates a question.

The workbench retrieves a Bitget Reality spot ticker and hourly candles for the selected rToken. It displays that market data separately from the latest available EODHD daily stock close. If a user explicitly asks for another stock's price, such as “What is AAPL's price?”, the app looks up that ticker's dated daily close independently of the selected rToken. The assistant explains the supplied evidence and useful next research questions; it does not infer a synchronized comparison, premium, fair value, cause of a move, or trade signal from these data.

### 2. Target user and product value

The intended user is a retail trader who already uses crypto venues, is exploring tokenized US-stock markets, and wants to understand what a displayed rToken quote or short hourly history does—and does not—show. This is a product hypothesis, not a validated user segment. The workbench aims to make it easier to ask a focused question, inspect dated evidence, and identify what additional evidence would be needed before drawing a conclusion.

### 3. Validation and key metrics

No user study, adoption, task-completion, retention, or trading-performance metrics are claimed. Automated checks cover the implemented application, but they do not substitute for user validation or establish trading outcomes.

**Validation plan:** ask representative target users to (1) find the live rToken quote and identify its source and time, (2) distinguish it from the separate dated stock close, and (3) complete a research question such as asking about a stock price while a different rToken is selected. Record participant count, task outcomes, misinterpretations, and resulting changes. Report only observed results; label any future goals as targets.

### 4. Progress

**Implemented:** responsive landing page and research workbench; searchable Bitget Reality spot instruments; server-side public ticker and hourly-candle routes; separate daily stock-close lookup; natural-language research through the server-side Qwen endpoint with optional Experiential Labs fallback; explicit stock-ticker price lookup; evidence/status messaging; and regression tests for research rendering and ticker extraction.

**Boundaries and remaining validation:** the assistant does not trade or give buy/sell instructions. rToken candles describe only the selected rToken market. Stock closes are daily, in USD, and not time-aligned to Bitget's USDT quote. On October 4 the deployed chart was blank because its two-hour freshness cutoff hid an otherwise valid Bitget hourly series whose latest RAAPL candle was several hours old. The app now retains valid older candles as history and labels them delayed, including their latest candle time; verify the deployed demo after the latest commits finish deploying. A test research question initially remained in the provider-request stage during a brief check and was cancelled; a later deployed research question returned a complete answer. No user study or trading strategy/backtest is claimed.

### 5. Deliverables

- Accessible demo: <https://rtoken-lab.vercel.app/>
- Source repository: <https://github.com/Valorian0108/rtoken-lab>
- This README: setup, usage, architecture, data limitations, and validation status.
- Optional screen recording or screenshots should be added as a separate, publicly accessible link when prepared.

### 6. AI Trading perspective (optional)

The model is used as a research assistant, not as an autonomous decision-maker. It can explain supplied observations in plain language and help identify missing evidence. Market-specific numbers must come from application-supplied data; the user remains responsible for interpreting the research and making any decisions.

## What the workbench shows

- **Bitget Reality spot snapshot:** last traded price, best displayed bid and ask, quote-quality notes, and provider timestamps, all in USDT.
- **Bitget rToken hourly history:** close prices for the selected rToken instrument, with the source, interval, observed range, and retrieval time. It is not a native-stock history series.
- **Daily stock-close reference:** a separate EODHD daily close in USD, labelled with its session date and retrieval time. It is not a live stock quote, is not synchronized with the Bitget quote, and may be served using EODHD's demo token unless a server-side token is configured.
- **Research Desk:** an AI-assisted explanation of the available evidence and its limitations. Explicit stock-price questions trigger a separate daily-close lookup for the named ticker, rather than substituting the currently selected rToken price.

## Brand assets

- Full wordmark: [`apps/web/public/rtoken-lab-logo.svg`](apps/web/public/rtoken-lab-logo.svg)
- App mark/favicon: [`apps/web/public/favicon.svg`](apps/web/public/favicon.svg)

### Suggested judge demo flow

1. Open the workbench and select an rToken, for example MU if it is available in the current Bitget instrument list.
2. Point out the Bitget ticker timestamp and USDT units, then the separate stock-close date and USD units. Explain that these are not synchronized prices.
3. Ask **“What is AAPL's price?”** while MU is selected. The answer should use AAPL's dated daily-close reference or say it is unavailable, not report MU's rToken price as AAPL's price.
4. Ask a question about the selected rToken's own snapshot or hourly history. Discuss what the observation supports and what further evidence would be needed. Do not frame the output as a trading signal.

Only use this flow with the deployed version that contains the requested-stock-price lookup. A demo answer depends on current provider availability and configuration.

## Submission checklist from the S2 brief

The Google Form—not this README—requires the full project description. The brief calls for these separate fields/materials:

- **Project Description:** one answer covering thesis, target user/value, validation and metrics, progress, deliverables, and (optionally) the AI Trading perspective. Do not replace this answer with a GitHub or X link.
- **Role of the LLM:** name the model(s) actually used and describe their actual roles. Mention Qwen credits only if received and used.
- **Submission Materials Link:** accessible demo, source/docs, and optional public screen recording or screenshots.
- **X Promotional Post Link:** a substantive product introduction with `#BitgetHackathon` and `@Bitget_AI`; the local S2 brief copy also says to retweet the designated official post, while project notes specify quoting [this Bitget AI post](https://x.com/Bitget_AI/status/2100519318824055159?s=20). Confirm the exact action against the current form/official campaign instructions. Do not submit a placeholder or claim this post exists before publishing it.
- **Track and sub-theme:** AI Trading Desk → Personalized Research Workbench is the intended selection; confirm the exact option in the live form.
- **Optional fields:** full university name if entering the university pool; apply for Demo Day and the K3 token subsidy only if desired and eligible.

Track 3 requires an accessible demo that shows one complete research task from a question through to an actionable research insight. Here, “actionable” means a useful interpretation or next evidence to investigate—not an order or trading recommendation. The brief's judging focus includes data/Skill depth, research quality, natural-language interaction, and a clear personalized thesis.

The official Google Form currently states a deadline of **October 8, 2026 at 23:59 (UTC+8)**. It requires Google sign-in to save progress. The original handbook schedule lists September 27; Bitget AI announced the extension on X on September 24. Confirm the form is still accepting responses before submission.

## Run locally

### Requirements

- Node.js 20 or newer
- pnpm 9 (the repository's `packageManager` declaration)

### Install and start

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Vite (the web app is configured for port 3000). The development server proxies Bitget public market data and provides local server-side handlers for research and daily stock-close requests.

### Server-side environment variables

Create a root `.env` file for local development or add these as server-side Vercel environment variables. Never expose provider secrets using a `VITE_`-prefixed variable or commit them to Git.

| Variable               | Required          | Purpose                                                                                 |
| ---------------------- | ----------------- | --------------------------------------------------------------------------------------- |
| `BITGET_QWEN_API_KEY`  | For Qwen research | Server-side key for the Bitget-hosted Qwen Responses API.                               |
| `EXPLABS_API_KEY`      | Optional          | Enables the configured Experiential Labs fallback if Qwen is unavailable.               |
| `EODHD_API_TOKEN`      | Optional          | EODHD daily history token; broader stock-symbol support may require a configured token. |
| `BITGET_QWEN_BASE_URL` | Optional          | Qwen API base URL; defaults to `https://hackathon.bitgetops.com/v1`.                    |
| `BITGET_QWEN_MODEL`    | Optional          | Qwen model override; defaults to `qwen3.8-max`.                                         |
| `EXPLABS_BASE_URL`     | Optional          | Experiential Labs API base URL; defaults to `https://api.experientiallabs.ai/v1`.       |

The EODHD handler falls back to EODHD's demo token if no token is configured; demo-token availability and symbol coverage are limited. No LLM API key is needed to browse the public Bitget market data, but AI research requires a configured provider. The included [`.env.example`](.env.example) documents the EODHD variable.

### Production build and checks

```bash
pnpm --filter @rtoken-lab/web typecheck
pnpm --filter @rtoken-lab/web test
pnpm --filter @rtoken-lab/web lint
pnpm --filter @rtoken-lab/web build
```

## Architecture

This is a pnpm/Turborepo monorepo. The Vite/React application is in `apps/web`; reusable event schemas and types are in `packages/core`; the research-provider client is in `packages/mcp-client`; and shared interface components are in `packages/ui`.

In production, the Vercel serverless handlers in `apps/web/api` proxy Qwen and Experiential Labs requests and retrieve Bitget public ticker/candle data and EODHD daily history. Provider credentials stay on the server. The browser calls same-origin `/api/*` endpoints.

### Vercel deployment

For this monorepo, configure Vercel with **Root Directory** `apps/web`, enable including files outside the root directory, and use the Vite preset. Use `pnpm install --frozen-lockfile` for install, `pnpm build` for build, and `dist` as output. Set Node.js to version 20 or newer. Add only the required server-side environment variables described above.

The Vercel project currently has a **draft (not yet active) Firewall rate-limit rule** for `/api/qwen` and `/api/experiential`: 12 requests per IP per 60-second fixed window. The rule is staged in Vercel under `Limit rToken Lab research endpoints`. Review it, then publish with `vercel firewall publish --project rtoken-lab` (or discard with `vercel firewall discard --project rtoken-lab`). Verify the published rule on a preview deployment and review Firewall logs. The handlers also have a best-effort in-memory throttle, but serverless instances do not share it; it is not a substitute for the Firewall rule. See [Vercel WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).

## Responsible data use

- A Bitget rToken quote is a quote for that Bitget spot instrument, not proof of native-stock ownership, backing, or redemption rights.
- The app keeps rToken market data and stock daily closes separate. The latter is historical, USD-denominated, and not time-aligned to the live USDT quote.
- A ticker-name match is not verification of an rToken's underlying. Do not infer a premium, discount, NAV, fair value, or synchronized relationship from the displayed prices.
- Historical rToken candles describe only the returned sample. Gaps, missing history, provider limits, and stale or unavailable observations should be treated as limitations, not filled with invented values.
- The AI is explanatory. It does not execute orders, establish suitability, or guarantee that a displayed quote is executable.

## License

No open-source license has been added yet. Unless a license is added to this repository, standard copyright restrictions apply.
