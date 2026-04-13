import { useEffect, useState } from 'react';
import type { ScoredOpportunity, StrategySettings } from '../services/opportunityService';
import { defaultStrategySettings } from '../services/opportunityService';

interface SimulatedTrade {
  id: string;
  marketId: string;
  title: string;
  pnl: number;
}

interface SessionStats {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  averageWin: number;
  averageLoss: number;
  maxDrawdown: number;
  bestTrade: number;
  worstTrade: number;
}

interface StrategySessionSnapshot {
  startedAtIso: string;
  strategySettings: StrategySettings;
}

interface OpportunityListProps {
  opportunities: ScoredOpportunity[];
  initialStrategySettings?: StrategySettings;
  onStrategySettingsChange?: (settings: StrategySettings) => void;
}

const emptyStats: SessionStats = {
  totalTrades: 0,
  winRate: 0,
  totalPnl: 0,
  averageWin: 0,
  averageLoss: 0,
  maxDrawdown: 0,
  bestTrade: 0,
  worstTrade: 0,
};

function cloneSettings(settings: StrategySettings): StrategySettings {
  return { ...settings };
}

function computeTradePnl(opportunity: ScoredOpportunity, settings: StrategySettings): number {
  const positionSize = 10;
  const returnPercent =
    opportunity.edge * 0.9 + opportunity.momentum * 0.03 - opportunity.volatility * 0.02;
  const boundedReturnPercent = Math.min(
    settings.takeProfitPercent * 1.1,
    Math.max(-settings.stopLossPercent, returnPercent),
  );

  return Number((positionSize * boundedReturnPercent).toFixed(2));
}

function computeSessionStats(trades: SimulatedTrade[]): SessionStats {
  if (!trades.length) {
    return emptyStats;
  }

  const wins = trades.filter((trade) => trade.pnl > 0);
  const losses = trades.filter((trade) => trade.pnl < 0);
  const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const bestTrade = trades.reduce((best, trade) => Math.max(best, trade.pnl), Number.NEGATIVE_INFINITY);
  const worstTrade = trades.reduce((worst, trade) => Math.min(worst, trade.pnl), Number.POSITIVE_INFINITY);

  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (const trade of trades) {
    equity += trade.pnl;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak - equity);
  }

  const averageWin = wins.length
    ? wins.reduce((sum, trade) => sum + trade.pnl, 0) / wins.length
    : 0;
  const averageLoss = losses.length
    ? losses.reduce((sum, trade) => sum + trade.pnl, 0) / losses.length
    : 0;

  return {
    totalTrades: trades.length,
    winRate: wins.length / trades.length,
    totalPnl: Number(totalPnl.toFixed(2)),
    averageWin: Number(averageWin.toFixed(2)),
    averageLoss: Number(averageLoss.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    bestTrade: Number(bestTrade.toFixed(2)),
    worstTrade: Number(worstTrade.toFixed(2)),
  };
}

