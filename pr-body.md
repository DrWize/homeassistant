## What changed

- synced the updated first-party dashboard sources from the live `www` directory
- updated SmartThings washer entity examples and the Winamp washer power mapping
- added responsive washer completion countdowns with 24-hour finish-time tooltips
- improved C64 readability on desktop and mobile
- added the Home Assistant YAML, power mockup, and Simple Dreams dashboard files
- moved the Simple Dreams Home Assistant connection to the gitignored `config.js` configuration pattern

## Why

The GitHub repository had fallen behind the dashboard files currently deployed in Home Assistant. These changes mirror the intended dashboard source updates while excluding live secrets, personal configuration, HACS assets, dependencies, and runtime data.

The Simple Dreams source contained a hardcoded long-lived Home Assistant token. The published version now reads `HA_WS` and `HA_TOKEN` from `config.js`, consistent with the rest of the repository, so the credential is not committed.

## Impact

- washer status shows human-readable time remaining and estimated finish time
- compact countdown labels fit mobile layouts
- C64 cards and labels are more legible
- repository examples use the renamed bathroom washer entities

## Validation

- `node --check washer.js`
- `node tools/theme-audit.js` — 0 issues
- parsed `ha-dashboard.yaml` with PyYAML
- `git diff --cached --check`
- scanned staged content for credentials and JWT-like tokens
