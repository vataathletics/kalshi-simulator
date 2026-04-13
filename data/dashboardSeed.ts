export type Opportunity = {
  sport: string;
  matchup: string;
  currentUnderdogPrice: string;
  score: string;
  gameClock: string;
  signalStrength: "Low" | "Medium" | "High";
  recommendedEntry: string;
  recommendedTakeProfit: string;
  recommendedStopLoss: string;
  reasonCode: string;
};

export type OpenPosition = {
  market: string;
  entryPrice: string;
  currentPrice: string;
  unrealizedPnl: string;
  holdTime: string;
  exitTargets: string;
};

export type ClosedTrade = {
  market: string;
  entry: string;
  exit: string;
  pnl: string;
  reasonForEntry: string;
  reasonForExit: string;
};

export const opportunities: Opportunity[] = [
  {
    sport: "NBA",
    matchup: "LAL @ DEN",
    currentUnderdogPrice: "42¢",
    score: "89-95",
    gameClock: "Q4 6:21",
    signalStrength: "High",
    recommendedEntry: "40-43¢",
    recommendedTakeProfit: "58¢",
    recommendedStopLoss: "34¢",
    reasonCode: "PACE_SPIKE + FOUL_TROUBLE",
  },
  {
    sport: "NHL",
    matchup: "NYR @ BOS",
    currentUnderdogPrice: "36¢",
    score: "1-2",
    gameClock: "3rd 10:12",
    signalStrength: "Medium",
    recommendedEntry: "35-37¢",
    recommendedTakeProfit: "49¢",
    recommendedStopLoss: "30¢",
    reasonCode: "SHOT_VOLUME_EDGE",
  },
  {
    sport: "NFL",
    matchup: "BUF @ MIA",
    currentUnderdogPrice: "45¢",
    score: "20-24",
    gameClock: "Q4 8:03",
    signalStrength: "High",
    recommendedEntry: "44-46¢",
    recommendedTakeProfit: "61¢",
    recommendedStopLoss: "38¢",
    reasonCode: "REDZONE_REGRESSION",
  },
  {
    sport: "MLB",
    matchup: "ATL @ PHI",
    currentUnderdogPrice: "39¢",
    score: "3-4",
    gameClock: "B8 2 Outs",
    signalStrength: "Low",
    recommendedEntry: "38-40¢",
    recommendedTakeProfit: "50¢",
    recommendedStopLoss: "34¢",
    reasonCode: "BULLPEN_MISMATCH",
  },
];

export const openPositions: OpenPosition[] = [
  {
    market: "LAL to Win",
    entryPrice: "41¢",
    currentPrice: "47¢",
    unrealizedPnl: "+$36.00",
    holdTime: "00:14:22",
    exitTargets: "TP 58¢ / SL 34¢",
  },
  {
    market: "NYR to Win",
    entryPrice: "35¢",
    currentPrice: "33¢",
    unrealizedPnl: "-$12.50",
    holdTime: "00:08:05",
    exitTargets: "TP 49¢ / SL 30¢",
  },
  {
    market: "BUF to Win",
    entryPrice: "45¢",
    currentPrice: "52¢",
    unrealizedPnl: "+$28.75",
    holdTime: "00:05:11",
    exitTargets: "TP 61¢ / SL 38¢",
  },
];

export const closedTrades: ClosedTrade[] = [
  {
    market: "BKN to Win",
    entry: "33¢",
    exit: "46¢",
    pnl: "+$52.00",
    reasonForEntry: "LATE_PACE_ACCELERATION",
    reasonForExit: "TARGET_HIT",
  },
  {
    market: "DAL to Win",
    entry: "40¢",
    exit: "32¢",
    pnl: "-$31.00",
    reasonForEntry: "DEFENSE_MATCHUP_EDGE",
    reasonForExit: "STOP_LOSS_TRIGGERED",
  },
  {
    market: "MIN to Win",
    entry: "29¢",
    exit: "38¢",
    pnl: "+$27.00",
    reasonForEntry: "GOALIE_FATIGUE_SIGNAL",
    reasonForExit: "MANUAL_SCALE_OUT",
  },
];

export const strategySettings = [
  { label: "Signal model", value: "Momentum + Win-Prob Reversion v2" },
  { label: "Auto-entry", value: "Disabled" },
  { label: "Default position size", value: "$250" },
  { label: "Max concurrent positions", value: "5" },
];

export const riskControls = [
  { label: "Daily max drawdown", value: "$400" },
  { label: "Per-trade risk cap", value: "$75" },
  { label: "Kill switch", value: "Armed" },
  { label: "Latency guard", value: "250ms threshold" },
];

export const eventLog = [
  "[20:14:11] Opportunity detected: LAL @ DEN (HIGH).",
  "[20:14:35] Position opened: LAL to Win @ 41¢, size $600.",
  "[20:16:02] Risk check passed: portfolio drawdown -$18.50.",
  "[20:17:10] Stop adjusted: BUF to Win SL moved 37¢ -> 38¢.",
  "[20:18:21] Position closed: BKN to Win @ 46¢ (+$52.00).",
];
