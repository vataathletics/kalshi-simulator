import { useEffect, useState } from 'react';
import type { ScoredOpportunity, StrategySettings } from '../services/opportunityService';
import { defaultStrategySettings } from '../services/opportunityService';

interface OpportunityListProps {
  opportunities: ScoredOpportunity[];
  initialStrategySettings?: StrategySettings;
  onStrategySettingsChange?: (settings: StrategySettings) => void;
}

export function OpportunityList({
  opportunities,
  initialStrategySettings = defaultStrategySettings,
  onStrategySettingsChange,
}: OpportunityListProps) {
  const [strategySettings, setStrategySettings] = useState<StrategySettings>(initialStrategySettings);

  useEffect(() => {
    onStrategySettingsChange?.(strategySettings);
  }, [onStrategySettingsChange, strategySettings]);

  const toPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const toSignedPercent = (value: number) => `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
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
