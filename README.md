# Kalshi Simulator

Deterministic, mock-data-driven paper trading simulator UI.

## What it does

- Opens a paper position whenever a `strong_buy` signal appears.
- Uses configurable position size (default `$10`) and stores entry metadata.
- Auto-exits open trades using:
  - take profit at `+3%`
  - stop loss at `-2%`
  - max hold time (default `5` simulated minutes)
- Tracks performance:
  - realized PnL
  - win/loss counts
  - average gain / average loss
- Displays active positions, closed trades, and running PnL in the UI.

## Run

Open `index.html` in a browser.

No backend or live data dependencies are required.
