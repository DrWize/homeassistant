// ====== washer.js — Washer module for Home Assistant dashboards ======
// Requires: shared.js loaded first (for THEME)

// ═══════════════════════════════════════════════════
// WASHER ENTITIES
// ═══════════════════════════════════════════════════
const WASHER_ENTITIES = [
  'sensor.washer_job_state','sensor.washer_machine_state','sensor.washer_completion_time',
  'sensor.washer_power','sensor.washer_energy','sensor.washer_water_consumption','sensor.washer_cycle_count',
  'select.washer_water_temperature','select.washer_spin_level','number.washer_rinse_cycles',
];

// ═══════════════════════════════════════════════════
// WASHER STATE
// ═══════════════════════════════════════════════════
const washerState = {
  isActive: false,
  jobState: 'none',
  machineState: 'stop',
  completionTime: null,
  temp: null,
  spin: null,
  rinses: null,
  power: null,
  energyTotal: null,
  waterTotal: null,
  cyclesTotal: null,
  stats: { monthly: [], yearTotals: {} },
};

let washerStatsMsgId = null;

// ═══════════════════════════════════════════════════
// WASHER INGEST
// ═══════════════════════════════════════════════════
function washerIngest(id, s) {
  if (id === 'sensor.washer_job_state') {
    washerState.jobState = s.state || 'none';
    washerState.isActive = s.state !== 'none' && s.state !== 'finish';
    renderWasher();
  }
  if (id === 'sensor.washer_machine_state') {
    washerState.machineState = s.state || 'stop';
    renderWasher();
  }
  if (id === 'sensor.washer_completion_time') {
    washerState.completionTime = s.state || null;
    renderWasher();
  }
  if (id === 'select.washer_water_temperature') {
    washerState.temp = s.state || null;
  }
  if (id === 'select.washer_spin_level') {
    washerState.spin = s.state || null;
  }
  if (id === 'number.washer_rinse_cycles') {
    washerState.rinses = s.state || null;
  }
  if (id === 'sensor.washer_power') {
    washerState.power = parseFloat(s.state) || 0;
  }
  if (id === 'sensor.washer_energy') {
    washerState.energyTotal = parseFloat(s.state) || null;
  }
  if (id === 'sensor.washer_water_consumption') {
    washerState.waterTotal = parseFloat(s.state) || null;
  }
  if (id === 'sensor.washer_cycle_count') {
    washerState.cyclesTotal = parseInt(s.state) || null;
  }
}

// ═══════════════════════════════════════════════════
// WASHER STATS PARSING
// ═══════════════════════════════════════════════════
function washerParseStats(result) {
  const energyStats = result['sensor.washer_energy'] || [];
  const waterStats  = result['sensor.washer_water_consumption'] || [];
  const cycleStats  = result['sensor.washer_cycle_count'] || [];
  const monthly = [];
  const yearTotals = {};
  energyStats.forEach((e, i) => {
    const d = new Date(e.start);
    const year = d.getFullYear();
    const monthLabel = d.toLocaleString('en', { month: 'short' });
    const energy = (e.change != null) ? e.change : (e.max - e.min);
    const w = waterStats[i];
    const water = w ? ((w.change != null) ? w.change : (w.max - w.min)) : 0;
    const c = cycleStats[i];
    const cycles = c ? Math.round((c.change != null) ? c.change : (c.max - c.min)) : null;
    monthly.push({ month: monthLabel, year, energy: Math.max(0, energy), water: Math.max(0, water), cycles });
    if (!yearTotals[year]) yearTotals[year] = { energy: 0, water: 0, cycles: 0 };
    yearTotals[year].energy += Math.max(0, energy);
    yearTotals[year].water  += Math.max(0, water);
    yearTotals[year].cycles += (cycles || 0);
  });
  washerState.stats = { monthly, yearTotals };
  renderWasher();
}

// ═══════════════════════════════════════════════════
// WASHER WS REQUESTS
// ═══════════════════════════════════════════════════
function washerRequestStats(wsSend, getMsgId) {
  washerStatsMsgId = getMsgId();
  wsSend({
    id: washerStatsMsgId, type: 'recorder/statistics_during_period',
    start_time: new Date(Date.now() - 730 * 86400000).toISOString(),
    statistic_ids: ['sensor.washer_energy', 'sensor.washer_water_consumption', 'sensor.washer_cycle_count'],
    period: 'month',
  });
}

