export interface DemoScenario {
  id: string;
  label: string;
  description: string;
  bias: number;
}

const scenarios: Record<string, DemoScenario> = {
  AAPL: { id: "weekend-premium", label: "WEEKEND PREMIUM", description: "rToken trades above native stock reference while US markets are closed; premium is expected to revert after reopen.", bias: 0.0007 },
  NVDA: { id: "mint-pressure", label: "MINT PRESSURE", description: "Sustained rToken premium creates incentives for authorized minting and arbitrage supply.", bias: 0.0004 },
  TSLA: { id: "discount-reversion", label: "DISCOUNT REVERSION", description: "rToken trades below the native reference, creating a theoretical redeem or convergence scenario.", bias: -0.0005 },
  DEFAULT: { id: "market-hours", label: "MARKET HOURS", description: "Native and rToken prices are evaluated during regular US market hours with lower divergence.", bias: 0 },
};

export function getDemoScenario(symbol: string): DemoScenario {
  return scenarios[symbol] ?? scenarios.DEFAULT!;
}
