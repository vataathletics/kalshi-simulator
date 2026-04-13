import type { CSSProperties } from 'react';
import type { ScoredOpportunity } from '../services/opportunityService';
import { scoreAndSortOpportunities } from '../services/opportunityService';

const signalColor: Record<ScoredOpportunity['signal'], string> = {
  strong_buy: '#2e7d32',
  watch: '#f9a825',
  ignore: '#757575',
};

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto auto',
  gap: '0.5rem',
  alignItems: 'center',
  padding: '0.5rem 0.75rem',
  borderBottom: '1px solid #e0e0e0',
};

const percent = (value: number): string => `${(value * 100).toFixed(1)}%`;

interface OpportunityListProps {
  opportunities: Array<{
    id: string;
    title: string;
    price: number;
  }>;
}

export function OpportunityList({ opportunities }: OpportunityListProps) {
  const scored = scoreAndSortOpportunities(opportunities);

  return (
    <div aria-label="opportunity-list">
      {scored.map((opportunity) => (
        <div key={opportunity.id} style={rowStyle}>
          <span>{opportunity.title}</span>
          <span style={{ color: signalColor[opportunity.signal], fontWeight: 700 }}>
            {opportunity.signal}
          </span>
          <span style={{ color: signalColor[opportunity.signal] }}>
            Edge: {percent(opportunity.edge)}
          </span>
        </div>
      ))}
    </div>
  );
}
