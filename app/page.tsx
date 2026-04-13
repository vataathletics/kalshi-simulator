type Opportunity = {
  sport: string;
  matchup: string;
  underdogPrice: string;
  score: string;
  gameClock: string;
  signalStrength: string;
  recommendedEntry: string;
  recommendedTakeProfit: string;
  recommendedStopLoss: string;
  reasonCode: string;
};

type OpenPosition = {
  market: string;
  entryPrice: string;
  currentPrice: string;
  unrealizedPnl: string;
  holdTime: string;
  exitTargets: string;
};

type ClosedTrade = {
  market: string;
  entry: string;
  exit: string;
  pnl: string;
  reasonForEntry: string;
  reasonForExit: string;
};

const opportunities: Opportunity[] = [
  {
    sport: 'NBA',
    matchup: 'SAC @ LAL',
    underdogPrice: '34¢',
    score: '89-94',
    gameClock: 'Q4 07:11',
    signalStrength: 'High',
    recommendedEntry: '32¢-36¢',
    recommendedTakeProfit: '53¢',
    recommendedStopLoss: '24¢',
    reasonCode: 'PACE_SPIKE'
  },
  {
    sport: 'NHL',
    matchup: 'BOS @ NYR',
    underdogPrice: '41¢',
    score: '2-2',
    gameClock: '3P 11:39',
    signalStrength: 'Medium',
    recommendedEntry: '40¢-43¢',
    recommendedTakeProfit: '57¢',
    recommendedStopLoss: '33¢',
    reasonCode: 'SHOT_VOLUME'
  },
  {
    sport: 'MLB',
    matchup: 'CHC @ STL',
    underdogPrice: '28¢',
    score: '3-5',
    gameClock: 'B8 2 Outs',
    signalStrength: 'Very High',
    recommendedEntry: '27¢-30¢',
    recommendedTakeProfit: '44¢',
    recommendedStopLoss: '20¢',
    reasonCode: 'BULLPEN_EDGE'
  }
];

const openPositions: OpenPosition[] = [
  {
    market: 'LAL to Win vs SAC',
    entryPrice: '35¢',
    currentPrice: '42¢',
    unrealizedPnl: '+$84',
    holdTime: '00:16:29',
    exitTargets: 'TP 52¢ / SL 26¢'
  },
  {
    market: 'NYR to Win vs BOS',
    entryPrice: '39¢',
    currentPrice: '36¢',
    unrealizedPnl: '-$27',
    holdTime: '00:07:11',
    exitTargets: 'TP 54¢ / SL 31¢'
  },
  {
    market: 'STL to Win vs CHC',
    entryPrice: '64¢',
    currentPrice: '70¢',
    unrealizedPnl: '+$48',
    holdTime: '00:11:42',
    exitTargets: 'TP 78¢ / SL 57¢'
  }
];

const closedTrades: ClosedTrade[] = [
  {
    market: 'DAL to Win vs PHX',
    entry: '44¢',
    exit: '61¢',
    pnl: '+$170',
    reasonForEntry: 'INJURY_MISMATCH',
    reasonForExit: 'TAKE_PROFIT_HIT'
  },
  {
    market: 'KC to Win vs BAL',
    entry: '31¢',
    exit: '25¢',
    pnl: '-$60',
    reasonForEntry: 'WEATHER_EDGE',
    reasonForExit: 'STOP_LOSS_HIT'
  },
  {
    market: 'TOR to Win vs MIA',
    entry: '49¢',
    exit: '53¢',
    pnl: '+$44',
    reasonForEntry: 'LATE_GAME_PACE',
    reasonForExit: 'MANUAL_REBALANCE'
  }
];

