import type { ScoredOpportunity } from '../services/opportunityService';

interface OpportunityListProps {
  opportunities: ScoredOpportunity[];
}

export function OpportunityList({ opportunities }: OpportunityListProps) {
  return (
    <div className="opportunity-list">
      {opportunities.map((opportunity) => (
        <article key={opportunity.id} className={`opportunity-card ${opportunity.label}`}>
          <header>
            <h3>{opportunity.title}</h3>
            <span className="label">{opportunity.label}</span>
          </header>

          <p className="edge">Edge: {(opportunity.edge * 100).toFixed(1)}%</p>
          <p className="reason">{opportunity.reason}</p>
        </article>
      ))}
    </div>
  );
}
