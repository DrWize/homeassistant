#!/usr/bin/env node
// Theme Consistency Audit — checks all 6 dashboards for structural parity
// Usage: node tools/theme-audit.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const THEMES = [
  { file: 'lcars-dashboard.html',   name: 'LCARS'   },
  { file: 'pipboy-dashboard.html',  name: 'Pip-Boy'  },
  { file: 'c64-dashboard.html',     name: 'C64'      },
  { file: 'matrix-dashboard.html',  name: 'Matrix'   },
  { file: 'weyland-dashboard.html', name: 'Weyland'  },
  { file: 'diablo-dashboard.html',  name: 'Diablo'   },
];

const SHARED_FILE = 'shared.js';
const WASHER_FILE = 'washer.js';

// ─── Helpers ───────────────────────────────────────────
function extractIds(html) {
  const ids = new Set();
  const re = /\bid=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(html))) ids.add(m[1]);
  return ids;
}

function extractGetElementByIds(js) {
  const ids = new Set();
  // Match getElementById('id') and setEl('id', ...)
  const patterns = [
    /getElementById\(['"]([^'"]+)['"]\)/g,
    /setEl\(['"]([^'"]+)['"]/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(js))) ids.add(m[1]);
  }
  return ids;
}

function extractThemeHooks(html) {
  const hooks = [
    'onInit', 'onStatesLoaded', 'onIngest', 'onStateChanged',
    'onAuthOk', 'onAuthFail', 'onToggleLight', 'onNightProtocol', 'onWsError'
  ];
  const found = {};
  for (const h of hooks) {
    // Match hook definition in THEME object: hookName( or hookName :
    found[h] = new RegExp(`\\b${h}\\s*[:(]`).test(html);
  }
  return found;
}

function hasElement(html, id) {
  return new RegExp(`id=["']${id}["']`).test(html);
}

function hasText(html, text) {
  return html.includes(text);
}

// ─── Structural checks ────────────────────────────────
const REQUIRED_STRUCTURES = [
  { label: 'Power Distribution panel',    check: h => hasElement(h, 'power-hero-watts') && hasElement(h, 'power-panel-table') },
  { label: 'Energy chart',                check: h => hasElement(h, 'lc-energy-chart') },
  { label: 'Energy stats (total)',        check: h => hasElement(h, 'lc-energy-total') },
  { label: 'Energy stats (cost)',         check: h => hasElement(h, 'lc-energy-cost') },
  { label: 'Energy stats (price)',        check: h => hasElement(h, 'lc-energy-price') },
  { label: 'Washer panel',               check: h => hasElement(h, 'washer-panel') },
  { label: 'Washer feature flag',         check: h => hasText(h, 'data-feature="washer"') },
  { label: 'Weather section',             check: h => hasElement(h, 'd-weather') },
  { label: 'Nordpool 48h chart',          check: h => hasElement(h, 'd-np48') },
  { label: 'Temp graph',                  check: h => hasElement(h, 'd-tempgraph') },
  { label: 'Media: stream count',         check: h => hasElement(h, 'm-stream-count') },
  { label: 'Media: sessions grid',        check: h => hasElement(h, 'sessions-grid') },
  { label: 'Media: player grid',          check: h => hasElement(h, 'mp-grid') },
  { label: 'Media: no-media msg',         check: h => hasElement(h, 'no-media-msg') },
  { label: 'Toast element',               check: h => hasElement(h, 'toast') },
  { label: 'Connection dot',              check: h => hasElement(h, 'conn-dot') },
  { label: 'Connection label',            check: h => hasElement(h, 'conn-label') },
  { label: 'Footer status',               check: h => hasElement(h, 'footer-status') },
  { label: 'Day/night button',            check: h => hasElement(h, 'daynight-btn') },
  { label: 'Theme switcher',              check: h => hasElement(h, 'theme-switcher') },
  { label: 'Stat: lights count',          check: h => hasElement(h, 'stat-lights') },
  { label: 'Stat: electricity price',     check: h => hasElement(h, 'stat-elec') },
  { label: 'Stat: sun state',             check: h => hasElement(h, 'stat-sun') },
  { label: 'Stat: washer status',         check: h => hasElement(h, 'stat-washer') },
  { label: 'Sun data: elevation',         check: h => hasElement(h, 'd-elevation') },
  { label: 'Sun data: sunrise',           check: h => hasElement(h, 'd-sunrise') },
  { label: 'Sun data: sunset',            check: h => hasElement(h, 'd-sunset') },
  { label: 'Sun data: daylight',          check: h => hasElement(h, 'd-daylight') },
  { label: 'Rooms grid',                  check: h => hasElement(h, 'rooms-grid') },
  { label: 'Lights grid',                 check: h => hasElement(h, 'lights-grid') },
  { label: 'Diag host',                   check: h => hasElement(h, 'diag-host') },
  { label: 'Power hero kWh',              check: h => hasElement(h, 'power-hero-kwh') },
  { label: 'Power hero cost',             check: h => hasElement(h, 'power-hero-cost') },
];

