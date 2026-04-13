import { dashboardSeed, type Opportunity } from '../data/dashboardSeed';

export function getOpportunities(): Opportunity[] {
  return dashboardSeed;
}
