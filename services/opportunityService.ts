export type SupportedSport = 'nba' | 'nhl' | 'nfl' | 'mlb';

export type OpportunityLabel = 'strong_buy' | 'watch' | 'ignore';

export interface StrategySettings {
  strongBuyEdgeThreshold: number;
  watchEdgeThreshold: number;
  minimumMomentum: number;
  maximumVolatility: number;
  minimumTimeRemaining: number;
  takeProfitPercent: number;
  stopLossPercent: number;
  maxHoldMinutes: number;
}

export const defaultStrategySettings: StrategySettings = {
  strongBuyEdgeThreshold: 0.06,
  watchEdgeThreshold: 0.02,
  minimumMomentum: -0.1,
  maximumVolatility: 0.85,
  minimumTimeRemaining: 0.15,
  takeProfitPercent: 0.03,
  stopLossPercent: 0.02,
  maxHoldMinutes: 5,
};

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
  momentum: number;
  timeRemaining: number;
  volatility: number;
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
  const seed = toDeterministicSeed(snapshot.id);
  const progress = toGameProgress(snapshot);
  const baseWave = Math.sin(seed * 0.05 + progress * 6);

  return clamp(baseWave, -1, 1);
}

function toVolatility(snapshot: MarketSnapshot): number {
  const seed = toDeterministicSeed(snapshot.id);
  const progress = toGameProgress(snapshot);
  const movementA = Math.abs(Math.sin(seed * 0.09 + progress * 5));
  const movementB = Math.abs(Math.cos(seed * 0.04 + progress * 3));

  return clamp((movementA + movementB) / 2, 0, 1);
}

function computeEstimatedProbability(snapshot: MarketSnapshot): {
  momentum: number;
  timeRemaining: number;
  volatility: number;
  estimatedTrueProbability: number;
  reason: string;
} {
  const scoreDiff = snapshot.currentScoreFor - snapshot.currentScoreAgainst;
  const progress = toGameProgress(snapshot);
  const implied = clamp(snapshot.impliedProbability, 0.01, 0.99);

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

  const extremityPenalty = Math.max(Math.abs(implied - 0.5) - 0.25, 0) * 0.1;
  adjustment *= 1 - extremityPenalty;

  const timeRemaining = toMockTimeRemaining(snapshot);
  const momentum = toMomentum(snapshot);
  const volatility = toVolatility(snapshot);

  const momentumAdjustment = 0.02 * momentum;
  const timeAdjustment = 0.015 * (timeRemaining - 0.5);
  const volatilityAdjustment = -0.02 * volatility;

  adjustment += momentumAdjustment + timeAdjustment + volatilityAdjustment;

  const estimatedTrueProbability = clamp(implied + adjustment, 0.01, 0.99);
  const momentumDirection = momentum >= 0 ? 'upward' : 'downward';
  const volatilityBand =
    volatility > 0.65 ? 'high' : volatility > 0.35 ? 'moderate' : 'low';
  const timeBand =
    timeRemaining > 0.6
      ? 'plenty of time left'
      : timeRemaining > 0.3
      ? 'mid-game timing'
      : 'late-game time pressure';
  const signalReason = `Signals: ${momentumDirection} momentum, ${volatilityBand} volatility, ${timeBand}`;

  return {
    momentum,
    timeRemaining,
    volatility,
    estimatedTrueProbability,
    reason: `${reason}. ${signalReason}`,
  };
}

function toLabel(edge: number, settings: StrategySettings): OpportunityLabel {
  if (edge >= settings.strongBuyEdgeThreshold) {
    return 'strong_buy';
  }

  if (edge >= settings.watchEdgeThreshold) {
    return 'watch';
  }

  return 'ignore';
}

function meetsExecutionFilters(
  opportunity: Pick<ScoredOpportunity, 'momentum' | 'volatility' | 'timeRemaining'>,
  settings: StrategySettings,
): boolean {
  return (
    opportunity.momentum >= settings.minimumMomentum &&
    opportunity.volatility <= settings.maximumVolatility &&
    opportunity.timeRemaining >= settings.minimumTimeRemaining
  );
}

const SPORT_PROFILES: Record<
  SupportedSport,
  {
    totalPeriods: number;
    periodLengthSeconds: number;
    scoreStdRange: [number, number];
  }
