# Kalshi Simulator

Deterministic, mock-data-driven paper trading simulator UI built in Next.js + TypeScript.

## What it does

- Keeps `services/opportunityService.ts` as the scoring source for every market opportunity.
- Uses `OpportunityList` as the main dashboard and simulator surface.
- Simulates a **portfolio** of concurrent positions (not just one-off entries).
- Auto-opens positions on `strong_buy` opportunities when all constraints pass:
  - market is not already open
  - max concurrent positions is not exceeded
  - max capital deployed is not exceeded
- Auto-closes positions on take-profit, stop-loss, max hold time, or signal downgrade.
- Tracks trade-level lifecycle data:
  - entry time / exit time
  - hold duration
  - gross PnL
  - fees
  - net PnL
- Includes fee-aware session metrics:
  - total trades
  - gross PnL
  - total fees
  - net PnL
  - average gross/net per trade
  - win rate
  - max drawdown
  - open positions count
  - deployed capital

## Configurable controls

The dashboard includes compact controls for:

- strategy thresholds (edge, momentum, volatility, time, TP/SL, max hold)
- max concurrent positions
- max capital deployed
- per-trade position size
- fee rate per side (applied at entry + exit)

## Run

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

No backend or live data dependencies are required.
