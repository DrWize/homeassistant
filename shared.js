// ====== shared.js — Common code for all Home Assistant dashboards ======
// Requires: config.js loaded first (HA_WS, HA_TOKEN, HA_BASE, HA_HOST)
// Requires: THEME object defined in inline <script> before this file loads

// ═══════════════════════════════════════════════════
// DEV MODE — cache busting
// ═══════════════════════════════════════════════════
if (typeof DEV_MODE !== 'undefined' && DEV_MODE && !location.search.includes('_cb=')) {
  location.replace(location.pathname + '?_cb=' + Date.now());
}

// ═══════════════════════════════════════════════════
// FEATURE FLAGS
// ═══════════════════════════════════════════════════
const FEATURES = {
  washer: true,
};

// ═══════════════════════════════════════════════════
// ENTITY CONFIGURATION
// ═══════════════════════════════════════════════════
const rooms = [
  {
    id: 'living', name: 'Living Room',
    sensors: { temp: 'sensor.livingroomtemphum_air_temperature_2', humidity: 'sensor.livingroomtemphum_humidity_2', lux: null },
    lights: [
      { id: 'light.livingroomwindow', label: 'Window' },
      { id: 'light.livingroomsofa',   label: 'Sofa'   },
    ],
    powerSensors: ['sensor.livingroomwindow_power', 'sensor.livingroomsofa_power', 'sensor.livingroomwallplugtelevision_power']
  },
  {
    id: 'kitchen', name: 'Kitchen',
    sensors: { temp: 'sensor.kitchenmotiondetector_air_temperature', humidity: null, lux: 'sensor.kitchenmotiondetector_illuminance' },
    lights: [{ id: 'light.kitchenwindow', label: 'Window' }],
    powerSensors: ['sensor.kitchenwindow_power']
  },
  {
    id: 'bedroom', name: 'Bedroom',
    sensors: { temp: 'sensor.bedroomtemphum_air_temperature', humidity: 'sensor.bedroomtemphum_humidity', lux: null },
    lights: [
      { id: 'light.bedroomroof',     label: 'Ceiling'   },
      { id: 'light.bedroomwinleft',  label: 'Win Left'  },
      { id: 'light.bedroomwinright', label: 'Win Right' },
    ],
    powerSensors: ['sensor.bedroomroof_power', 'sensor.bedroomwinleft_power', 'sensor.bedroomwinright_power_2']
  },
  {
    id: 'guestbedroom', name: 'Guest Room',
    sensors: { temp: 'sensor.guestbedroomtemphum_air_temperature', humidity: 'sensor.guestbedroomtemphum_humidity', lux: null },
    lights: [
      { id: 'light.guestbedroomroof',   label: 'Ceiling' },
      { id: 'light.guestbedroomwindow', label: 'Window'  },
    ],
    powerSensors: ['sensor.guestbedroomroof_power', 'sensor.guestbedroomwindow_power', 'sensor.guestbedroomwallplugcomputer_power_2']
  },
  {
    id: 'balcony', name: 'Balcony',
    sensors: { temp: 'sensor.balconyluxtemp_air_temperature', humidity: null, lux: 'sensor.balconyluxtemp_illuminance' },
    lights: [{ id: 'light.balconyonoff', label: 'Deco Lights' }],
    powerSensors: ['sensor.balconyonoff_power']
  },
  {
    id: 'bathroom', name: 'Bathroom',
    sensors: { temp: 'sensor.bathroomtemphum_air_temperature', humidity: 'sensor.bathroomtemphum_humidity', lux: null },
    lights: [], powerSensors: []
  },
  {
    id: 'hall', name: 'Hall',
    sensors: { temp: 'sensor.motion_sensor_air_temperature', humidity: null, lux: 'sensor.motion_sensor_illuminance' },
    lights: [], powerSensors: []
  },
  {
    id: 'wardrobe', name: 'Wardrobe',
    sensors: { temp: 'sensor.wardrobetemphum_air_temperature', humidity: 'sensor.wardrobetemphum_humidity', lux: null },
    lights: [], powerSensors: []
  },
];

const DIMMABLE = new Set(['light.bedroomroof', 'light.guestbedroomroof']);

const MEDIA_PLAYER_ENTITIES = [
  { id: 'media_player.livingroom_arc', label: 'Living Room Arc', type: 'SONOS' },
  { id: 'media_player.kitchen',        label: 'Kitchen', type: 'SONOS' },
  { id: 'media_player.bathroom',       label: 'Bathroom', type: 'SONOS' },
  { id: 'media_player.bedroompb',      label: 'Bedroom', type: 'SONOS' },
  { id: 'media_player.sonos_move_small_bedroom', label: 'Guest Room Move', type: 'SONOS' },
  { id: 'media_player.living_room',     label: 'Living Room Apple TV', type: 'ATV' },
  { id: 'media_player.bedroom_4k_gen1', label: 'Bedroom Apple TV', type: 'ATV' },
];
const MEDIA_PLAYER_IDS = new Set(MEDIA_PLAYER_ENTITIES.map(e => e.id));

const LIGHT_ENTITIES = [
  'light.livingroomwindow','light.livingroomsofa','light.kitchenwindow',
  'light.bedroomroof','light.bedroomwinleft','light.bedroomwinright',
  'light.guestbedroomroof','light.guestbedroomwindow','light.balconyonoff',
];

const ALL_SENSOR_IDS = new Set([
  'sensor.livingroomtemphum_air_temperature_2','sensor.livingroomtemphum_humidity_2',
  'sensor.kitchenmotiondetector_air_temperature','sensor.kitchenmotiondetector_illuminance',
  'sensor.bedroomtemphum_air_temperature','sensor.bedroomtemphum_humidity',
  'sensor.guestbedroomtemphum_air_temperature','sensor.guestbedroomtemphum_humidity',
  'sensor.balconyluxtemp_air_temperature','sensor.balconyluxtemp_illuminance',
  'sensor.bathroomtemphum_air_temperature','sensor.bathroomtemphum_humidity',
  'sensor.motion_sensor_air_temperature','sensor.motion_sensor_illuminance',
  'sensor.wardrobetemphum_air_temperature','sensor.wardrobetemphum_humidity',
]);


const LC_POWER_SENSORS = [
  'sensor.kitchenwindow_power','sensor.livingroomwindow_power',
  'sensor.guestbedroomwindow_power','sensor.livingroomsofa_power',
  'sensor.bedroomwinleft_power','sensor.bedroomwinright_power_2',
  'sensor.balconyonoff_power','sensor.guestbedroomroof_power','sensor.bedroomroof_power',
  'sensor.livingroomwallplugtelevision_power','sensor.guestbedroomwallplugcomputer_power_2',
];