const eventLog = [
  '21:09:12 | Signal upgraded to Very High: CHC @ STL (BULLPEN_EDGE)',
  '21:07:45 | Opened paper position: LAL to Win at 35¢ (size 120 contracts)',
  '21:05:31 | Risk guardrail warning: exposure in NBA bucket reached 32%',
  '21:03:04 | Closed DAL vs PHX at TP target 61¢ (+$170)',
  '21:00:20 | Session initialized with bankroll $25,000'
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-surface to-slate-950 p-4 md:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="panel flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-accent">Paper Trading Cockpit</p>
            <h1 className="mt-1 text-2xl font-bold text-white">Live Sports Prediction Dashboard</h1>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs md:text-sm">
            <StatPill label="Buying Power" value="$18,420" />
            <StatPill label="Daily PnL" value="+$214" positive />
            <StatPill label="Open Risk" value="12.4%" />
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="panel xl:col-span-2">
            <h2 className="section-title">1. Live Opportunities</h2>
            <DataTable
              headers={[
                'Sport',
                'Matchup',
                'Underdog Price',
                'Score',
                'Clock',
                'Signal',
                'Entry',
                'Take Profit',
                'Stop Loss',
                'Reason'
              ]}
              rows={opportunities.map((row) => [
                row.sport,
                row.matchup,
                row.underdogPrice,
                row.score,
                row.gameClock,
                row.signalStrength,
                row.recommendedEntry,
                row.recommendedTakeProfit,
                row.recommendedStopLoss,
                row.reasonCode
              ])}
            />
          </div>

          <div className="panel">
            <h2 className="section-title">2. Paper Portfolio</h2>
            <dl className="space-y-3 text-sm">
              <Metric label="Portfolio Value" value="$25,982" />
              <Metric label="Cash" value="$18,420" />
              <Metric label="Net Exposure" value="$7,562" />
              <Metric label="Win Rate (7d)" value="63.2%" />
              <Metric label="Avg Hold Time" value="18m 42s" />
              <Metric label="Max Drawdown" value="-4.7%" negative />
            </dl>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="panel xl:col-span-2">
            <h2 className="section-title">3. Open Positions</h2>
            <DataTable
              headers={['Market', 'Entry Price', 'Current Price', 'Unrealized PnL', 'Hold Time', 'Exit Targets']}
              rows={openPositions.map((row) => [
                row.market,
                row.entryPrice,
                row.currentPrice,
                row.unrealizedPnl,
                row.holdTime,
                row.exitTargets
              ])}
            />
          </div>

          <div className="panel">
            <h2 className="section-title">6. Risk Controls</h2>
            <ul className="space-y-2 text-sm text-slate-200">
              <li>Max contracts per market: <span className="font-semibold text-white">150</span></li>
              <li>Max correlated exposure: <span className="font-semibold text-white">35%</span></li>
              <li>Per-trade risk limit: <span className="font-semibold text-white">1.5% bankroll</span></li>
              <li>Auto-stop after 3 consecutive losses: <span className="font-semibold text-profit">Enabled</span></li>
              <li>Volatility throttle: <span className="font-semibold text-accent">Adaptive</span></li>
            </ul>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="panel xl:col-span-2">
            <h2 className="section-title">4. Closed Trades</h2>
            <DataTable
              headers={['Market', 'Entry', 'Exit', 'PnL', 'Reason for Entry', 'Reason for Exit']}
              rows={closedTrades.map((row) => [
                row.market,
                row.entry,
                row.exit,
                row.pnl,
                row.reasonForEntry,
                row.reasonForExit
              ])}
            />
          </div>

          <div className="panel">
            <h2 className="section-title">5. Strategy Settings</h2>
            <ul className="space-y-2 text-sm text-slate-200">
              <li>Signal model: <span className="font-semibold text-white">Momentum + Microstructure v2</span></li>
              <li>Trade mode: <span className="font-semibold text-white">Underdog Reversion</span></li>
              <li>Execution cadence: <span className="font-semibold text-white">5s</span></li>
              <li>Min signal threshold: <span className="font-semibold text-white">0.72</span></li>
              <li>Position sizing model: <span className="font-semibold text-white">Scaled Kelly (0.35)</span></li>
            </ul>
          </div>
        </section>

        <section className="panel">
          <h2 className="section-title">7. Event Log</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            {eventLog.map((line) => (
              <li key={line} className="rounded-md border border-border bg-slate-900/60 px-3 py-2 font-mono text-xs md:text-sm">
                {line}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] text-left text-xs md:text-sm">
        <thead>
          <tr className="border-b border-border text-slate-400">
            {headers.map((header) => (
              <th key={header} className="whitespace-nowrap px-2 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row[0]}-${idx}`} className="border-b border-border/50 text-slate-100 last:border-b-0">
              {row.map((cell) => (
                <td
                  key={cell}
                  className={`whitespace-nowrap px-2 py-2 ${
                    cell.startsWith('+$') ? 'text-profit' : cell.startsWith('-$') ? 'text-loss' : ''
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatPill({ label, value, positive = false }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-slate-900/80 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-base font-semibold ${positive ? 'text-profit' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function Metric({ label, value, negative = false }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-slate-900/60 px-3 py-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className={`font-semibold ${negative ? 'text-loss' : 'text-white'}`}>{value}</dd>
    </div>
  );
}