function washerHandleResult(msg) {
  if (msg.id === washerStatsMsgId && msg.result) {
    washerParseStats(msg.result);
    return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════
// RENDER: WASHER ENVIRO BADGE
// ═══════════════════════════════════════════════════
function renderWasherBadge() {
  const w = washerState.isActive;
  const wb = document.getElementById('stat-washer');
  if (wb) {
    wb.textContent = w ? 'RUNNING' : 'IDLE';
    wb.className = `washer-badge ${w ? 'running' : ''}`;
  }
  const wbBtn = document.getElementById('washer-btn');
  if (wbBtn) {
    wbBtn.textContent = `WASHER: ${w ? 'RUNNING' : 'IDLE'}`;
    wbBtn.style.background = w ? 'var(--yellow)' : '#cc3333';
  }
}

// ═══════════════════════════════════════════════════
// RENDER: WASHER PANEL
// ═══════════════════════════════════════════════════
const WASHER_PHASES = ['weight_sensing','wash','rinse','spin','finish'];
const WASHER_PHASE_LABELS_DEFAULT = { weight_sensing:'WEIGH', wash:'WASH', rinse:'RINSE', spin:'SPIN', finish:'DONE' };
const WASHER_STATUS_DEFAULT = { idle:'IDLE', running:'RUNNING', paused:'PAUSED', complete:'COMPLETE' };

function renderWasher() {
  const panel = document.getElementById('washer-panel');
  if (!panel) return;

  const running = washerState.isActive;
  const job = washerState.jobState;
  const machine = washerState.machineState;
  const stats = washerState.stats;
  const wt = THEME.washer || {};
  const phaseLabels = wt.phaseLabels || WASHER_PHASE_LABELS_DEFAULT;
  const statusLabels = wt.statusLabels || WASHER_STATUS_DEFAULT;
  const title = wt.title || 'WASHER';
  const icon = wt.icon || '🫧';
  const lifetimeLabel = wt.lifetimeLabel || 'LIFETIME';
  const etaLabel = wt.etaLabel || 'remaining';

  // ── Status line ──
  let statusText = statusLabels.idle;
  if (running) {
    statusText = phaseLabels[job] || (job || statusLabels.running).toUpperCase();
    if (machine === 'pause') statusText = statusLabels.paused;
  } else if (job === 'finish') {
    statusText = statusLabels.complete;
  }

  // ── ETA countdown ──
  let etaHtml = '';
  if (running && washerState.completionTime) {
    const eta = new Date(washerState.completionTime);
    const now = new Date();
    const diffMin = Math.max(0, Math.round((eta - now) / 60000));
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    const timeStr = eta.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    etaHtml = `<span class="washer-eta">${h > 0 ? h + 'h ' : ''}${m}min ${etaLabel} (ETA ${timeStr})</span>`;
  }

  // ── Phase progress ──
  let phaseHtml = '';
  if (running || job === 'finish') {
    const currentIdx = WASHER_PHASES.indexOf(job);
    phaseHtml = '<div class="washer-phases">';
    WASHER_PHASES.forEach((p, i) => {
      const cls = i < currentIdx ? 'done' : i === currentIdx ? 'active' : '';
      phaseHtml += `<span class="washer-phase ${cls}">${phaseLabels[p]}</span>`;
      if (i < WASHER_PHASES.length - 1) phaseHtml += `<span class="washer-phase-sep ${i < currentIdx ? 'done' : ''}">━</span>`;
    });
    phaseHtml += '</div>';
  }

  // ── Current cycle settings ──
  let settingsHtml = '';
  if (running) {
    const parts = [];
    if (washerState.temp)   parts.push(`🌡 ${washerState.temp}°C`);
    if (washerState.spin)   parts.push(`🔄 ${washerState.spin} RPM`);
    if (washerState.rinses) parts.push(`💧 ${washerState.rinses} rinses`);
    if (washerState.power)  parts.push(`⚡ ${washerState.power}W`);
    settingsHtml = parts.length ? `<div class="washer-settings">${parts.join(' &nbsp;·&nbsp; ')}</div>` : '';
  }

  // ── Monthly stats table ──
  let monthlyHtml = '';
  if (stats.monthly.length > 0) {
    const years = Object.keys(stats.yearTotals).sort((a, b) => b - a);
    monthlyHtml = '<div class="washer-stats">';
    years.forEach(year => {
      const yearMonths = stats.monthly.filter(m => m.year === parseInt(year)).reverse();
      const yt = stats.yearTotals[year];
      const cycleStr = yt.cycles ? ` · ${yt.cycles} cycles` : '';
      monthlyHtml += `<div class="washer-year-header">${year} TOTAL: ${yt.energy.toFixed(1)} kWh · ${(yt.water / 1000).toFixed(1)} m³${cycleStr}</div>`;
      monthlyHtml += '<div class="washer-month-grid">';
      const maxE = Math.max(...yearMonths.map(m => m.energy), 1);
      yearMonths.forEach(m => {
        const barPct = (m.energy / maxE) * 100;
        monthlyHtml += `<div class="washer-month-row">
          <span class="washer-month-label">${m.month}</span>
          <div class="washer-month-bar-wrap">
            <div class="washer-month-bar" style="width:${barPct}%"></div>
          </div>
          <span class="washer-month-val">${m.cycles != null ? m.cycles + 'x' : ''}</span>
          <span class="washer-month-val">${m.energy.toFixed(1)} kWh</span>
          <span class="washer-month-val">${m.water.toFixed(0)} L</span>
        </div>`;
      });
      monthlyHtml += '</div>';
    });
    monthlyHtml += '</div>';
  }

  // ── Lifetime totals ──
  let lifetimeHtml = '';
  if (washerState.energyTotal != null || washerState.waterTotal != null) {
    const e = washerState.energyTotal != null ? `${washerState.energyTotal.toFixed(1)} kWh` : '--';
    const w = washerState.waterTotal != null ? `${(washerState.waterTotal / 1000).toFixed(1)} m³` : '--';
    const c = washerState.cyclesTotal != null ? ` · ${washerState.cyclesTotal} cycles` : '';
    lifetimeHtml = `<div class="washer-lifetime">${lifetimeLabel}: ${e} · ${w}${c}</div>`;
  }

  panel.innerHTML = `
    <div class="washer-header">
      <span class="washer-icon">${icon}</span>
      <span class="washer-title">${title}</span>
      <span class="washer-status ${running ? 'running' : job === 'finish' ? 'complete' : 'idle'}">${statusText}</span>
    </div>
    ${phaseHtml}
    ${etaHtml}
    ${settingsHtml}
    ${monthlyHtml}
    ${lifetimeHtml}
  `;
}