// ═══════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════
let liveData = {
  outsideTemp: null, elecNow: null, elecLast: null, elecNext: null,
  tempNext24h: [],
  lights: {}, brightness: {}, sensors: {},
  sun: { nextRising: null, nextSetting: null, elevation: null, state: null },
  weatherForecast: [], nordpool48h: [],
  sessions: {}, streamCount: 0, streamDirectPlay: 0, streamTranscode: 0,
  totalBandwidth: 0, lanBandwidth: 0, wanBandwidth: 0,
  power: {
    'sensor.kitchenwindow_power': null,
    'sensor.livingroomwindow_power': null,
    'sensor.guestbedroomwindow_power': null,
    'sensor.livingroomsofa_power': null,
    'sensor.bedroomwinleft_power': null,
    'sensor.bedroomwinright_power_2': null,
    'sensor.balconyonoff_power': null,
    'sensor.guestbedroomroof_power': null,
    'sensor.bedroomroof_power': null,
    'sensor.livingroomwallplugtelevision_power': null,
    'sensor.guestbedroomwallplugcomputer_power_2': null,
  },
  powerHistory: [],
  outsideLux: null,
  mediaPlayers: {},
};

let toastTimer;
let ws = null, msgId = 1, wsReady = false, reconnectTimer = null;
let weatherForecastMsgId = null;

let switcherTimer = null;

// ═══════════════════════════════════════════════════
// RENDER: ROOMS
// ═══════════════════════════════════════════════════
/** Render room cards with sensor readings, light switches, and dimmer sliders.
 *  Runs on both the Systems and Controls tabs (builds cards for each). */
function renderRooms() {
  const si = THEME.sensors || { temp: {icon:'🌡 ',unit:'°C'}, hum: {icon:'💧 ',unit:'%'}, lux: {icon:'☀ ',unit:' lx'}, power: {icon:'⚡ ',unit:' W'} };
  const dc = THEME.dimmerColors || { fill: '--orange', bg: '--grey' };
  const tabs = [THEME.tabIds[0], THEME.tabIds[1]];

  tabs.forEach(tab => {
    const el = document.getElementById(`rooms-${tab}`);
    if (!el) return;
    el.innerHTML = '';
    rooms.forEach(room => {
      const anyOn = room.lights.some(l => liveData.lights[l.id]);
      const card = document.createElement('div');
      card.className = `room-card ${anyOn ? 'lit' : ''}`;

      const tempVal = room.sensors.temp     ? liveData.sensors[room.sensors.temp]     ?? null : null;
      const humVal  = room.sensors.humidity ? liveData.sensors[room.sensors.humidity] ?? null : null;
      const luxVal  = room.sensors.lux      ? liveData.sensors[room.sensors.lux]      ?? null : null;

      let html = `
        <div class="room-header">
          <div class="room-name">${room.name}</div>
          <div class="room-lit-badge">ACTIVE</div>
        </div>
        <div class="room-body">
          <div class="sensor-row">
            <span class="sensor-chip ${tempVal !== null ? 'active temp' : ''}">
              ${si.temp.icon}${tempVal !== null ? Number(tempVal).toFixed(si.temp.decimals ?? 1) + si.temp.unit : '--'}
            </span>`;

      if (room.sensors.humidity !== null) {
        html += `<span class="sensor-chip ${humVal !== null ? 'active hum' : ''}">
          ${si.hum.icon}${humVal !== null ? Number(humVal).toFixed(si.hum.decimals ?? 0) + si.hum.unit : '--'}
        </span>`;
      }
      if (room.sensors.lux !== null) {
        html += `<span class="sensor-chip ${luxVal !== null ? 'active lux' : ''}">
          ${si.lux.icon}${luxVal !== null ? Number(luxVal).toFixed(si.lux.decimals ?? 0) + (si.lux.unit || ' lx') : '--'}
        </span>`;
      }
      if (room.powerSensors && room.powerSensors.length > 0 && tab === tabs[0]) {
        const powerSum = room.powerSensors.reduce((sum, sid) => sum + (liveData.power[sid] ?? 0), 0);
        const pi = si.power || { icon: '⚡ ', unit: ' W' };
        html += `<span class="sensor-chip ${powerSum > 0 ? 'active power' : ''}">
          ${pi.icon}${powerSum > 0 ? powerSum.toFixed(1) + pi.unit : '--'}
        </span>`;
      }
      html += `</div>`;

      if (room.lights.length > 0) {
        room.lights.forEach(light => {
          const on = liveData.lights[light.id] || false;
          if (tab === tabs[0]) {
            html += `<div class="light-row ${on ? 'on' : ''}">
              <span class="light-indicator"></span>
              <span class="light-label">${light.label}</span>
              <span class="light-state">${on ? 'ON' : 'OFF'}</span>
            </div>`;
          } else {
            const bri = liveData.brightness[light.id] ?? 255;
            const briPct = Math.round((bri / 255) * 100);
            const safeId = light.id.replace('.', '_');
            html += `<div class="light-row ${on ? 'on' : ''}" id="lrow-${safeId}">
              <span class="light-indicator"></span>
              <span class="light-label">${light.label}</span>
              <label class="lc-toggle">
                <input type="checkbox" ${on ? 'checked' : ''} onchange="toggleLight('${light.id}', this.checked)" aria-label="Toggle ${light.label}">
                <span class="lc-toggle-track"></span>
                <span class="lc-toggle-thumb"></span>
              </label>
            </div>`;
            if (DIMMABLE.has(light.id)) {
              html += `<div class="dimmer-row ${on ? 'visible' : ''}" id="dim-${safeId}">
                <span class="dimmer-label">DIM</span>
                <input type="range" class="lc-dimmer" min="1" max="255" value="${bri}"
                  oninput="dimLight('${light.id}', this.value)" aria-label="Brightness for ${light.label}"
                  style="background:linear-gradient(to right,var(${dc.fill}) 0%,var(${dc.fill}) ${briPct}%,var(${dc.bg}) ${briPct}%,var(${dc.bg}) 100%)">
                <span class="dimmer-pct" id="dpct-${safeId}">${briPct}%</span>
              </div>`;
            }
          }
        });

        const onCount = room.lights.filter(l => liveData.lights[l.id]).length;
        const pct = room.lights.length > 0 ? (onCount / room.lights.length) * 100 : 0;
        html += `<div class="load-bar-wrap">
          <div class="load-bar-label"><span>Light Load</span><span>${onCount}/${room.lights.length}</span></div>
          <div class="load-bar"><div class="load-bar-fill" style="width:${pct}%"></div></div>
        </div>`;
      }

      html += `</div>`; // room-body
      card.innerHTML = html;
      el.appendChild(card);
    });
  });

  const totalOn = Object.values(liveData.lights).filter(Boolean).length;
  (THEME.lightCountEls || ['stat-lights']).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = totalOn;
  });
}

// ═══════════════════════════════════════════════════
// TOGGLE / DIM
// ═══════════════════════════════════════════════════
/**
 * Toggle a light on/off — updates local state immediately, then sends HA service call.
 * @param {string} entityId - e.g. 'light.living_room_window'
 * @param {boolean} on - true to turn on, false to turn off
 */
function toggleLight(entityId, on) {
  liveData.lights[entityId] = on;
  const safeId = entityId.replace('.', '_');
  const dimWrap = document.getElementById(`dim-${safeId}`);
  const row = document.getElementById(`lrow-${safeId}`);
  if (dimWrap) dimWrap.classList.toggle('visible', on);
  if (row) row.classList.toggle('on', on);
  const sep = THEME.toastArrow || '→';
  showToast(`${entityId.split('.')[1]} ${sep} ${on ? 'ON' : 'OFF'}`);
  if (THEME.onToggleLight) THEME.onToggleLight(entityId, on);
  renderRooms();
  haCall('light', on ? 'turn_on' : 'turn_off', { entity_id: entityId });
}