export function OpportunityList({
  opportunities,
  initialStrategySettings = defaultStrategySettings,
  onStrategySettingsChange,
}: OpportunityListProps) {
  const [strategySettings, setStrategySettings] = useState<StrategySettings>(initialStrategySettings);
  const [trades, setTrades] = useState<SimulatedTrade[]>([]);
  const [sessionSnapshot, setSessionSnapshot] = useState<StrategySessionSnapshot>({
    startedAtIso: new Date().toISOString(),
    strategySettings: cloneSettings(initialStrategySettings),
  });

  useEffect(() => {
    onStrategySettingsChange?.(strategySettings);
  }, [onStrategySettingsChange, strategySettings]);

  useEffect(() => {
    setTrades((currentTrades) => {
      const tradedMarketIds = new Set(currentTrades.map((trade) => trade.marketId));
      const newTrades = opportunities
        .filter((opportunity) => opportunity.label === 'strong_buy' && !tradedMarketIds.has(opportunity.id))
        .map((opportunity) => ({
          id: `${opportunity.id}-${currentTrades.length + tradedMarketIds.size}`,
          marketId: opportunity.id,
          title: opportunity.title,
          pnl: computeTradePnl(opportunity, strategySettings),
        }));

      if (!newTrades.length) {
        return currentTrades;
      }

      return [...currentTrades, ...newTrades];
    });
  }, [opportunities, strategySettings]);

  const toPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const toSignedPercent = (value: number) => `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
  const toMoney = (value: number) => `${value >= 0 ? '+' : '-'}$${Math.abs(value).toFixed(2)}`;
  const toMomentumLabel = (value: number) =>
    value > 0.2 ? 'Positive' : value < -0.2 ? 'Negative' : 'Neutral';
  const toVolatilityLabel = (value: number) =>
    value > 0.65 ? 'High' : value > 0.35 ? 'Medium' : 'Low';
  const fields: Array<{ key: keyof StrategySettings; label: string; step: number }> = [
    { key: 'strongBuyEdgeThreshold', label: 'Strong buy edge', step: 0.005 },
    { key: 'watchEdgeThreshold', label: 'Watch edge', step: 0.005 },
    { key: 'minimumMomentum', label: 'Min momentum', step: 0.05 },
    { key: 'maximumVolatility', label: 'Max volatility', step: 0.05 },
    { key: 'minimumTimeRemaining', label: 'Min time remaining', step: 0.05 },
    { key: 'takeProfitPercent', label: 'Take profit', step: 0.005 },
    { key: 'stopLossPercent', label: 'Stop loss', step: 0.005 },
    { key: 'maxHoldMinutes', label: 'Max hold (min)', step: 1 },
  ];

  const updateSetting = (key: keyof StrategySettings, value: number) => {
    setStrategySettings((current) => ({ ...current, [key]: value }));
  };
  const stats = computeSessionStats(trades);

  const resetSession = () => {
    setTrades([]);
    setSessionSnapshot({
      startedAtIso: new Date().toISOString(),
      strategySettings: cloneSettings(strategySettings),
    });
  };

  return (
    <div className="opportunity-list">
      <section className="strategy-settings-panel">
        <h3>Strategy settings</h3>
        <div className="metrics-row">
          {fields.map((field) => (
            <label key={field.key} className="chip">
              <span>{field.label}</span>
              <input
                type="number"
                step={field.step}
                value={strategySettings[field.key]}
                onChange={(event) => updateSetting(field.key, Number(event.target.value))}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="strategy-settings-panel">
        <header>
          <h3>Session performance</h3>
          <button type="button" onClick={resetSession}>
            Reset session
          </button>
        </header>
        <p className="reason">
          Snapshot {new Date(sessionSnapshot.startedAtIso).toLocaleString()} · TP{' '}
          {toPercent(sessionSnapshot.strategySettings.takeProfitPercent)} · SL{' '}
          {toPercent(sessionSnapshot.strategySettings.stopLossPercent)} · Max hold{' '}
          {sessionSnapshot.strategySettings.maxHoldMinutes}m
        </p>
        <div className="metrics-row">
          <span className="chip">Trades {stats.totalTrades}</span>
          <span className="chip">Win rate {toPercent(stats.winRate)}</span>
          <span className="chip">PnL {toMoney(stats.totalPnl)}</span>
          <span className="chip">Avg win {toMoney(stats.averageWin)}</span>
          <span className="chip">Avg loss {toMoney(stats.averageLoss)}</span>
          <span className="chip">Max DD {toMoney(-stats.maxDrawdown)}</span>
          <span className="chip">Best {toMoney(stats.bestTrade)}</span>
          <span className="chip">Worst {toMoney(stats.worstTrade)}</span>
        </div>
      </section>

      {opportunities.map((opportunity) => (
        <article key={opportunity.id} className={`opportunity-card ${opportunity.label}`}>
          <header>
            <h3>{opportunity.title}</h3>
            <span className={`label label-${opportunity.label}`}>{opportunity.label.replace('_', ' ')}</span>
          </header>

          <div className="metrics-row">
            <span className="chip chip-edge">Edge {toSignedPercent(opportunity.edge)}</span>
            <span className="chip">Implied {toPercent(opportunity.impliedProbability)}</span>
            <span className="chip">True {toPercent(opportunity.estimatedTrueProbability)}</span>
          </div>

          <div className="metrics-row">
            <span className="chip">Momentum {toMomentumLabel(opportunity.momentum)}</span>
            <span className="chip">Time left {toPercent(opportunity.timeRemaining)}</span>
            <span className="chip">Volatility {toVolatilityLabel(opportunity.volatility)}</span>
          </div>

          <p className="edge">Recommendation: {opportunity.label.replace('_', ' ')}</p>
          <p className="reason">{opportunity.reason}</p>
        </article>
      ))}
    </div>
  );
}
