import { useEffect, useMemo, useState } from 'react';
import type { ScoredOpportunity, StrategySettings } from '../services/opportunityService';
import { defaultStrategySettings } from '../services/opportunityService';

interface PortfolioSettings {
  maxConcurrentPositions: number;
  maxCapitalDeployed: number;
  positionSize: number;
  feeRate: number;
}

interface OpenPosition {
  id: string;
  marketId: string;
  title: string;
  entryTimeIso: string;
  entryTick: number;
  positionSize: number;
  entryFee: number;
}

interface SimulatedTrade {
  id: string;
  marketId: string;
  title: string;
  entryTimeIso: string;
  exitTimeIso: string;
  holdDurationMinutes: number;
  grossPnl: number;
  fees: number;
  netPnl: number;
}

interface SessionStats {
  totalTrades: number;
  grossPnl: number;
  totalFees: number;
  netPnl: number;
  avgGrossPerTrade: number;
  avgNetPerTrade: number;
  winRate: number;
  maxDrawdown: number;
  openPositionsCount: number;
  capitalDeployed: number;
}

interface StrategySessionSnapshot {
  startedAtIso: string;
  strategySettings: StrategySettings;
  portfolioSettings: PortfolioSettings;
}

interface SimulatorState {
  openedSequence: number;
  openPositions: OpenPosition[];
  closedTrades: SimulatedTrade[];
}

interface OpportunityListProps {
  opportunities: ScoredOpportunity[];
  initialStrategySettings?: StrategySettings;
  onStrategySettingsChange?: (settings: StrategySettings) => void;
}

const TICK_MS = 60_000;

const defaultPortfolioSettings: PortfolioSettings = {
  maxConcurrentPositions: 3,
  maxCapitalDeployed: 30,
  positionSize: 10,
  feeRate: 0.015,
};

const emptyStats: SessionStats = {
  totalTrades: 0,
  grossPnl: 0,
  totalFees: 0,
  netPnl: 0,
  avgGrossPerTrade: 0,
  avgNetPerTrade: 0,
  winRate: 0,
  maxDrawdown: 0,
  openPositionsCount: 0,
  capitalDeployed: 0,
};

function cloneSettings(settings: StrategySettings): StrategySettings {
  return { ...settings };
}

function clonePortfolioSettings(settings: PortfolioSettings): PortfolioSettings {
  return { ...settings };
}

