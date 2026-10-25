#!/usr/bin/env bash
# Complete local preparation; the game server starts only when npm start is run.
set -euo pipefail
DEPLOY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (!((major === 22 && minor >= 12) || major === 24)) { console.error("Use Node 22.12+ (22 LTS recommended) or Node 24 LTS."); process.exit(1); }'
if [ "$#" -ne 0 ]; then echo 'Usage: npm run setup' >&2; exit 2; fi
node "$DEPLOY/init-config.cjs"
printf '%s\n' 'Preparing card art, table graphics and sound effects (~3.7 GB; completed files are reused).'
bash "$DEPLOY/prepare-assets.sh"
bash "$DEPLOY/build.sh" --install
printf '\n%s\n' 'Ready. Run npm start, then open http://localhost:8080. Registration invitation: npm run room:invite'
printf '%s\n' 'Optional background music: npm run assets:music -- --accept-source-terms (requires ffmpeg; review source rights).'
