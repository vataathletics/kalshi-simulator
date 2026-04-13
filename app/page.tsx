"use client";

import { useEffect, useMemo, useState } from "react";
import { dashboardSeed, type Opportunity } from "../data/dashboardSeed";

type OpenPosition = {
  id: string;
  marketId: string;
  ticker: string;
  market: string;
  entryPrice: number;
  size: number;
  entryTimestamp: string;
};

type ClosedPosition = OpenPosition & {
  exitPrice: number;
  exitTimestamp: string;
  realizedPnl: number;
};

const DEFAULT_SIZE = 10;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatContractPrice(price: number) {
  return `${Math.round(price * 100)}¢`;
}

export default function DashboardPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(dashboardSeed);
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setOpportunities((prev) =>
        prev.map((market) => {
          const movement = (Math.random() - 0.5) * 0.02;
          const nextPrice = Math.max(0.01, Math.min(0.99, market.lastPrice + movement));
          return {
            ...market,
            lastPrice: Number(nextPrice.toFixed(2)),
          };
        }),
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const marketById = useMemo(
    () => new Map(opportunities.map((opportunity) => [opportunity.id, opportunity])),
    [opportunities],
  );

  const unrealizedPnl = useMemo(
    () =>
      openPositions.reduce((total, position) => {
        const livePrice = marketById.get(position.marketId)?.lastPrice ?? position.entryPrice;
        return total + (livePrice - position.entryPrice) * position.size * 100;
      }, 0),
    [openPositions, marketById],
  );

  const realizedPnl = useMemo(
    () => closedPositions.reduce((total, trade) => total + trade.realizedPnl, 0),
    [closedPositions],
  );

  const buyPosition = (market: Opportunity) => {
    const newPosition: OpenPosition = {
      id: crypto.randomUUID(),
      marketId: market.id,
      ticker: market.ticker,
      market: market.market,
      entryPrice: market.lastPrice,
      size: DEFAULT_SIZE,
      entryTimestamp: new Date().toISOString(),
    };
    setOpenPositions((prev) => [newPosition, ...prev]);
  };

  const sellPosition = (positionId: string) => {
    setOpenPositions((current) => {
      const position = current.find((trade) => trade.id === positionId);
      if (!position) return current;

      const exitPrice = marketById.get(position.marketId)?.lastPrice ?? position.entryPrice;
      const realized = (exitPrice - position.entryPrice) * position.size * 100;

      setClosedPositions((closed) => [
        {
          ...position,
          exitPrice,
          exitTimestamp: new Date().toISOString(),
          realizedPnl: Number(realized.toFixed(2)),
        },
        ...closed,
      ]);

      return current.filter((trade) => trade.id !== positionId);
    });
  };

  const totalTrades = openPositions.length + closedPositions.length;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-10">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Kalshi Simulator</p>
        <h1 className="mt-2 text-3xl font-semibold">Paper Trading Dashboard</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Open Positions</p>
          <p className="mt-2 text-2xl font-semibold">{openPositions.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Closed Trades</p>
          <p className="mt-2 text-2xl font-semibold">{closedPositions.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Unrealized PnL</p>
          <p className={`mt-2 text-2xl font-semibold ${unrealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {currency.format(unrealizedPnl)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Realized PnL</p>
          <p className={`mt-2 text-2xl font-semibold ${realizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {currency.format(realizedPnl)}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="font-medium">Live Opportunities</h2>
          </div>
          <div className="divide-y divide-slate-800">
            {opportunities.map((opportunity) => (
              <div key={opportunity.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium">{opportunity.market}</p>
                  <p className="text-sm text-slate-400">{opportunity.ticker}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatContractPrice(opportunity.lastPrice)}</p>
                  <p className={`text-xs ${opportunity.dailyChangePct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {opportunity.dailyChangePct >= 0 ? "+" : ""}
                    {opportunity.dailyChangePct.toFixed(1)}%
                  </p>
                </div>
                <button
                  onClick={() => buyPosition(opportunity)}
                  className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
                >
                  Buy
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70">
            <div className="border-b border-slate-800 px-5 py-4">
              <h2 className="font-medium">Open Positions</h2>
            </div>
            <div className="divide-y divide-slate-800">
              {openPositions.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-400">No open positions yet.</p>
              ) : (
                openPositions.map((position) => {
                  const livePrice = marketById.get(position.marketId)?.lastPrice ?? position.entryPrice;
                  const pnl = (livePrice - position.entryPrice) * position.size * 100;
                  return (
                    <div key={position.id} className="flex items-center justify-between gap-4 px-5 py-4">
                      <div>
                        <p className="font-medium">{position.market}</p>
                        <p className="text-sm text-slate-400">
                          {position.size} @ {formatContractPrice(position.entryPrice)} • {new Date(position.entryTimestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-300">Live {formatContractPrice(livePrice)}</p>
                        <p className={`text-sm font-semibold ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {currency.format(pnl)}
                        </p>
                      </div>
                      <button
                        onClick={() => sellPosition(position.id)}
                        className="rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400"
                      >
                        Sell
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70">
            <div className="border-b border-slate-800 px-5 py-4">
              <h2 className="font-medium">Closed Positions</h2>
            </div>
            <div className="divide-y divide-slate-800">
              {closedPositions.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-400">No closed positions yet.</p>
              ) : (
                closedPositions.slice(0, 8).map((position) => (
                  <div key={position.id} className="px-5 py-4 text-sm">
                    <p className="font-medium">{position.market}</p>
                    <p className="text-slate-400">
                      {formatContractPrice(position.entryPrice)} → {formatContractPrice(position.exitPrice)} • {position.size} contracts
                    </p>
                    <p className={`${position.realizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {currency.format(position.realizedPnl)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="text-xs text-slate-500">Total trades logged: {totalTrades}</footer>
    </main>
  );
}