function nightProtocol() {
  const skip = 'light.balconyonoff';
  LIGHT_ENTITIES.filter(id => id !== skip).forEach(id => {
    if (liveData.lights[id]) toggleLight(id, false);
  });
  if (THEME.onNightProtocol) THEME.onNightProtocol();
  showToast(THEME.nightToast || 'ALL LIGHTS OFF');
}

/**
 * Set light brightness — updates local state and slider UI, then sends HA service call.
 * @param {string} entityId - e.g. 'light.living_room_window'
 * @param {number|string} value - brightness 0-255 (HA native range)
 */
function dimLight(entityId, value) {
  const bri = parseInt(value);
  liveData.brightness[entityId] = bri;
  const pct = Math.round((bri / 255) * 100);
  const safeId = entityId.replace('.', '_');
  const lbl = document.getElementById(`dpct-${safeId}`);
  if (lbl) lbl.textContent = pct + '%';
  const dc = THEME.dimmerColors || { fill: '--orange', bg: '--grey' };
  const slider = document.querySelector(`#dim-${safeId} .lc-dimmer`);
  if (slider) slider.style.background =
    `linear-gradient(to right,var(${dc.fill}) 0%,var(${dc.fill}) ${pct}%,var(${dc.bg}) ${pct}%,var(${dc.bg}) 100%)`;
  const sep = THEME.toastArrow || '→';
  showToast(`${entityId.split('.')[1]} ${sep} ${pct}%`);
  haCall('light', 'turn_on', { entity_id: entityId, brightness: bri });
}

// ═══════════════════════════════════════════════════
// RENDER: ENVIRO / SUN / WEATHER / NORDPOOL / TEMP
// ═══════════════════════════════════════════════════
function renderEnviro() {
  const t = liveData.outsideTemp;
  const e = liveData.elecNow;
  const tStr = t !== null ? `${t.toFixed(1)} °C` : '-- °C';
  const eStr = e !== null ? `${e.toFixed(3)} SEK` : '-- SEK';
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('stat-temp', tStr);
  setEl('stat-elec', eStr);
  setEl('sb-temp', tStr);
  setEl('sb-elec', eStr);
  if (FEATURES.washer && typeof renderWasherBadge === 'function') renderWasherBadge();
}

function renderSun() {
  const fmt = iso => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };
  const { nextRising, nextSetting, elevation, state } = liveData.sun;
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('d-sunrise', fmt(nextRising));
  setEl('d-sunset', fmt(nextSetting));
  setEl('d-elevation', elevation !== null ? `${Number(elevation).toFixed(1)}°` : '--°');

  if (nextRising && nextSetting) {
    const diffMs = Math.abs(new Date(nextSetting) - new Date(nextRising));
    const h = Math.floor(diffMs / 3600000);
    const m = Math.round((diffMs % 3600000) / 60000);
    setEl('d-daylight', `${h}h ${m}m`);
  }

  const sunEl = document.getElementById('d-sunstate');
  const statEl = document.getElementById('stat-sun');
  if (state === 'above_horizon') {
    if (sunEl) { sunEl.textContent = '☀ ABOVE'; sunEl.style.color = 'var(--yellow)'; }
    if (statEl) { statEl.textContent = '☀ ABOVE'; statEl.style.color = 'var(--yellow)'; }
  } else if (state === 'below_horizon') {
    if (sunEl) { sunEl.textContent = '☽ BELOW'; sunEl.style.color = 'var(--blue)'; }
    if (statEl) { statEl.textContent = '☽ BELOW'; statEl.style.color = 'var(--blue)'; }
  }
}

function renderWeather() {
  const el = document.getElementById('d-weather');
  if (!el) return;
  const fc = liveData.weatherForecast;
  if (!fc.length) { el.innerHTML = '<div style="color:var(--grey-mid);font-size:0.75rem;padding:10px;">AWAITING DATA...</div>'; return; }

  const condIcon = c => {
    c = (c || '').toLowerCase();
    if (c.includes('clear') || c.includes('sunny'))    return '☀';
    if (c.includes('partly'))                           return '⛅';
    if (c.includes('cloud') || c.includes('overcast')) return '☁';
    if (c.includes('rain')  || c.includes('drizzle'))  return '🌧';
    if (c.includes('snow'))                             return '❄';
    if (c.includes('thunder') || c.includes('storm'))  return '⚡';
    if (c.includes('fog')   || c.includes('mist'))     return '🌫';
    if (c.includes('wind'))                             return '💨';
    return '—';
  };

  const slots = fc.filter((_, i) => i % 3 === 0).slice(0, 8);
  let html = '';
  slots.forEach((s, i) => {
    const d   = new Date(s.datetime);
    const hh  = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    const t   = s.temperature ?? '--';
    html += `<div class="weather-card ${i === 0 ? 'now' : ''}">
      <div class="wc-time">${hh}</div>
      <div class="wc-icon">${condIcon(s.condition)}</div>
      <div class="wc-temp">${t}°</div>
      ${s.precipitation ? `<div class="wc-detail">${s.precipitation}mm</div>` : ''}
      ${s.wind_speed    ? `<div class="wc-wind">${s.wind_speed}m/s</div>`     : ''}
    </div>`;
  });
  el.innerHTML = html;
}

function renderNordpool48h() {
  const chartEl = document.getElementById('d-np48');
  const xEl     = document.getElementById('d-np48-xaxis');
  const mmEl    = document.getElementById('d-np48-minmax');
  if (!chartEl) return;
  const prices  = liveData.nordpool48h;
  if (!prices.length) return;

  const vals  = prices.map(p => p.value);
  const min   = Math.min(...vals);
  const max   = Math.max(...vals);
  const range = max - min || 0.01;
  const now   = new Date();

  let midnightIdx = -1;
  for (let i = 1; i < prices.length; i++) {
    if (new Date(prices[i].start).getDate() !== new Date(prices[i-1].start).getDate()) {
      midnightIdx = i; break;
    }
  }

  let html = '';
  prices.forEach((p, i) => {
    const d = new Date(p.start);
    const isCurrent = d.getHours() === now.getHours() && d.getDate() === now.getDate();
    const barH = Math.round(((p.value - min) / range) * 80 + 8);
    const col = p.value > 1.5 ? 'var(--red)' : p.value > 0.8 ? 'var(--yellow)' : 'var(--teal)';
    const finalCol = isCurrent ? 'var(--orange)' : col;
    const time = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    html += `<div class="np48-bar-wrap" role="img" tabindex="0" onmouseenter="showToast('${time}: ${p.value.toFixed(3)} SEK/kWh')">
      ${i === midnightIdx ? '<div class="np48-midnight"></div>' : ''}
      <div class="np48-bar ${isCurrent ? 'current' : ''}" style="height:${barH}px;background:${finalCol};"></div>
    </div>`;
  });
  chartEl.innerHTML = html;

  if (xEl) {
    let xHtml = '';
    for (let i = 0; i < Math.min(prices.length, 48); i += 6) {
      if (prices[i]) xHtml += `<span>${new Date(prices[i].start).getHours().toString().padStart(2,'0')}:00</span>`;
    }
    xEl.innerHTML = xHtml;
  }
  if (mmEl) mmEl.textContent = `MIN: ${min.toFixed(3)}  —  MAX: ${max.toFixed(3)} SEK/kWh`;
}

