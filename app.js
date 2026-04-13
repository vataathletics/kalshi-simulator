const BASE_TIME = new Date('2026-01-01T14:00:00Z');

const mockTicks = [
  { offsetMin: 0, price: 100.0, signal: 'neutral', reason: 'no setup' },
  { offsetMin: 1, price: 100.5, signal: 'strong_buy', reason: 'momentum + orderflow' },
  { offsetMin: 2, price: 101.1, signal: 'neutral', reason: 'hold trend' },
  { offsetMin: 3, price: 101.7, signal: 'neutral', reason: 'hold trend' },
  { offsetMin: 4, price: 102.3, signal: 'neutral', reason: 'extended' },
  { offsetMin: 5, price: 103.6, signal: 'neutral', reason: 'profit stretch' },
  { offsetMin: 6, price: 102.8, signal: 'neutral', reason: 'retrace' },
  { offsetMin: 7, price: 101.8, signal: 'strong_buy', reason: 'oversold rebound + volume' },
  { offsetMin: 8, price: 101.0, signal: 'neutral', reason: 'chop' },
  { offsetMin: 9, price: 99.5, signal: 'neutral', reason: 'down move' },
  { offsetMin: 10, price: 98.8, signal: 'neutral', reason: 'sell pressure' },
  { offsetMin: 11, price: 99.4, signal: 'neutral', reason: 'attempt bounce' },
  { offsetMin: 12, price: 100.1, signal: 'strong_buy', reason: 'breakout retest' },
  { offsetMin: 13, price: 100.7, signal: 'neutral', reason: 'drift up' },
  { offsetMin: 14, price: 101.6, signal: 'neutral', reason: 'trend steady' },
  { offsetMin: 15, price: 100.9, signal: 'neutral', reason: 'pullback' },
  { offsetMin: 16, price: 101.0, signal: 'neutral', reason: 'range' },
  { offsetMin: 17, price: 101.2, signal: 'neutral', reason: 'range' },
  { offsetMin: 18, price: 101.4, signal: 'strong_buy', reason: 'new momentum leg' },
  { offsetMin: 19, price: 102.0, signal: 'neutral', reason: 'trend continue' },
  { offsetMin: 20, price: 102.9, signal: 'neutral', reason: 'trend continue' },
  { offsetMin: 21, price: 103.4, signal: 'neutral', reason: 'trend continue' },
  { offsetMin: 22, price: 102.6, signal: 'neutral', reason: 'cool off' }
];

const state = {
  tickIndex: 0,
  activePositions: [],
  closedTrades: [],
  realizedPnl: 0,
  winCount: 0,
  lossCount: 0,
  tradeCounter: 1,
  intervalId: null,
  config: {
    positionSize: 10,
    maxHoldMinutes: 5,
    tickMs: 350
  }
};

const els = {
  positionSize: document.getElementById('positionSize'),
  maxHoldMinutes: document.getElementById('maxHoldMinutes'),
  tickMs: document.getElementById('tickMs'),
  startBtn: document.getElementById('startBtn'),
  resetBtn: document.getElementById('resetBtn'),
  statusText: document.getElementById('statusText'),
  realizedPnl: document.getElementById('realizedPnl'),
  wins: document.getElementById('wins'),
  losses: document.getElementById('losses'),
  avgGain: document.getElementById('avgGain'),
  avgLoss: document.getElementById('avgLoss'),
  tickPointer: document.getElementById('tickPointer'),
  lastPrice: document.getElementById('lastPrice'),
  lastSignal: document.getElementById('lastSignal'),
  activePositionsBody: document.getElementById('activePositionsBody'),
  closedTradesBody: document.getElementById('closedTradesBody')
};

function money(value) {
  return `$${value.toFixed(2)}`;
}

function toTimestamp(offsetMin) {
  return new Date(BASE_TIME.getTime() + offsetMin * 60 * 1000);
}

function openPosition(tick) {
  const entryPrice = tick.price;
  const qty = state.config.positionSize / entryPrice;
  state.activePositions.push({
    id: state.tradeCounter++,
    entryPrice,
    quantity: qty,
    entryTime: toTimestamp(tick.offsetMin),
    entryReason: tick.reason,
    takeProfitPrice: entryPrice * 1.03,
    stopLossPrice: entryPrice * 0.98
  });
}

function closePosition(position, tick, exitRule) {
  const exitPrice = tick.price;
  const exitTime = toTimestamp(tick.offsetMin);
  const pnl = (exitPrice - position.entryPrice) * position.quantity;
  const durationMinutes = (exitTime.getTime() - position.entryTime.getTime()) / (1000 * 60);

  state.realizedPnl += pnl;
  if (pnl >= 0) {
    state.winCount += 1;
  } else {
    state.lossCount += 1;
  }

  state.closedTrades.push({
    id: position.id,
    entryTime: position.entryTime,
    exitTime,
    entryPrice: position.entryPrice,
    exitPrice,
    durationMinutes,
    exitRule,
    pnl
  });
}