// ─── CSS variable checks ──────────────────────────────
const REQUIRED_CSS_VARS = [
  '--orange', '--blue', '--green', '--grey',
  '--teal', '--red', '--yellow', '--white',
];

function extractCssVars(html) {
  const vars = new Set();
  const re = /--[\w-]+/g;
  let m;
  while ((m = re.exec(html))) vars.add(m[0]);
  return vars;
}

// ─── Run audit ─────────────────────────────────────────
console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('  THEME CONSISTENCY AUDIT');
console.log('═══════════════════════════════════════════════════════');
console.log('');

const sharedJs = fs.readFileSync(path.join(ROOT, SHARED_FILE), 'utf8');
const washerJs = fs.existsSync(path.join(ROOT, WASHER_FILE))
  ? fs.readFileSync(path.join(ROOT, WASHER_FILE), 'utf8') : '';
const sharedIds = extractGetElementByIds(sharedJs + washerJs);

let totalIssues = 0;
const themeData = [];

for (const t of THEMES) {
  const html = fs.readFileSync(path.join(ROOT, t.file), 'utf8');
  const htmlIds = extractIds(html);
  const inlineIds = extractGetElementByIds(html);
  const hooks = extractThemeHooks(html);
  const cssVars = extractCssVars(html);

  themeData.push({ ...t, html, htmlIds, inlineIds, hooks, cssVars });
}

// ─── 1. Structural check ──────────────────────────────
console.log('1. STRUCTURAL ELEMENTS');
console.log('─────────────────────────────────────────────────');

const structTable = [];
let structIssues = 0;

for (const s of REQUIRED_STRUCTURES) {
  const row = { label: s.label };
  let allSame = true;
  let firstVal = null;

  for (const t of themeData) {
    const has = s.check(t.html);
    row[t.name] = has ? '✓' : '✗';
    if (firstVal === null) firstVal = has;
    if (has !== firstVal) allSame = false;
  }

  if (!allSame) {
    structIssues++;
    row.status = '⚠️';
  } else if (!firstVal) {
    row.status = '—';
  } else {
    row.status = '✓';
  }
  structTable.push(row);
}

// Print table
const names = themeData.map(t => t.name);
const hdr = ['Element', ...names, ''].map((h, i) => h.padEnd(i === 0 ? 30 : 8)).join(' | ');
console.log(hdr);
console.log('-'.repeat(hdr.length));
for (const row of structTable) {
  const line = [
    row.label.padEnd(30),
    ...names.map(n => (row[n] || '').padEnd(8)),
    row.status
  ].join(' | ');
  if (row.status === '⚠️') {
    console.log(`>> ${line}`);
  } else {
    console.log(`   ${line}`);
  }
}

console.log('');
console.log(`   Structural issues: ${structIssues}`);
console.log('');

// ─── 2. Theme hooks ───────────────────────────────────
console.log('2. THEME HOOKS');
console.log('─────────────────────────────────────────────────');

const hookNames = [
  'onInit', 'onStatesLoaded', 'onIngest', 'onStateChanged',
  'onAuthOk', 'onAuthFail', 'onToggleLight', 'onNightProtocol', 'onWsError'
];

const hhdr = ['Hook', ...names].map((h, i) => h.padEnd(i === 0 ? 20 : 8)).join(' | ');
console.log(hhdr);
console.log('-'.repeat(hhdr.length));

let hookIssues = 0;
for (const h of hookNames) {
  const vals = themeData.map(t => t.hooks[h]);
  const trueCount = vals.filter(Boolean).length;
  const flag = (trueCount > 0 && trueCount < 6) ? '⚠️' : '';
  if (flag) hookIssues++;

  const line = [
    h.padEnd(20),
    ...vals.map(v => (v ? '✓' : '✗').padEnd(8)),
    flag
  ].join(' | ');
  if (flag) {
    console.log(`>> ${line}`);
  } else {
    console.log(`   ${line}`);
  }
}