function renderNordpoolBars() {
  const vals = [liveData.elecLast, liveData.elecNow, liveData.elecNext];
  const ids  = [['np-last-bar','np-last-val'],['np-now-bar','np-now-val'],['np-next-bar','np-next-val']];
  const maxV = Math.max(...vals.filter(v => v !== null), 0.01);
  vals.forEach((v, i) => {
    const bar = document.getElementById(ids[i][0]);
    const val = document.getElementById(ids[i][1]);
    if (!bar || !val) return;
    if (v === null) { val.textContent = '--'; return; }
    const pct = (v / (maxV * 1.2)) * 100;
    const cls = v > 1.5 ? 'high' : v > 0.8 ? 'mid' : 'low';
    bar.style.width = pct + '%';
    bar.className   = `data-bar-fill ${cls}`;
    val.textContent = v.toFixed(3);
    val.className   = `data-val ${cls}`;
  });
}

function renderTempGraph() {
  const el    = document.getElementById('d-tempgraph');
  const mmEl  = document.getElementById('d-tempminmax');
  if (!el) return;
  const temps = liveData.tempNext24h;
  if (!temps.length) return;

  const min   = Math.min(...temps);
  const max   = Math.max(...temps);
  const range = max - min || 1;
  const accentVar = (THEME.dimmerColors && THEME.dimmerColors.fill) || '--orange';

  let html = '';
  temps.forEach((t, i) => {
    const h = ((t - min) / range) * 80 + 10;
    const col = i === 0 ? `var(${accentVar})` : 'var(--grey-mid)';
    html += `<div class="temp-bar" role="img" tabindex="0" style="height:${h}%;background:${col};"
      onmouseenter="showToast('H+${i}: ${t}°C')"></div>`;
  });
  el.innerHTML = html;
  if (mmEl) mmEl.textContent = `MIN: ${min}°C  —  MAX: ${max}°C`;
}

// ═══════════════════════════════════════════════════
// CLOCK
// ═══════════════════════════════════════════════════
function updateClock() {
  const now    = new Date();
  const days   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const clk = document.getElementById(THEME.clockEl || 'clock');
  const dte = document.getElementById(THEME.dateEl || 'date-display');
  if (clk) clk.textContent = now.toTimeString().slice(0, 8);
  if (dte) dte.textContent = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  if (THEME.onClockUpdate) THEME.onClockUpdate(now);
}

// ═══════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════
function switchTab(id) {
  const tabIds = THEME.tabIds;
  document.querySelectorAll('[role="tab"]').forEach((b, i) => {
    if (i >= tabIds.length) return;
    const isActive = tabIds[i] === id;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', isActive);
    b.setAttribute('tabindex', isActive ? '0' : '-1');
  });
  if (THEME.onSwitchTab) THEME.onSwitchTab(id, tabIds);
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.setAttribute('role', 'tabpanel');
  });
  const panel = document.getElementById(`page-${id}`);
  if (panel) { panel.classList.add('active'); panel.focus(); }
}

// ═══════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

// ═══════════════════════════════════════════════════
// CONNECTION STATUS
// ═══════════════════════════════════════════════════
/** Day/night mode override. 'auto' = follow sun.sun, 'night' = forced dark, 'day' = forced light */
let dayNightMode = localStorage.getItem('ha_daynight') || 'auto';

function updateDayNight() {
  let night;
  if (dayNightMode === 'auto') {
    night = liveData.sun.state === 'below_horizon';
  } else {
    night = dayNightMode === 'night';
  }
  document.body.classList.toggle('night-mode', night);
  // Update toggle button label if present
  const btn = document.getElementById('daynight-btn');
  if (btn) {
    const labels = { auto: '☼ AUTO', night: '☽ DARK', day: '☀ LIGHT' };
    btn.textContent = labels[dayNightMode];
  }
}

/** Cycle day/night mode: auto → night → day → auto */
function toggleDayNight() {
  const cycle = { auto: 'night', night: 'day', day: 'auto' };
  dayNightMode = cycle[dayNightMode] || 'auto';
  localStorage.setItem('ha_daynight', dayNightMode);
  updateDayNight();
}

function setConnStatus(status) {
  const dot = document.getElementById('conn-dot');
  const lbl = document.getElementById('conn-label');
  const ftr = document.getElementById('footer-status');
  if (dot) dot.className = `status-dot ${status}`;
  if (status === 'online') {
    if (lbl) lbl.textContent = THEME.connOnline;
    if (ftr) ftr.textContent = THEME.footerOnline || '';
  } else if (status === 'connecting') {
    if (lbl) lbl.textContent = THEME.connConnecting;
    if (ftr) ftr.textContent = THEME.footerConnecting || '';
  } else {
    if (lbl) lbl.textContent = THEME.connOffline;
    if (ftr) ftr.textContent = THEME.footerOffline || '';
  }
}

