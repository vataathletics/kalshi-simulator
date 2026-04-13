import { getOpportunities } from '../services/opportunityService';

export default function Page() {
  const opportunities = getOpportunities();

  return (
    <main>
      <h1>Kalshi Simulator</h1>
      <ul>
        {opportunities.map((opportunity) => (
          <li key={opportunity.id}>
            {opportunity.title} ({opportunity.probability}%)
          </li>
        ))}
      </ul>
    </main>
  );
}
