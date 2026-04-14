'use client';

import { useMemo, useState } from 'react';
import { OpportunityList } from '../ui/OpportunityList';
import {
  defaultStrategySettings,
  getScoredMockOpportunities,
  type StrategySettings,
} from '../services/opportunityService';

export default function HomePage() {
  const [strategySettings, setStrategySettings] = useState<StrategySettings>(defaultStrategySettings);
  const opportunities = useMemo(
    () => getScoredMockOpportunities(strategySettings),
    [strategySettings],
  );

  return (
    <main>
      <h1>Kalshi Simulator</h1>
      <OpportunityList
        opportunities={opportunities}
        initialStrategySettings={defaultStrategySettings}
        onStrategySettingsChange={setStrategySettings}
      />
    </main>
  );
}