// ═══════════════════════════════════════════════════
// RENDER: MEDIA (Plex)
// ═══════════════════════════════════════════════════
function renderMedia() {
  const sc = document.getElementById('m-stream-count');
  const dp = document.getElementById('m-direct-play');
  const tr = document.getElementById('m-transcode');
  const bw = document.getElementById('m-bandwidth');
  const lw = document.getElementById('m-lan-wan');
  if (sc) sc.textContent = liveData.streamCount;
  if (dp) dp.textContent = liveData.streamDirectPlay;
  if (tr) tr.textContent = liveData.streamTranscode;
  const sessionBwSum = Object.values(liveData.sessions).reduce((s, sess) => s + (parseFloat(sess.bandwidth) || 0), 0) / 1000;
  const displayBw = liveData.totalBandwidth > 0 ? liveData.totalBandwidth : sessionBwSum;
  if (bw) bw.textContent = `${displayBw.toFixed(2)} Mbps`;
  if (lw) lw.textContent = `${liveData.lanBandwidth.toFixed(2)} / ${liveData.wanBandwidth.toFixed(2)} Mbps`;

  const grid = document.getElementById('sessions-grid');
  if (!grid) return;

  const sessions = Object.entries(liveData.sessions);
  if (sessions.length === 0) { grid.innerHTML = ''; updateNoMediaMsg(); return; }

  const haBase = HA_BASE;
  let html = '';
  sessions.forEach(([num, s]) => {
    const posterUrl = s.image_url ? haBase + s.image_url : null;
    const isEpisode = s.media_type === 'episode';
    const pct = Math.min(100, Math.max(0, s.progress || 0));
    const isTranscode = (s.transcode_decision || '').includes('transcode');
    const showLine = isEpisode && s.grandparent_title
      ? `${s.grandparent_title} · ${s.parent_title}`
      : (s.year ? String(s.year) : '');
    const displayTitle = isEpisode ? s.title : (s.grandparent_title || s.title);

    html += `<div class="session-card ${s.state}">
      <div class="session-poster">
        ${posterUrl
          ? `<img src="${posterUrl}" alt="poster" onerror="this.parentElement.innerHTML='<div class=\\"session-poster-ph\\">▶</div>'">`
          : '<div class="session-poster-ph">▶</div>'}
      </div>
      <div class="session-info">
        ${showLine ? `<div class="session-show">${showLine}</div>` : ''}
        <div class="session-title">${displayTitle || s.full_title || 'Unknown'}</div>
        <div class="session-badges">
          ${s.video_resolution ? `<span class="sbadge orange">${s.video_resolution}</span>` : ''}
          ${s.video_codec      ? `<span class="sbadge">${s.video_codec.toUpperCase()}</span>` : ''}
          ${s.audio_codec      ? `<span class="sbadge">${s.audio_codec.toUpperCase()}</span>` : ''}
          <span class="sbadge ${isTranscode ? 'amber' : 'hi'}">${(s.transcode_decision || 'DIRECT PLAY').toUpperCase()}</span>
          <span class="sbadge ${s.location === 'lan' ? 'hi' : 'amber'}">${(s.location || 'LAN').toUpperCase()}</span>
          ${s.content_rating ? `<span class="sbadge">${s.content_rating}</span>` : ''}
        </div>
        ${s.summary ? `<div class="session-summary">${s.summary}</div>` : ''}
        <div class="session-user" style="margin-top:4px;">
          <div class="session-avatar">
            ${s.user_thumb ? `<img src="${s.user_thumb}" alt="avatar">` : ''}
          </div>
          <span>${s.user.toUpperCase()}</span>
          <span style="opacity:0.4;">·</span>
          <span>${s.player || s.platform}</span>
          ${s.state === 'paused' ? '<span style="color:var(--blue);margin-left:6px;">⏸ Paused</span>' : ''}
        </div>
        <div class="session-progress-wrap">
          <div class="session-progress-label">
            <span>${s.duration || '--'}</span>
            <span>${pct}%</span>
            <span>ETA ${s.stream_eta || '--'}</span>
          </div>
          <div class="session-progress-bar">
            <div class="session-progress-fill ${s.state === 'paused' ? 'paused' : ''}" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
    </div>`;
  });
  grid.innerHTML = html;
  updateNoMediaMsg();
}

// ═══════════════════════════════════════════════════
// MEDIA PLAYERS (Sonos / Apple TV)
// ═══════════════════════════════════════════════════
function fmtDuration(sec) {
  if (!sec || sec <= 0) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
               : `${m}:${String(s).padStart(2,'0')}`;
}

function renderMediaPlayers() {
  const grid = document.getElementById('mp-grid');
  if (!grid) return;

  const players = Object.entries(liveData.mediaPlayers);
  if (players.length === 0) { grid.innerHTML = ''; updateNoMediaMsg(); return; }

  const haBase = HA_BASE;
  let html = '';
  players.forEach(([id, p]) => {
    const artUrl = p.art ? haBase + p.art : null;
    const volPct = p.volume !== null ? Math.round(p.volume * 100) : null;
    const typeIcon = p.type === 'ATV' ? '📺' : '🔊';
    const stateLabel = p.state === 'paused' ? '⏸ Paused' : '▶ Playing';
    const ctBadge = p.contentType ? p.contentType.toUpperCase() : '';
    const artistLine = p.artist || '';
    const albumLine = p.album || '';
    const appLine = p.app || '';
    const dur = fmtDuration(p.duration);
    const pos = fmtDuration(p.position);
    const progressPct = (p.duration && p.position) ? Math.min(100, (p.position / p.duration) * 100) : null;

    let extraBadges = '';
    if (p.shuffle) extraBadges += '<span class="mp-badge">SHFL</span>';
    if (p.repeat && p.repeat !== 'off') extraBadges += `<span class="mp-badge">RPT${p.repeat === 'one' ? '1' : ''}</span>`;
    if (p.muted) extraBadges += '<span class="mp-badge muted">MUTED</span>';

    html += `<div class="mp-card ${p.state}">
      <div class="mp-art">
        ${artUrl
          ? `<img src="${artUrl}" alt="art" onerror="this.parentElement.innerHTML='<div class=\\'mp-art-ph\\'>${typeIcon}</div>'">`
          : `<div class="mp-art-ph">${typeIcon}</div>`}
      </div>
      <div class="mp-info">
        <div class="mp-name">
          <span class="mp-state-dot"></span>
          ${p.friendly || p.label}
          <span class="mp-type">${p.type}</span>
          ${ctBadge ? `<span class="mp-type">${ctBadge}</span>` : ''}
        </div>
        ${p.title ? `<div class="mp-title">${p.title}</div>` : `<div class="mp-title" style="color:var(--grey-mid);">--</div>`}
        ${artistLine ? `<div class="mp-artist">${artistLine}</div>` : ''}
        ${albumLine ? `<div class="mp-artist" style="color:var(--grey-mid);">${albumLine}</div>` : ''}
        ${appLine && appLine !== artistLine ? `<div class="mp-source">${appLine}</div>` : ''}
        <div class="mp-source">${stateLabel}${p.source ? ' · ' + p.source : ''}${extraBadges ? ' ' + extraBadges : ''}</div>
        ${progressPct !== null ? `<div class="mp-progress-wrap">
          <div class="mp-progress-bar"><div class="mp-progress-fill" style="width:${progressPct.toFixed(1)}%"></div></div>
          <div class="mp-progress-label"><span>${pos || '--'}</span><span>${dur || '--'}</span></div>
        </div>` : ''}
        ${volPct !== null ? `<div class="mp-vol-wrap">
          <span class="mp-vol-label">VOL</span>
          <div class="mp-vol-bar"><div class="mp-vol-fill" style="width:${volPct}%"></div></div>
          <span class="mp-vol-pct">${volPct}%</span>
        </div>` : ''}
      </div>
    </div>`;
  });
  grid.innerHTML = html;
  updateNoMediaMsg();
}

function updateNoMediaMsg() {
  const el = document.getElementById('no-media-msg');
  if (!el) return;
  const hasPlex = Object.keys(liveData.sessions).length > 0;
  const hasPlayers = Object.keys(liveData.mediaPlayers).length > 0;
  el.style.display = (hasPlex || hasPlayers) ? 'none' : '';
}

// ═══════════════════════════════════════════════════
// ENERGY
// ═══════════════════════════════════════════════════
function lcTotalPower() {
  return LC_POWER_SENSORS.reduce((s, id) => s + (liveData.power[id] ?? 0), 0);
}

function lcUpdatePowerHistory() {
  const w = lcTotalPower();
  const p = liveData.elecNow || 0;
  liveData.powerHistory.push({ time: Date.now(), watts: w, price: p });
  if (liveData.powerHistory.length > 48) liveData.powerHistory.shift();
}

