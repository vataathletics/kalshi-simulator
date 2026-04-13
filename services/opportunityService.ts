export type SupportedSport = 'nba' | 'nhl' | 'nfl' | 'mlb';

export type OpportunityLabel = 'strong_buy' | 'watch' | 'ignore';

export interface MarketSnapshot {
  id: string;
  title: string;
  sport: SupportedSport;
  impliedProbability: number; // 0-1 decimal
  currentScoreFor: number;
  currentScoreAgainst: number;
  period: number; // quarter/period/inning
  secondsRemainingInPeriod: number;
  totalPeriods: number;
  periodLengthSeconds: number;
}

export interface ScoredOpportunity extends MarketSnapshot {
  estimatedTrueProbability: number;
  edge: number;
  label: OpportunityLabel;
  reason: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toGameProgress(snapshot: MarketSnapshot): number {
  const elapsedPeriods = Math.max(snapshot.period - 1, 0);
  const elapsedSeconds =
    elapsedPeriods * snapshot.periodLengthSeconds +
    (snapshot.periodLengthSeconds - snapshot.secondsRemainingInPeriod);
  const totalSeconds = snapshot.totalPeriods * snapshot.periodLengthSeconds;

  return clamp(elapsedSeconds / Math.max(totalSeconds, 1), 0, 1);
}

function toOneScoreDeficitUnits(sport: SupportedSport, scoreDiff: number): number {
  const deficit = Math.max(-scoreDiff, 0);

  const unitBySport: Record<SupportedSport, number> = {
    nhl: 1,
    nfl: 7,
    nba: 6,
    mlb: 1,
  };

  return deficit / unitBySport[sport];
}

function computeEstimatedProbability(snapshot: MarketSnapshot): {
  estimatedTrueProbability: number;
  reason: string;
} {
  const scoreDiff = snapshot.currentScoreFor - snapshot.currentScoreAgainst;
  const progress = toGameProgress(snapshot);
  const implied = clamp(snapshot.impliedProbability, 0.01, 0.99);

  // Positive adjustment = market likely too pessimistic.
  // Negative adjustment = market likely fair/too optimistic.
  const earlyFactor = 1 - progress;
  const lateFactor = progress;
  const deficitUnits = toOneScoreDeficitUnits(snapshot.sport, scoreDiff);

  let adjustment = 0;
  let reason = 'Price close to fair value';

  if (scoreDiff < 0) {
    if (snapshot.sport === 'nhl') {
      adjustment += 0.025 * earlyFactor;
      adjustment -= 0.05 * deficitUnits * lateFactor;

      if (progress < 0.45 && deficitUnits <= 1.2) {
        reason = 'Early overreaction to 1-goal deficit';
      } else if (progress > 0.75) {
        reason = 'Late-game deficit likely priced fairly';
      } else {
        reason = 'Deficit impact increasing as clock runs down';
      }
    } else if (snapshot.sport === 'nba') {
      adjustment += 0.015 * earlyFactor;
      adjustment -= 0.03 * deficitUnits * earlyFactor;
      adjustment -= 0.09 * deficitUnits * lateFactor;

      if (progress < 0.4 && deficitUnits <= 1.2) {
        reason = 'Small NBA deficit priced too aggressively';
      } else if (progress > 0.7) {
        reason = 'Late-game deficit likely priced fairly';
      } else {
        reason = 'NBA deficits compound quickly as time decreases';
      }
    } else {
      adjustment += 0.02 * earlyFactor;
      adjustment -= 0.07 * deficitUnits * lateFactor;

      if (progress < 0.4 && deficitUnits <= 1.1) {
        reason = 'Early deficit may be overstated';
      } else if (progress > 0.75) {
        reason = 'Late-game deficit likely priced fairly';
      } else {
        reason = 'Deficit impact rising with game progress';
      }
    }
  } else if (scoreDiff > 0) {
    adjustment -= 0.015 * lateFactor;
    reason = 'Leading team premium trimmed for regression risk';
  } else {
    adjustment += 0.01 * earlyFactor;
    reason = progress < 0.35 ? 'Early tie game often mispriced' : 'Tie game near fair value';
  }

  // Slight moderation when implied probability already extreme.
  const extremityPenalty = Math.max(Math.abs(implied - 0.5) - 0.25, 0) * 0.1;
  adjustment *= 1 - extremityPenalty;

  const estimatedTrueProbability = clamp(implied + adjustment, 0.01, 0.99);

  return { estimatedTrueProbability, reason };
}

function toLabel(edge: number): OpportunityLabel {
  if (edge >= 0.06) {
    return 'strong_buy';
  }

  if (edge >= 0.02) {
    return 'watch';
  }

  return 'ignore';
}

export function scoreOpportunities(markets: MarketSnapshot[]): ScoredOpportunity[] {
  return markets
    .map((market) => {
      const { estimatedTrueProbability, reason } = computeEstimatedProbability(market);
      const edge = estimatedTrueProbability - market.impliedProbability;

      return {
        ...market,
        estimatedTrueProbability,
        edge,
        label: toLabel(edge),
        reason,
      };
    })
    .sort((a, b) => b.edge - a.edge);
}