console.log('');
console.log(`   Hook inconsistencies: ${hookIssues}`);
console.log('');

// ─── 3. Orphaned IDs ──────────────────────────────────
console.log('3. ORPHANED HTML IDs (in HTML but no JS writes to them)');
console.log('─────────────────────────────────────────────────');

let orphanIssues = 0;
for (const t of themeData) {
  const orphans = [];
  for (const id of t.htmlIds) {
    // Skip page-*, rooms-*, lights-* containers (used by shared.js innerHTML)
    if (id.startsWith('page-')) continue;
    if (['rooms-grid', 'lights-grid', 'sessions-grid', 'mp-grid'].includes(id)) continue;
    // Skip theme-specific known IDs (unique panels with their own inline JS)
    if (id.startsWith('rain-') || id.startsWith('radar-') || id.startsWith('geiger-')) continue;
    if (id.startsWith('basic-') || id.startsWith('mother-') || id.startsWith('wy-')) continue;
    if (id.startsWith('lrs-') || id.startsWith('np-')) continue;
    if (id.startsWith('threat-') || id.startsWith('sys-') || id.startsWith('sb-')) continue;
    if (id === 'active-lights-count') continue;
    // Skip containers used by innerHTML, CSS targeting, or aria (not getElementById)
    if (id === 'main-content') continue;
    if (id.startsWith('rooms-')) continue;

    // Check if shared.js, washer.js, or inline JS references this ID
    if (!sharedIds.has(id) && !t.inlineIds.has(id)) {
      // Also check if shared.js references it via THEME config (clock/date els)
      if (t.html.includes(`clockEl: '${id}'`) || t.html.includes(`dateEl: '${id}'`)) continue;
      if (t.html.includes(`lightCountEls:`) && t.html.includes(`'${id}'`)) continue;
      orphans.push(id);
    }
  }
  if (orphans.length > 0) {
    console.log(`   ${t.name}: ${orphans.join(', ')}`);
    orphanIssues += orphans.length;
  } else {
    console.log(`   ${t.name}: none`);
  }
}

console.log('');
console.log(`   Total orphaned IDs: ${orphanIssues}`);
console.log('');

// ─── 4. CSS variables ─────────────────────────────────
console.log('4. REQUIRED CSS VARIABLES');
console.log('─────────────────────────────────────────────────');

let cssIssues = 0;
for (const v of REQUIRED_CSS_VARS) {
  const row = themeData.map(t => t.cssVars.has(v) ? '✓' : '✗');
  const missing = row.filter(r => r === '✗').length;
  if (missing > 0) cssIssues++;

  const line = [
    v.padEnd(25),
    ...row.map(r => r.padEnd(8)),
    missing > 0 ? '⚠️' : ''
  ].join(' | ');
  if (missing > 0) {
    console.log(`>> ${line}`);
  } else {
    console.log(`   ${line}`);
  }
}

console.log('');
console.log(`   CSS variable issues: ${cssIssues}`);
console.log('');

// ─── 5. shared.js IDs not in HTML ─────────────────────
console.log('5. SHARED.JS IDs MISSING FROM HTML');
console.log('─────────────────────────────────────────────────');

let missingIssues = 0;
for (const id of sharedIds) {
  // Skip dynamic/computed IDs
  if (id.includes('${') || id.includes('+')) continue;
  // Skip IDs that are theme-config driven
  if (['clock-lcars', 'date-lcars'].includes(id)) continue;

  const missing = themeData.filter(t => !t.htmlIds.has(id));
  if (missing.length > 0 && missing.length < 6) {
    console.log(`   ${id}: missing in ${missing.map(t => t.name).join(', ')}`);
    missingIssues++;
  }
}

if (missingIssues === 0) console.log('   All shared IDs present in all themes');
console.log('');
console.log(`   Missing ID issues: ${missingIssues}`);
console.log('');

// ─── Summary ──────────────────────────────────────────
totalIssues = structIssues + hookIssues + orphanIssues + cssIssues + missingIssues;
console.log('═══════════════════════════════════════════════════════');
console.log(`  TOTAL ISSUES: ${totalIssues}`);
console.log(`    Structural: ${structIssues}  |  Hooks: ${hookIssues}  |  Orphans: ${orphanIssues}  |  CSS: ${cssIssues}  |  Missing: ${missingIssues}`);
console.log('═══════════════════════════════════════════════════════');
console.log('');
