import {
  closedTrades,
  eventLog,
  openPositions,
  opportunities,
  riskControls,
  strategySettings,
} from "@/data/dashboardSeed";

const signalClass: Record<string, string> = {
  High: "text-emerald-300",
  Medium: "text-amber-300",
  Low: "text-slate-300",
};

function SectionTitle({ title }: { title: string }) {
  return <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-300">{title}</h2>;
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
        <header className="panel flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Private Paper Trading</p>
            <h1 className="text-2xl font-semibold text-white md:text-3xl">Live Sports Prediction Dashboard</h1>
          </div>
          <div className="text-xs text-slate-400">Mode: Simulated · Data: Mock Seed · APIs: Not Connected</div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="panel overflow-x-auto">
            <SectionTitle title="Live Opportunities" />
            <table className="min-w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="pb-2 text-left">Sport</th>
                  <th className="pb-2 text-left">Matchup</th>
                  <th className="pb-2 text-left">Underdog</th>
                  <th className="pb-2 text-left">Score</th>
                  <th className="pb-2 text-left">Clock</th>
                  <th className="pb-2 text-left">Signal</th>
                  <th className="pb-2 text-left">Entry</th>
                  <th className="pb-2 text-left">TP</th>
                  <th className="pb-2 text-left">SL</th>
                  <th className="pb-2 text-left">Reason</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opportunity) => (
                  <tr key={`${opportunity.matchup}-${opportunity.gameClock}`} className="border-t border-border/50 text-slate-200">
                    <td className="py-2 pr-4">{opportunity.sport}</td>
                    <td className="py-2 pr-4 font-medium">{opportunity.matchup}</td>
                    <td className="py-2 pr-4">{opportunity.currentUnderdogPrice}</td>
                    <td className="py-2 pr-4">{opportunity.score}</td>
                    <td className="py-2 pr-4">{opportunity.gameClock}</td>
                    <td className={`py-2 pr-4 font-semibold ${signalClass[opportunity.signalStrength]}`}>{opportunity.signalStrength}</td>
                    <td className="py-2 pr-4">{opportunity.recommendedEntry}</td>
                    <td className="py-2 pr-4">{opportunity.recommendedTakeProfit}</td>
                    <td className="py-2 pr-4">{opportunity.recommendedStopLoss}</td>
                    <td className="py-2 pr-4 text-xs text-cyan-200">{opportunity.reasonCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <SectionTitle title="Paper Portfolio" />
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                <p className="text-xs uppercase tracking-wide text-emerald-300">Net Liquidation</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-200">$25,174.25</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border bg-panelAlt p-3">
                  <p className="text-xs text-slate-400">Day P&L</p>
                  <p className="text-lg font-semibold text-emerald-300">+$104.25</p>
                </div>
                <div className="rounded-lg border border-border bg-panelAlt p-3">
                  <p className="text-xs text-slate-400">Open Risk</p>
                  <p className="text-lg font-semibold text-amber-300">$168.00</p>
                </div>
                <div className="rounded-lg border border-border bg-panelAlt p-3">
                  <p className="text-xs text-slate-400">Win Rate</p>
                  <p className="text-lg font-semibold text-slate-100">58%</p>
                </div>
                <div className="rounded-lg border border-border bg-panelAlt p-3">
                  <p className="text-xs text-slate-400">Exposure</p>
                  <p className="text-lg font-semibold text-slate-100">$1,450</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="panel overflow-x-auto">
            <SectionTitle title="Open Positions" />
            <table className="min-w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="pb-2 text-left">Market</th>
                  <th className="pb-2 text-left">Entry</th>
                  <th className="pb-2 text-left">Current</th>
                  <th className="pb-2 text-left">Unrealized PnL</th>
                  <th className="pb-2 text-left">Hold Time</th>
                  <th className="pb-2 text-left">Exit Targets</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.map((position) => (
                  <tr key={position.market} className="border-t border-border/50">
                    <td className="py-2 pr-4">{position.market}</td>
                    <td className="py-2 pr-4">{position.entryPrice}</td>
                    <td className="py-2 pr-4">{position.currentPrice}</td>
                    <td className={`py-2 pr-4 ${position.unrealizedPnl.startsWith("+") ? "text-emerald-300" : "text-rose-300"}`}>
                      {position.unrealizedPnl}
                    </td>
                    <td className="py-2 pr-4">{position.holdTime}</td>
                    <td className="py-2 pr-4 text-xs text-slate-300">{position.exitTargets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel overflow-x-auto">
            <SectionTitle title="Closed Trades" />
            <table className="min-w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="pb-2 text-left">Market</th>
                  <th className="pb-2 text-left">Entry</th>
                  <th className="pb-2 text-left">Exit</th>
                  <th className="pb-2 text-left">PnL</th>
                  <th className="pb-2 text-left">Entry Reason</th>
                  <th className="pb-2 text-left">Exit Reason</th>
                </tr>
              </thead>
              <tbody>
                {closedTrades.map((trade) => (
                  <tr key={trade.market} className="border-t border-border/50">
                    <td className="py-2 pr-4">{trade.market}</td>
                    <td className="py-2 pr-4">{trade.entry}</td>
                    <td className="py-2 pr-4">{trade.exit}</td>
                    <td className={`py-2 pr-4 font-medium ${trade.pnl.startsWith("+") ? "text-emerald-300" : "text-rose-300"}`}>
                      {trade.pnl}
                    </td>
                    <td className="py-2 pr-4 text-xs text-slate-300">{trade.reasonForEntry}</td>
                    <td className="py-2 pr-4 text-xs text-slate-300">{trade.reasonForExit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="panel">
            <SectionTitle title="Strategy Settings" />
            <dl className="space-y-2 text-sm">
              {strategySettings.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 border-b border-border/40 pb-2 last:border-0">
                  <dt className="text-slate-400">{item.label}</dt>
                  <dd className="text-right text-slate-100">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="panel">
            <SectionTitle title="Risk Controls" />
            <dl className="space-y-2 text-sm">
              {riskControls.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 border-b border-border/40 pb-2 last:border-0">
                  <dt className="text-slate-400">{item.label}</dt>
                  <dd className="text-right text-slate-100">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="panel">
            <SectionTitle title="Event Log" />
            <ul className="space-y-2 text-xs text-slate-300">
              {eventLog.map((entry) => (
                <li key={entry} className="rounded-md border border-border/50 bg-panelAlt p-2">
                  {entry}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