function renderLcEnergy() {
  const chartEl = document.getElementById('lc-energy-chart');
  const xEl     = document.getElementById('lc-energy-xaxis');
  const mmEl    = document.getElementById('lc-energy-minmax');
  const totalEl = document.getElementById('lc-energy-total');
  const costEl  = document.getElementById('lc-energy-cost');
  const priceEl = document.getElementById('lc-energy-price');
  if (!chartEl) return;

  const watts = lcTotalPower();
  const price = liveData.elecNow || 0;
  if (totalEl) totalEl.textContent = watts.toFixed(1) + ' W';
  if (costEl)  costEl.textContent  = ((watts / 1000) * price).toFixed(3) + ' SEK/h';
  if (priceEl) priceEl.textContent = price.toFixed(3) + ' SEK/kWh';

  const history = liveData.powerHistory;
  const prices  = liveData.nordpool48h;

  if (prices.length) {
    const now = new Date();
    const histMax = history.length ? Math.max(...history.map(h => h.watts)) : 0;
    const maxW = Math.max(histMax, watts * 1.2, 10);
    const maxP = Math.max(...prices.map(p => p.value), 0.01);
    let barHtml = '';
    prices.slice(0, 24).forEach((p, i) => {
      const d = new Date(p.start);
      const isCurrent = d.getHours() === now.getHours() && d.getDate() === now.getDate();
      const histEntry = history.find(h => {
        const hd = new Date(h.time);
        return hd.getHours() === d.getHours() && hd.getDate() === d.getDate();
      });
      const barWatts = isCurrent ? watts : (histEntry ? histEntry.watts : 0);
      const ph = (p.value / maxP) * 100;
      const wh = (barWatts / maxW) * 100;
      const pc = p.value > 1.5 ? 'var(--red)' : p.value > 0.8 ? 'var(--yellow)' : 'var(--teal)';
      const tip = `${d.getHours().toString().padStart(2,'0')}:00 — ${p.value.toFixed(3)} SEK${barWatts > 0 ? ' · ' + barWatts.toFixed(1) + 'W' : ''}`;
      barHtml += `<div class="lc-energy-bar ${isCurrent ? 'current' : ''}"
        onmouseenter="showToast('${tip}')" role="img" tabindex="0">
        <div class="lc-energy-bar-price" style="height:${ph}%;background:${pc};"></div>
        ${wh > 0 ? `<div class="lc-energy-bar-power" style="height:${wh}%;"></div>` : ''}
      </div>`;
    });
    chartEl.innerHTML = barHtml;
    if (mmEl) mmEl.textContent = '24h price + load (W)';
    let xh = '';
    for (let i = 0; i < 24; i += 6) {
      if (prices[i]) xh += `<span>${new Date(prices[i].start).getHours().toString().padStart(2,'0')}:00</span>`;
    }
    if (xEl) xEl.innerHTML = xh;
    return;
  }

  if (history.length < 2) {
    chartEl.innerHTML = '<div style="color:var(--grey-mid);font-size:0.75rem;align-self:center;">Awaiting Nordpool data...</div>';
    return;
  }

  const wVals = history.map(h => h.watts);
  const maxW  = Math.max(...wVals, 1);
  const maxP  = Math.max(...history.map(h => h.price), 0.01);
  let html = '';
  history.forEach((h, i) => {
    const isLast = i === history.length - 1;
    const wh = (h.watts / maxW) * 100;
    const ph = (h.price / maxP) * 100;
    const pc = h.price > 1.5 ? 'var(--red)' : h.price > 0.8 ? 'var(--yellow)' : 'var(--teal)';
    const t = new Date(h.time).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    html += `<div class="lc-energy-bar ${isLast ? 'current' : ''}"
      onmouseenter="showToast('${t} — ${h.watts.toFixed(1)}W · ${h.price.toFixed(3)} SEK')"
      role="img" tabindex="0">
      <div class="lc-energy-bar-price" style="height:${ph}%;background:${pc};"></div>
      <div class="lc-energy-bar-power" style="height:${wh}%;"></div>
    </div>`;
  });
  chartEl.innerHTML = html;
  if (mmEl) mmEl.textContent = 'Max: ' + maxW.toFixed(1) + 'W';
  if (xEl) xEl.innerHTML = '<span>Oldest</span><span>Latest</span>';
}

// ═══════════════════════════════════════════════════
// HA WEBSOCKET
// ═══════════════════════════════════════════════════
/**
 * Connect to Home Assistant via WebSocket.
 * Handles the full lifecycle: auth handshake → initial state fetch → real-time updates.
 * Auto-reconnects after 5 seconds on disconnect.
 *
 * Message flow:
 *   1. HA sends 'auth_required' → we reply with access token
 *   2. HA sends 'auth_ok'       → we request all states + subscribe to changes + fetch forecasts
 *   3. HA sends 'result'        → initial state dump (array) or service call responses
 *   4. HA sends 'event'         → real-time state_changed events (one entity at a time)
 */
function haConnect() {
  setConnStatus('connecting');
  ws = new WebSocket(HA_WS);

  ws.onopen = () => {};

  ws.onmessage = evt => {
    const msg = JSON.parse(evt.data);

    // Step 1: HA asks for authentication
    if (msg.type === 'auth_required') {
      ws.send(JSON.stringify({ type: 'auth', access_token: HA_TOKEN }));

    // Step 2: Auth succeeded — fetch initial data and subscribe to updates
    } else if (msg.type === 'auth_ok') {
      wsReady = true;
      setConnStatus('online');
      showToast(THEME.connToast);
      if (THEME.onAuthOk) THEME.onAuthOk();
      ws.send(JSON.stringify({ id: msgId++, type: 'get_states' }));
      ws.send(JSON.stringify({ id: msgId++, type: 'subscribe_events', event_type: 'state_changed' }));
      // Fetch hourly weather forecast (returns as a 'result' message)
      weatherForecastMsgId = msgId;
      ws.send(JSON.stringify({
        id: msgId++, type: 'call_service',
        domain: 'weather', service: 'get_forecasts',
        service_data: { entity_id: 'weather.forecast_home_2', type: 'hourly' },
        return_response: true
      }));
      // Request washer monthly statistics if enabled
      if (FEATURES.washer && typeof washerRequestStats === 'function') {
        washerRequestStats(
          data => ws.send(JSON.stringify(data)),
          () => msgId++
        );
      }

    // Auth failed — bad token
    } else if (msg.type === 'auth_invalid') {
      setConnStatus('offline');
      showToast('AUTH FAILURE — CHECK TOKEN');
      if (THEME.onAuthFail) THEME.onAuthFail();

    // Result messages: responses to get_states, service calls, and statistics requests
    } else if (msg.type === 'result' && msg.result) {
      // get_states returns an array of all entity states — ingest them all and render everything
      if (Array.isArray(msg.result)) {
        msg.result.forEach(s => ingestState(s));
        renderRooms(); renderEnviro(); renderNordpoolBars();
        renderSun(); renderNordpool48h(); renderTempGraph(); renderMedia();
        renderLcEnergy(); renderMediaPlayers();
        if (FEATURES.washer && typeof renderWasher === 'function') renderWasher();
        updateDayNight();
        if (THEME.onStatesLoaded) THEME.onStatesLoaded();
      // Washer statistics result (monthly energy/water/cycles)
      } else if (FEATURES.washer && typeof washerHandleResult === 'function' && washerHandleResult(msg)) {
        // handled by washer module
      // Weather forecast result
      } else if (msg.id === weatherForecastMsgId && msg.result?.response) {
        const fc = msg.result.response?.['weather.forecast_home_2']?.forecast;
        if (Array.isArray(fc)) {
          liveData.weatherForecast = fc.slice(0, 24);
          renderWeather();
        }
      }

    // Real-time state change — a single entity updated
    } else if (msg.type === 'event' && msg.event?.event_type === 'state_changed') {
      const s = msg.event.data?.new_state;
      if (!s) return;
      ingestState(s);
      const id = s.entity_id;
      // Re-render affected UI sections based on which entity changed
      if (id.startsWith('light.') || ALL_SENSOR_IDS.has(id)) renderRooms();
      if (id in liveData.power) renderRooms(); // Power sensor changes must also update room cards
      if (id === 'sun.sun')              { renderSun(); updateDayNight(); }
      if (id === 'weather.forecast_home_2') {
        // Weather entity changed — re-fetch the hourly forecast
        weatherForecastMsgId = msgId;
        ws.send(JSON.stringify({
          id: msgId++, type: 'call_service',
          domain: 'weather', service: 'get_forecasts',
          service_data: { entity_id: 'weather.forecast_home_2', type: 'hourly' },
          return_response: true
        }));
      }
      if (id.includes('nordpool'))       { renderNordpoolBars(); renderNordpool48h(); }
      if (['sensor.outside_temperature_met_no',
           'sensor.nordpool_current_price_15m','sensor.nordpool_last_this_next_hour'].includes(id)) {
        renderEnviro();
      }
      if (FEATURES.washer && id === 'sensor.washer_job_state') renderEnviro();
      if (THEME.onStateChanged) THEME.onStateChanged(id, s);
    }
  };

  ws.onerror = () => {
    setConnStatus('offline');
    if (THEME.onWsError) THEME.onWsError();
  };
  ws.onclose = () => {
    wsReady = false;
    setConnStatus('offline');
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(haConnect, 5000); // Auto-reconnect after 5s
  };
}

