import type { ScoredOpportunity } from '../services/opportunityService';

interface OpportunityListProps {
  opportunities: ScoredOpportunity[];
}

export function OpportunityList({ opportunities }: OpportunityListProps) {
  const toPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const toSignedPercent = (value: number) => `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
  const toMomentumLabel = (value: number) =>
    value > 0.2 ? 'Positive' : value < -0.2 ? 'Negative' : 'Neutral';
  const toVolatilityLabel = (value: number) =>
    value > 0.65 ? 'High' : value > 0.35 ? 'Medium' : 'Low';

  return (
    <div className="opportunity-list">
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
