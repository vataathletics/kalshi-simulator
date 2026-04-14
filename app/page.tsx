'use client';

import { OpportunityList } from '../ui/OpportunityList';
import { defaultStrategySettings } from '../services/opportunityService';

export default function HomePage() {
  return (
    <main>
      <h1>Kalshi Simulator</h1>
      <OpportunityList initialStrategySettings={defaultStrategySettings} />
    </main>
  );
}
