export type Opportunity = {
  id: string;
  market: string;
  ticker: string;
  lastPrice: number;
  dailyChangePct: number;
  volume: number;
};

export const dashboardSeed: Opportunity[] = [
  {
    id: "1",
    market: "Fed cuts rates by June 2026",
    ticker: "FEDJUN26",
    lastPrice: 0.44,
    dailyChangePct: 2.8,
    volume: 12450,
  },
  {
    id: "2",
    market: "US CPI YoY above 3.0% in May 2026",
    ticker: "CPIMAY26",
    lastPrice: 0.37,
    dailyChangePct: -1.4,
    volume: 9805,
  },
  {
    id: "3",
    market: "BTC above $90k by Sep 2026",
    ticker: "BTCSEP26",
    lastPrice: 0.52,
    dailyChangePct: 4.2,
    volume: 20711,
  },
  {
    id: "4",
    market: "S&P 500 closes above 6000 in 2026",
    ticker: "SPX6000",
    lastPrice: 0.48,
    dailyChangePct: 1.1,
    volume: 15322,
  },
];