> = {
  nba: { totalPeriods: 4, periodLengthSeconds: 720, scoreStdRange: [84, 122] },
  nhl: { totalPeriods: 3, periodLengthSeconds: 1200, scoreStdRange: [1, 5] },
  nfl: { totalPeriods: 4, periodLengthSeconds: 900, scoreStdRange: [10, 34] },
  mlb: { totalPeriods: 9, periodLengthSeconds: 180, scoreStdRange: [1, 8] },
};

const TEAMS_BY_SPORT: Record<SupportedSport, string[]> = {
  nba: [
    'Celtics',
    'Knicks',
    'Bucks',
    'Heat',
    'Suns',
    'Nuggets',
    'Warriors',
    'Lakers',
    'Mavericks',
    'Timberwolves',
  ],
  nhl: ['Rangers', 'Bruins', 'Oilers', 'Canucks', 'Stars', 'Kings', 'Devils', 'Panthers'],
  nfl: ['Bills', 'Jets', 'Chiefs', 'Ravens', '49ers', 'Eagles', 'Lions', 'Bengals'],
  mlb: ['Dodgers', 'Padres', 'Yankees', 'Orioles', 'Braves', 'Astros', 'Mets', 'Phillies'],
};

const MARKET_VARIANTS = [
  'to win',
  'moneyline in regulation',
  'to complete comeback',
  'to close as favorite',
  'to win before final period',
];

const MARKET_UNIVERSE_SIZE = 220;
const TICK_SECONDS = 45;
const MIN_OPPORTUNITIES_PER_TICK = 24;
const MAX_OPPORTUNITIES_PER_TICK = 84;

function toUnitCycle(seed: number): number {
  return Math.abs(Math.sin(seed * 12.9898) * 43758.5453123) % 1;
}

function buildMarketUniverse(): MarketSnapshot[] {
  const sports: SupportedSport[] = ['nba', 'nhl', 'nfl', 'mlb'];
  const universe: MarketSnapshot[] = [];

  for (let index = 0; index < MARKET_UNIVERSE_SIZE; index += 1) {
    const sport = sports[index % sports.length];
    const teams = TEAMS_BY_SPORT[sport];
    const teamA = teams[(index * 3) % teams.length];
    const teamB = teams[(index * 3 + 5) % teams.length];
    const variant = MARKET_VARIANTS[index % MARKET_VARIANTS.length];
    const id = `${sport}-${teamA.toLowerCase()}-${teamB.toLowerCase()}-${variant
      .replace(/\s+/g, '-')
      .replace(/[^a-z-]/g, '')}-${index}`;
    const seed = toDeterministicSeed(id);
    const profile = SPORT_PROFILES[sport];

    const totalSeconds = profile.totalPeriods * profile.periodLengthSeconds;
    const initialElapsed = Math.floor(toUnitCycle(seed) * totalSeconds * 0.92);
    const period = Math.min(
      Math.floor(initialElapsed / profile.periodLengthSeconds) + 1,
      profile.totalPeriods,
    );
    const elapsedInPeriod = initialElapsed % profile.periodLengthSeconds;
    const secondsRemainingInPeriod = Math.max(
      1,
      Math.round(profile.periodLengthSeconds - elapsedInPeriod),
    );

    const [scoreMin, scoreMax] = profile.scoreStdRange;
    const scoreFor = Math.round(scoreMin + toUnitCycle(seed + 19) * (scoreMax - scoreMin));
    const scoreAgainst = Math.round(scoreMin + toUnitCycle(seed + 31) * (scoreMax - scoreMin));
    const impliedProbability = clamp(0.22 + toUnitCycle(seed + 47) * 0.56, 0.05, 0.95);

    universe.push({
      id,
      title: `${teamA} ${variant} vs ${teamB}`,
      sport,
      impliedProbability,
      currentScoreFor: scoreFor,
      currentScoreAgainst: scoreAgainst,
      period,
      secondsRemainingInPeriod,
      totalPeriods: profile.totalPeriods,
      periodLengthSeconds: profile.periodLengthSeconds,
    });
  }

  return universe;
}

export const mockMarketSnapshots: MarketSnapshot[] = buildMarketUniverse();

function toBoundedSignedDelta(seed: number, tick: number, scale: number): number {
  return Math.sin(seed * 0.017 + tick * 0.73) * scale;
}