// ═══════════════════════════════════════════════════
// INGEST STATE
// ═══════════════════════════════════════════════════
/**
 * Map a Home Assistant state object into the local `liveData` store.
 * Called once per entity on initial load, and again on each real-time state_changed event.
 * Each entity type updates its own section of liveData and may trigger re-renders.
 *
 * @param {Object} s - HA state object with { entity_id, state, attributes }
 */
function ingestState(s) {
  const id = s.entity_id;

  // ── Lights: track on/off and brightness (0-255) ──
  if (id.startsWith('light.') && LIGHT_ENTITIES.includes(id)) {
    liveData.lights[id] = s.state === 'on';
    const bri = s.attributes?.brightness;
    liveData.brightness[id] = (bri != null) ? bri : (liveData.brightness[id] ?? 255);
  }

  // ── Room sensors: temperature, humidity, lux ──
  if (ALL_SENSOR_IDS.has(id)) {
    const v = parseFloat(s.state);
    liveData.sensors[id] = isNaN(v) ? null : v;
  }

  // ── Sun: rise/set times, elevation, above/below horizon ──
  if (id === 'sun.sun') {
    liveData.sun.nextRising  = s.attributes?.next_rising  ?? null;
    liveData.sun.nextSetting = s.attributes?.next_setting ?? null;
    liveData.sun.elevation   = s.attributes?.elevation    ?? null;
    liveData.sun.state       = s.state ?? null;
  }

  // ── Environment: outside temp + electricity prices ──
  if (id === 'sensor.outside_temperature_met_no') {
    liveData.outsideTemp = isNaN(parseFloat(s.state)) ? null : parseFloat(s.state);
  }
  if (id === 'sensor.nordpool_current_price_15m') {
    liveData.elecNow = parseFloat(s.state) || null;
  }
  // Nordpool composite sensor — tries multiple attribute names because different
  // Nordpool integration versions expose prices under different keys
  if (id === 'sensor.nordpool_last_this_next_hour') {
    const stateVal = parseFloat(s.state);
    if (!isNaN(stateVal)) liveData.elecNow = stateVal;
    const attrs = s.attributes || {};
    const last = parseFloat(attrs.last_hour ?? attrs.last ?? attrs.price_last_hour ?? attrs.previous_hour ?? NaN);
    const next = parseFloat(attrs.next_hour ?? attrs.next ?? attrs.price_next_hour ?? NaN);
    // Fallback: parse prices from the state string itself (e.g. "Last: 0.52 Next: 0.61")
    const rawLast = String(s.state || '').match(/Last[:\s]+([-\d.]+)/i);
    const rawNext = String(s.state || '').match(/Next[:\s]+([-\d.]+)/i);
    if (!isNaN(last))  liveData.elecLast = last;
    else if (rawLast)  liveData.elecLast = parseFloat(rawLast[1]);
    if (!isNaN(next))  liveData.elecNext = next;
    else if (rawNext)  liveData.elecNext = parseFloat(rawNext[1]);
  }

  // ── Plex: active sessions from Tautulli sensors ──
  if (id.startsWith('sensor.plex_session_') && id.endsWith('_tautulli')) {
    const sessionNum = id.replace('sensor.plex_session_','').replace('_tautulli','');
    if (s.state === 'playing' || s.state === 'paused') {
      liveData.sessions[sessionNum] = {
        state:              s.state,
        title:              s.attributes?.title              || '',
        full_title:         s.attributes?.full_title         || '',
        grandparent_title:  s.attributes?.grandparent_title  || '',
        parent_title:       s.attributes?.parent_title       || '',
        media_type:         s.attributes?.media_type         || '',
        year:               s.attributes?.year               || '',
        progress:           s.attributes?.progress_percent   ?? 0,
        duration:           s.attributes?.duration           || '',
        stream_remaining:   s.attributes?.stream_remaining   || '',
        stream_eta:         s.attributes?.stream_eta         || '',
        user:               s.attributes?.user               || '',
        user_thumb:         s.attributes?.user_thumb         || '',
        player:             s.attributes?.player             || '',
        platform:           s.attributes?.platform           || '',
        location:           s.attributes?.location           || '',
        transcode_decision: s.attributes?.transcode_decision || '',
        video_resolution:   s.attributes?.stream_video_full_resolution || s.attributes?.video_resolution || '',
        video_codec:        s.attributes?.stream_video_codec || s.attributes?.video_codec || '',
        audio_codec:        s.attributes?.stream_audio_codec || s.attributes?.audio_codec || '',
        bandwidth:          s.attributes?.bandwidth          || 0,
        content_rating:     s.attributes?.content_rating     || '',
        summary:            s.attributes?.summary            || '',
        image_url:          s.attributes?.image_url          || null,
      };
    } else {
      delete liveData.sessions[sessionNum];
    }
    renderMedia();
  }
  if (id === 'sensor.tautulli_stream_count')              { liveData.streamCount = parseInt(s.state) || 0; renderMedia(); }
  if (id === 'sensor.tautulli_stream_count_direct_play')  { liveData.streamDirectPlay = parseInt(s.state) || 0; }
  if (id === 'sensor.tautulli_stream_count_transcode')    { liveData.streamTranscode = parseInt(s.state) || 0; }
  if (id === 'sensor.tautulli_total_bandwidth')           { liveData.totalBandwidth = parseFloat(s.state) || 0; }
  if (id === 'sensor.tautulli_lan_bandwidth')             { liveData.lanBandwidth = parseFloat(s.state) || 0; }
  if (id === 'sensor.tautulli_wan_bandwidth')             { liveData.wanBandwidth = parseFloat(s.state) || 0; renderMedia(); }

  // ── Power sensors: per-room wattage, tracked for energy chart history ──
  if (id in liveData.power) {
    const v = parseFloat(s.state);
    liveData.power[id] = isNaN(v) ? null : v;
    lcUpdatePowerHistory();
    renderLcEnergy();
  }
  if (id === 'sensor.balconyluxtemp_illuminance') {
    liveData.outsideLux = isNaN(parseFloat(s.state)) ? null : parseFloat(s.state);
  }

  // ── Media players: Sonos, Apple TV, etc. ──
  if (MEDIA_PLAYER_IDS.has(id)) {
    const meta = MEDIA_PLAYER_ENTITIES.find(e => e.id === id);
    if (s.state === 'playing' || s.state === 'paused') {
      liveData.mediaPlayers[id] = {
        state:       s.state,
        label:       meta.label,
        type:        meta.type,
        title:       s.attributes?.media_title        || '',
        artist:      s.attributes?.media_artist       || '',
        album:       s.attributes?.media_album_name   || '',
        art:         s.attributes?.entity_picture      || null,
        volume:      s.attributes?.volume_level        ?? null,
        muted:       s.attributes?.is_volume_muted     || false,
        source:      s.attributes?.source              || '',
        app:         s.attributes?.app_name            || '',
        contentType: s.attributes?.media_content_type  || '',
        duration:    s.attributes?.media_duration      ?? null,
        position:    s.attributes?.media_position      ?? null,
        shuffle:     s.attributes?.shuffle             || false,
        repeat:      s.attributes?.repeat              || 'off',
        friendly:    s.attributes?.friendly_name       || meta.label,
      };
    } else {
      delete liveData.mediaPlayers[id];
    }
    renderMediaPlayers();
  }

  if (FEATURES.washer && typeof washerIngest === 'function') washerIngest(id, s);

  if (id === 'sensor.outside_temp_next_24h_hourly') {
    const temps = s.attributes?.temps;
    if (Array.isArray(temps)) {
      liveData.tempNext24h = temps.slice(0, 24).map(Number);
      renderTempGraph();
    }
  }
  if (id === 'sensor.nordpool_next_24h_15m' || id === 'sensor.nordpool') {
    const today    = s.attributes?.raw_today    || [];
    const tomorrow = s.attributes?.raw_tomorrow || [];
    if (today.length) {
      liveData.nordpool48h = [...today, ...tomorrow].map(e => ({
        start: e.start, value: parseFloat(e.value)
      }));
      renderNordpool48h();
    }
  }

  if (THEME.onIngest) THEME.onIngest(id, s);
}