function computeReturnPercent(opportunity: ScoredOpportunity): number {
  return opportunity.edge * 0.9 + opportunity.momentum * 0.03 - opportunity.volatility * 0.02;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeFees(positionSize: number, feeRate: number): number {
  return Number((positionSize * feeRate).toFixed(2));
}

function computeSessionStats(trades: SimulatedTrade[], openPositions: OpenPosition[]): SessionStats {
  if (!trades.length && !openPositions.length) {
    return emptyStats;
  }

  const totalTrades = trades.length;
  const grossPnl = trades.reduce((sum, trade) => sum + trade.grossPnl, 0);
  const totalFees = trades.reduce((sum, trade) => sum + trade.fees, 0);
  const netPnl = trades.reduce((sum, trade) => sum + trade.netPnl, 0);
  const wins = trades.filter((trade) => trade.netPnl > 0).length;

  let runningNet = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (const trade of trades) {
    runningNet += trade.netPnl;
    peak = Math.max(peak, runningNet);
    maxDrawdown = Math.max(maxDrawdown, peak - runningNet);
  }

  const capitalDeployed = openPositions.reduce((sum, position) => sum + position.positionSize, 0);

  return {
    totalTrades,
    grossPnl: Number(grossPnl.toFixed(2)),
    totalFees: Number(totalFees.toFixed(2)),
    netPnl: Number(netPnl.toFixed(2)),
    avgGrossPerTrade: totalTrades ? Number((grossPnl / totalTrades).toFixed(2)) : 0,
    avgNetPerTrade: totalTrades ? Number((netPnl / totalTrades).toFixed(2)) : 0,
    winRate: totalTrades ? wins / totalTrades : 0,
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    openPositionsCount: openPositions.length,
    capitalDeployed: Number(capitalDeployed.toFixed(2)),
  };
}

export function OpportunityList({
  opportunities,
  initialStrategySettings = defaultStrategySettings,
  onStrategySettingsChange,
}: OpportunityListProps) {
  const [strategySettings, setStrategySettings] = useState<StrategySettings>(initialStrategySettings);
  const [portfolioSettings, setPortfolioSettings] =
    useState<PortfolioSettings>(defaultPortfolioSettings);
  const [simulatorState, setSimulatorState] = useState<SimulatorState>({
    openedSequence: 0,
    openPositions: [],
    closedTrades: [],
  });
  const [tick, setTick] = useState(0);
  const [sessionSnapshot, setSessionSnapshot] = useState<StrategySessionSnapshot>({
    startedAtIso: new Date().toISOString(),
    strategySettings: cloneSettings(initialStrategySettings),
    portfolioSettings: clonePortfolioSettings(defaultPortfolioSettings),
  });

  useEffect(() => {
    onStrategySettingsChange?.(strategySettings);
  }, [onStrategySettingsChange, strategySettings]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((current) => current + 1);
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSimulatorState((current) => {
      const tickNow = tick;
      const marketById = new Map(opportunities.map((opportunity) => [opportunity.id, opportunity]));
      const stillOpen: OpenPosition[] = [];
      const closedTrades = [...current.closedTrades];

      for (const position of current.openPositions) {
        const opportunity = marketById.get(position.marketId);
        if (!opportunity) {
          stillOpen.push(position);
          continue;
        }

        const holdDurationMinutes = (tickNow - position.entryTick) * (TICK_MS / 60_000);
        const returnPercent = computeReturnPercent(opportunity);
        const hitTakeProfit = returnPercent >= strategySettings.takeProfitPercent;
        const hitStopLoss = returnPercent <= -strategySettings.stopLossPercent;
        const hitMaxHold = holdDurationMinutes >= strategySettings.maxHoldMinutes;
        const noLongerStrongBuy = opportunity.label !== 'strong_buy';
        const shouldClose = hitTakeProfit || hitStopLoss || hitMaxHold || noLongerStrongBuy;

        if (!shouldClose) {
          stillOpen.push(position);
          continue;
        }

        const boundedReturn = clamp(
          returnPercent,
          -strategySettings.stopLossPercent,
          strategySettings.takeProfitPercent,
        );
        const grossPnl = Number((position.positionSize * boundedReturn).toFixed(2));
        const exitFee = computeFees(position.positionSize, portfolioSettings.feeRate);
        const fees = Number((position.entryFee + exitFee).toFixed(2));
        const netPnl = Number((grossPnl - fees).toFixed(2));
        const exitTimeIso = new Date(
          new Date(sessionSnapshot.startedAtIso).getTime() + tickNow * TICK_MS,
        ).toISOString();

        closedTrades.push({
          id: `${position.id}-closed-${tickNow}`,
          marketId: position.marketId,
          title: position.title,
          entryTimeIso: position.entryTimeIso,
          exitTimeIso,
          holdDurationMinutes,
          grossPnl,
          fees,
          netPnl,
        });
      }

      const openMarketIds = new Set(stillOpen.map((position) => position.marketId));
      let nextSequence = current.openedSequence;
      let currentCapital = stillOpen.reduce((sum, position) => sum + position.positionSize, 0);

      const strongBuys = opportunities.filter((opportunity) => opportunity.label === 'strong_buy');
      for (const opportunity of strongBuys) {
        if (openMarketIds.has(opportunity.id)) {
          continue;
        }

        const underPositionLimit = stillOpen.length < portfolioSettings.maxConcurrentPositions;
        const underCapitalLimit =
          currentCapital + portfolioSettings.positionSize <= portfolioSettings.maxCapitalDeployed;
        if (!underPositionLimit || !underCapitalLimit) {
          continue;
        }

        nextSequence += 1;
        const entryFee = computeFees(portfolioSettings.positionSize, portfolioSettings.feeRate);
        stillOpen.push({
          id: `position-${nextSequence}`,
          marketId: opportunity.id,
          title: opportunity.title,
          entryTimeIso: new Date(
            new Date(sessionSnapshot.startedAtIso).getTime() + tickNow * TICK_MS,
          ).toISOString(),
          entryTick: tickNow,
          positionSize: portfolioSettings.positionSize,
          entryFee,
        });
        openMarketIds.add(opportunity.id);
        currentCapital += portfolioSettings.positionSize;
      }

      return {
        ...current,
        openedSequence: nextSequence,
        openPositions: stillOpen,
        closedTrades,
      };
    });
  }, [opportunities, portfolioSettings, sessionSnapshot.startedAtIso, strategySettings, tick]);

  const toPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const toSignedPercent = (value: number) => `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
  const toMoney = (value: number) => `${value >= 0 ? '+' : '-'}$${Math.abs(value).toFixed(2)}`;
  const toMomentumLabel = (value: number) =>
    value > 0.2 ? 'Positive' : value < -0.2 ? 'Negative' : 'Neutral';
  const toVolatilityLabel = (value: number) =>
    value > 0.65 ? 'High' : value > 0.35 ? 'Medium' : 'Low';

  const strategyFields: Array<{ key: keyof StrategySettings; label: string; step: number; min?: number }> = [
    { key: 'strongBuyEdgeThreshold', label: 'Strong buy edge', step: 0.005 },
    { key: 'watchEdgeThreshold', label: 'Watch edge', step: 0.005 },
    { key: 'minimumMomentum', label: 'Min momentum', step: 0.05 },
    { key: 'maximumVolatility', label: 'Max volatility', step: 0.05, min: 0 },
    { key: 'minimumTimeRemaining', label: 'Min time remaining', step: 0.05, min: 0 },
    { key: 'takeProfitPercent', label: 'Take profit', step: 0.005, min: 0 },
    { key: 'stopLossPercent', label: 'Stop loss', step: 0.005, min: 0 },
    { key: 'maxHoldMinutes', label: 'Max hold (min)', step: 1, min: 1 },
  ];

  const portfolioFields: Array<{
    key: keyof PortfolioSettings;
    label: string;
    step: number;
    min?: number;
  }> = [
    { key: 'maxConcurrentPositions', label: 'Max positions', step: 1, min: 1 },
    { key: 'maxCapitalDeployed', label: 'Max capital', step: 1, min: 1 },
    { key: 'positionSize', label: 'Position size', step: 1, min: 1 },
    { key: 'feeRate', label: 'Fee rate', step: 0.001, min: 0 },
  ];

  const updateStrategySetting = (key: keyof StrategySettings, value: number) => {
    setStrategySettings((current) => ({ ...current, [key]: value }));
  };

  const updatePortfolioSetting = (key: keyof PortfolioSettings, value: number) => {
    setPortfolioSettings((current) => ({ ...current, [key]: value }));
  };

  const stats = useMemo(
    () => computeSessionStats(simulatorState.closedTrades, simulatorState.openPositions),
    [simulatorState.closedTrades, simulatorState.openPositions],
  );

  const resetSession = () => {
    setSimulatorState({
      openedSequence: 0,
      openPositions: [],
      closedTrades: [],
    });
    setTick(0);
    setSessionSnapshot({
      startedAtIso: new Date().toISOString(),
      strategySettings: cloneSettings(strategySettings),
      portfolioSettings: clonePortfolioSettings(portfolioSettings),
    });
  };

  return (
    <div className="opportunity-list">
      <section className="strategy-settings-panel">
        <h3>Strategy settings</h3>
        <div className="metrics-row">
          {strategyFields.map((field) => (
            <label key={field.key} className="chip">
              <span>{field.label}</span>
              <input
                type="number"
                min={field.min}
                step={field.step}
                value={strategySettings[field.key]}
                onChange={(event) => updateStrategySetting(field.key, Number(event.target.value))}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="strategy-settings-panel">
        <h3>Portfolio constraints</h3>
        <div className="metrics-row">
          {portfolioFields.map((field) => (
            <label key={field.key} className="chip">
              <span>{field.label}</span>
              <input
                type="number"
                min={field.min}
                step={field.step}
                value={portfolioSettings[field.key]}
                onChange={(event) => updatePortfolioSetting(field.key, Number(event.target.value))}
              />
            </label>
          ))}
        </div>
        <p className="reason">Fee rate applies at both entry and exit (e.g., 0.015 = 1.5% per side).</p>
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
          {sessionSnapshot.strategySettings.maxHoldMinutes}m · Max positions{' '}
          {sessionSnapshot.portfolioSettings.maxConcurrentPositions}
        </p>
        <div className="metrics-row">
          <span className="chip">Trades {stats.totalTrades}</span>
          <span className="chip">Gross {toMoney(stats.grossPnl)}</span>
          <span className="chip">Fees {toMoney(-stats.totalFees)}</span>
          <span className="chip">Net {toMoney(stats.netPnl)}</span>
          <span className="chip">Avg gross {toMoney(stats.avgGrossPerTrade)}</span>
          <span className="chip">Avg net {toMoney(stats.avgNetPerTrade)}</span>
          <span className="chip">Win rate {toPercent(stats.winRate)}</span>
          <span className="chip">Max DD {toMoney(-stats.maxDrawdown)}</span>
          <span className="chip">Open {stats.openPositionsCount}</span>
          <span className="chip">Capital ${stats.capitalDeployed.toFixed(2)}</span>
        </div>
      </section>

      {!!simulatorState.openPositions.length && (
        <section className="strategy-settings-panel">
          <h3>Open positions</h3>
          <div className="metrics-row">
            {simulatorState.openPositions.map((position) => (
              <span key={position.id} className="chip">
                {position.title} · {new Date(position.entryTimeIso).toLocaleTimeString()} · ${position.positionSize}
              </span>
            ))}
          </div>
        </section>
      )}

      {!!simulatorState.closedTrades.length && (
        <section className="strategy-settings-panel">
          <h3>Recent closed trades</h3>
          <div className="metrics-row">
            {simulatorState.closedTrades
              .slice(-8)
              .reverse()
              .map((trade) => (
                <span key={trade.id} className="chip">
                  {trade.title} · {toMoney(trade.grossPnl)} gross · {toMoney(-trade.fees)} fees ·{' '}
                  {toMoney(trade.netPnl)} net · {trade.holdDurationMinutes.toFixed(0)}m
                </span>
              ))}
          </div>
        </section>
      )}

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
