export type OpportunitySignal = 'strong_buy' | 'watch' | 'ignore';

export interface Opportunity {
  id: string;
  title: string;
  /**
   * Price should be represented from 0 to 1.
   * Example: 0.42 means the market implies a 42% probability.
   */
  price: number;
}

export interface ScoredOpportunity extends Opportunity {
  impliedProbability: number;
  estimatedTrueProbability: number;
  edge: number;
  signal: OpportunitySignal;
}

const clampProbability = (value: number): number => {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

export const getImpliedProbability = (price: number): number => clampProbability(price);

/**
 * Mocked true probability estimator.
 * This is intentionally deterministic so UI and tests are stable for now.
 */
export const estimateTrueProbability = (opportunity: Opportunity): number => {
  const biasById = (opportunity.id.length % 5) * 0.03;
  return clampProbability(opportunity.price + biasById);
};

export const scoreOpportunity = (opportunity: Opportunity): ScoredOpportunity => {
  const impliedProbability = getImpliedProbability(opportunity.price);
  const estimatedTrueProbability = estimateTrueProbability(opportunity);
  const edge = estimatedTrueProbability - impliedProbability;

  let signal: OpportunitySignal = 'ignore';
  if (edge > 0.15) {
    signal = 'strong_buy';
  } else if (edge > 0.05) {
    signal = 'watch';
  }

  return {
    ...opportunity,
    impliedProbability,
    estimatedTrueProbability,
    edge,
    signal,
  };
};

export const scoreAndSortOpportunities = (
  opportunities: Opportunity[]
): ScoredOpportunity[] => opportunities.map(scoreOpportunity).sort((a, b) => b.edge - a.edge);