function toSimulatedSnapshot(base: MarketSnapshot, tick: number): MarketSnapshot {
  const seed = toDeterministicSeed(base.id);
  const totalSeconds = Math.max(base.totalPeriods * base.periodLengthSeconds, 1);
  const baseElapsedSeconds =
    Math.max(base.period - 1, 0) * base.periodLengthSeconds +
    (base.periodLengthSeconds - base.secondsRemainingInPeriod);
  const elapsedSeconds = (baseElapsedSeconds + tick * TICK_SECONDS + (seed % 43)) % totalSeconds;
  const period = Math.min(Math.floor(elapsedSeconds / base.periodLengthSeconds) + 1, base.totalPeriods);
  const elapsedInPeriod = elapsedSeconds % base.periodLengthSeconds;
  const secondsRemainingInPeriod = Math.max(1, Math.round(base.periodLengthSeconds - elapsedInPeriod));

  const scoreNoiseFor = toBoundedSignedDelta(seed + 11, tick, base.sport === 'nba' ? 12 : base.sport === 'nfl' ? 7 : 3);
  const scoreNoiseAgainst = toBoundedSignedDelta(seed + 29, tick, base.sport === 'nba' ? 12 : base.sport === 'nfl' ? 7 : 3);
  const currentScoreFor = Math.max(0, Math.round(base.currentScoreFor + scoreNoiseFor));
  const currentScoreAgainst = Math.max(0, Math.round(base.currentScoreAgainst + scoreNoiseAgainst));

  const trueProbWave = toBoundedSignedDelta(seed + 37, tick, 0.12);
  const marketLagWave = toBoundedSignedDelta(seed + 71, tick + 2, 0.09);
  const impliedProbability = clamp(base.impliedProbability + marketLagWave, 0.03, 0.97);
  const syntheticTrueProbability = clamp(base.impliedProbability + trueProbWave, 0.03, 0.97);
  const repricedImplied = clamp(impliedProbability + (syntheticTrueProbability - impliedProbability) * 0.2, 0.03, 0.97);

  return {
    ...base,
    period,
    secondsRemainingInPeriod,
    currentScoreFor,
    currentScoreAgainst,
    impliedProbability: repricedImplied,
  };
}

function getOpportunitiesPerTick(tick: number): number {
  const span = MAX_OPPORTUNITIES_PER_TICK - MIN_OPPORTUNITIES_PER_TICK;
  const oscillation = (Math.sin(tick * 0.42) + 1) / 2;
  return MIN_OPPORTUNITIES_PER_TICK + Math.round(span * oscillation);
}

function getUniverseSliceForTick(tick: number): MarketSnapshot[] {
  const targetCount = getOpportunitiesPerTick(tick);
  const start = (tick * 11) % mockMarketSnapshots.length;

  return Array.from({ length: targetCount }, (_, offset) => {
    const index = (start + offset * 3) % mockMarketSnapshots.length;
    return mockMarketSnapshots[index];
  });
}

export function getScoredMockOpportunities(
  settings: StrategySettings = defaultStrategySettings,
  tick = 0,
): ScoredOpportunity[] {
  const selectedSnapshots = getUniverseSliceForTick(tick);
  const simulatedSnapshots = selectedSnapshots.map((snapshot) => toSimulatedSnapshot(snapshot, tick));
  return scoreOpportunities(simulatedSnapshots, settings);
}

export function scoreOpportunities(
  markets: MarketSnapshot[],
  settings: StrategySettings = defaultStrategySettings,
): ScoredOpportunity[] {
  return markets
    .map((market) => {
      const { momentum, timeRemaining, volatility, estimatedTrueProbability, reason } =
        computeEstimatedProbability(market);
      const edge = estimatedTrueProbability - market.impliedProbability;
      const baseLabel = toLabel(edge, settings);
      const executable = meetsExecutionFilters({ momentum, volatility, timeRemaining }, settings);
      const label = baseLabel === 'ignore' || executable ? baseLabel : 'watch';
      const filterReason = executable
        ? 'Execution filters passed'
        : `Execution filters failed (momentum ≥ ${(settings.minimumMomentum * 100).toFixed(
            1,
          )}%, volatility ≤ ${(settings.maximumVolatility * 100).toFixed(
            1,
          )}%, time remaining ≥ ${(settings.minimumTimeRemaining * 100).toFixed(1)}%)`;

      return {
        ...market,
        momentum,
        timeRemaining,
        volatility,
        estimatedTrueProbability,
        edge,
        label,
        reason: `${reason}. ${filterReason}. Exit plan: take profit +${(
          settings.takeProfitPercent * 100
        ).toFixed(1)}%, stop loss -${(settings.stopLossPercent * 100).toFixed(1)}%, max hold ${
          settings.maxHoldMinutes
        }m.`,
      };
    })
    .sort((a, b) => b.edge - a.edge);
}