function evaluateExits(tick) {
  const currentTime = toTimestamp(tick.offsetMin);
  const stillOpen = [];

  for (const position of state.activePositions) {
    const heldMinutes = (currentTime.getTime() - position.entryTime.getTime()) / (1000 * 60);
    let exitRule = null;

    if (tick.price >= position.takeProfitPrice) {
      exitRule = 'take_profit (+3%)';
    } else if (tick.price <= position.stopLossPrice) {
      exitRule = 'stop_loss (-2%)';
    } else if (heldMinutes >= state.config.maxHoldMinutes) {
      exitRule = `max_hold (${state.config.maxHoldMinutes}m)`;
    }

    if (exitRule) {
      closePosition(position, tick, exitRule);
    } else {
      stillOpen.push(position);
    }
  }

  state.activePositions = stillOpen;
}

function processTick() {
  if (state.tickIndex >= mockTicks.length) {
    stopSimulation('Finished all deterministic mock ticks.');
    return;
  }

  const tick = mockTicks[state.tickIndex];

  evaluateExits(tick);

  if (tick.signal === 'strong_buy') {
    openPosition(tick);
  }

  state.tickIndex += 1;
  render(tick);
}

function computeAverages() {
  const gains = state.closedTrades.filter((t) => t.pnl > 0).map((t) => t.pnl);
  const losses = state.closedTrades.filter((t) => t.pnl < 0).map((t) => t.pnl);

  const avgGain = gains.length ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
  const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;

  return { avgGain, avgLoss };
}

function render(lastTick = null) {
  const { avgGain, avgLoss } = computeAverages();

  els.realizedPnl.textContent = money(state.realizedPnl);
  els.wins.textContent = String(state.winCount);
  els.losses.textContent = String(state.lossCount);
  els.avgGain.textContent = money(avgGain);
  els.avgLoss.textContent = money(avgLoss);
  els.tickPointer.textContent = `${state.tickIndex}/${mockTicks.length}`;

  if (lastTick) {
    els.lastPrice.textContent = money(lastTick.price);
    els.lastSignal.textContent = `${lastTick.signal} (${lastTick.reason})`;
  }

  els.activePositionsBody.innerHTML = '';
  state.activePositions.forEach((p) => {
    const markPrice = lastTick ? lastTick.price : p.entryPrice;
    const unrealized = (markPrice - p.entryPrice) * p.quantity;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>#${p.id}</td>
      <td>${p.entryTime.toISOString()}</td>
      <td>${money(p.entryPrice)}</td>
      <td>${p.quantity.toFixed(4)}</td>
      <td>${p.entryReason}</td>
      <td class="${unrealized >= 0 ? 'pnl-pos' : 'pnl-neg'}">${money(unrealized)}</td>
    `;
    els.activePositionsBody.appendChild(row);
  });

  els.closedTradesBody.innerHTML = '';
  state.closedTrades
    .slice()
    .reverse()
    .forEach((t) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>#${t.id}</td>
        <td>${money(t.entryPrice)} @ ${t.entryTime.toISOString()}</td>
        <td>${money(t.exitPrice)} @ ${t.exitTime.toISOString()}</td>
        <td>${t.durationMinutes.toFixed(1)}m</td>
        <td>${t.exitRule}</td>
        <td class="${t.pnl >= 0 ? 'pnl-pos' : 'pnl-neg'}">${money(t.pnl)}</td>
      `;
      els.closedTradesBody.appendChild(row);
    });
}

function stopSimulation(message) {
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
  els.statusText.textContent = message;
}

function startSimulation() {
  if (state.intervalId) {
    return;
  }

  state.config.positionSize = Number(els.positionSize.value) || 10;
  state.config.maxHoldMinutes = Number(els.maxHoldMinutes.value) || 5;
  state.config.tickMs = Number(els.tickMs.value) || 350;

  els.statusText.textContent = 'Running deterministic mock simulation...';
  state.intervalId = setInterval(processTick, state.config.tickMs);
}

function resetSimulation() {
  if (state.intervalId) {
    clearInterval(state.intervalId);
  }

  state.tickIndex = 0;
  state.activePositions = [];
  state.closedTrades = [];
  state.realizedPnl = 0;
  state.winCount = 0;
  state.lossCount = 0;
  state.tradeCounter = 1;
  state.intervalId = null;

  els.statusText.textContent = 'Reset complete. Ready.';
  els.lastPrice.textContent = '-';
  els.lastSignal.textContent = '-';
  render();
}

els.startBtn.addEventListener('click', startSimulation);
els.resetBtn.addEventListener('click', resetSimulation);

render();
