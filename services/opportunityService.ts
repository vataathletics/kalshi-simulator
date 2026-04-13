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

function toMockTimeRemaining(snapshot: MarketSnapshot): number {
  const totalSeconds = Math.max(snapshot.totalPeriods * snapshot.periodLengthSeconds, 1);
  const elapsedPeriods = Math.max(snapshot.period - 1, 0);
  const elapsedSeconds =
    elapsedPeriods * snapshot.periodLengthSeconds +
    (snapshot.periodLengthSeconds - snapshot.secondsRemainingInPeriod);

  return clamp(1 - elapsedSeconds / totalSeconds, 0, 1);
}

function toDeterministicSeed(id: string): number {
  return id.split('').reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);
}

function toMomentum(snapshot: MarketSnapshot): number {
  // Mocked deterministic "tick change" between -1 and 1.
  const seed = toDeterministicSeed(snapshot.id);
  const progress = toGameProgress(snapshot);
  const baseWave = Math.sin(seed * 0.05 + progress * 6);

  return clamp(baseWave, -1, 1);
}

function toVolatility(snapshot: MarketSnapshot): number {
  // Mocked deterministic recent movement proxy between 0 and 1.
  const seed = toDeterministicSeed(snapshot.id);
  const progress = toGameProgress(snapshot);
  const movementA = Math.abs(Math.sin(seed * 0.09 + progress * 5));
  const movementB = Math.abs(Math.cos(seed * 0.04 + progress * 3));

  return clamp((movementA + movementB) / 2, 0, 1);
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

  const timeRemaining = toMockTimeRemaining(snapshot);
  const momentum = toMomentum(snapshot);
  const volatility = toVolatility(snapshot);

  // Additional deterministic mocked signal stack.
  // Positive momentum slightly boosts conviction.
  const momentumAdjustment = 0.02 * momentum;
  // More time remaining gives greater room for reversion.
  const timeAdjustment = 0.015 * (timeRemaining - 0.5);
  // Higher volatility lowers confidence in edge quality.
  const volatilityAdjustment = -0.02 * volatility;

  adjustment += momentumAdjustment + timeAdjustment + volatilityAdjustment;

  const estimatedTrueProbability = clamp(implied + adjustment, 0.01, 0.99);
  const momentumDirection = momentum >= 0 ? 'upward' : 'downward';
  const volatilityBand =
    volatility > 0.65 ? 'high' : volatility > 0.35 ? 'moderate' : 'low';
  const timeBand =
    timeRemaining > 0.6 ? 'plenty of time left' : timeRemaining > 0.3 ? 'mid-game timing' : 'late-game time pressure';
  const signalReason = `Signals: ${momentumDirection} momentum, ${volatilityBand} volatility, ${timeBand}`;

  return { estimatedTrueProbability, reason: `${reason}. ${signalReason}` };
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