// ═══════════════════════════════════════════════════
// HA SERVICE CALL
// ═══════════════════════════════════════════════════
/**
 * Send a service call to Home Assistant.
 * @param {string} domain - e.g. 'light', 'switch', 'weather'
 * @param {string} service - e.g. 'turn_on', 'turn_off', 'get_forecasts'
 * @param {Object} data - service_data payload (e.g. { entity_id: '...' })
 */
function haCall(domain, service, data) {
  if (!ws || !wsReady) { showToast('NOT CONNECTED'); return; }
  ws.send(JSON.stringify({
    id: msgId++, type: 'call_service',
    domain, service, service_data: data
  }));
}

// ═══════════════════════════════════════════════════
// FULLSCREEN & THEME SWITCHER
// ═══════════════════════════════════════════════════
function toggleFullscreen() {
  if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(() => {}); localStorage.setItem('ha_fs', '1'); }
  else { document.exitFullscreen(); localStorage.removeItem('ha_fs'); }
}

function showSwitcher() {
  const el = document.getElementById('theme-switcher');
  if (!el) return;
  el.classList.add('visible');
  clearTimeout(switcherTimer);
  switcherTimer = setTimeout(hideSwitcher, 20000);
}

function hideSwitcher() {
  const sw = document.getElementById('theme-switcher');
  const mn = document.getElementById('theme-menu');
  if (sw) sw.classList.remove('visible');
  if (mn) mn.classList.remove('open');
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
(function sharedInit() {
  // Hide UI elements for disabled features
  Object.entries(FEATURES).forEach(([feature, enabled]) => {
    if (!enabled) {
      document.querySelectorAll(`[data-feature="${feature}"]`).forEach(el => {
        el.style.display = 'none';
      });
    }
  });

  // Merge extra liveData fields from theme
  if (THEME.extraLiveData) Object.assign(liveData, THEME.extraLiveData);

  // Init lights
  liveData.lights     = Object.fromEntries(LIGHT_ENTITIES.map(id => [id, false]));
  liveData.brightness = Object.fromEntries(LIGHT_ENTITIES.map(id => [id, 255]));

  // Initial renders
  renderRooms();
  renderEnviro();
  renderSun();
  renderLcEnergy();
  renderMediaPlayers();
  updateDayNight(); // apply stored day/night preference and set button label

  // Clock
  setInterval(updateClock, 1000);
  updateClock();
  setInterval(renderSun, 60000);

  // Theme-specific intervals
  if (THEME.intervals) THEME.intervals.forEach(([fn, ms]) => setInterval(fn, ms));

  // Theme-specific init
  if (THEME.onInit) THEME.onInit();

  // Connect
  haConnect();

  // Diagnostics
  if (document.getElementById('diag-host')) document.getElementById('diag-host').textContent = HA_HOST;

  // Keyboard navigation for tabs
  document.addEventListener('keydown', (e) => {
    const tablist = document.querySelector('[role="tablist"]');
    if (!tablist || !tablist.contains(document.activeElement)) return;
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const idx = tabs.indexOf(document.activeElement);
    if (idx === -1) return;
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next >= 0) {
      e.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    }
  });

  // Fullscreen persistence — requires a user gesture, so wait for first interaction
  if (localStorage.getItem('ha_fs') === '1') {
    const goFS = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); };
    document.addEventListener('click', goFS, { once: true });
    document.addEventListener('keydown', goFS, { once: true });
    document.addEventListener('touchstart', goFS, { once: true });
  }

  // Theme menu — intercept links for fullscreen persistence
  const themeMenu = document.getElementById('theme-menu');
  if (themeMenu) {
    themeMenu.addEventListener('click', e => {
      const a = e.target.closest('a'); if (!a) return;
      e.preventDefault();
      if (document.fullscreenElement) localStorage.setItem('ha_fs', '1');
      window.location.href = a.href;
    });
  }

  // Theme switcher visibility
  const themeSwitcher = document.getElementById('theme-switcher');
  if (themeSwitcher) {
    themeSwitcher.addEventListener('click', () => { clearTimeout(switcherTimer); switcherTimer = setTimeout(hideSwitcher, 20000); });
  }
  document.addEventListener('click', e => { if (!e.target.closest('.theme-switcher') && !e.target.closest('.theme-zone')) hideSwitcher(); });
})();
