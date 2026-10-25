#!/usr/bin/env bash
# Run from any directory in a public source checkout. Never seeds a database.
set -euo pipefail
DEPLOY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DEPLOY/.." && pwd)"
if [ ! -d "$ROOT/ptcg-server" ] && [ -d "$ROOT/twinleafgg/ptcg-server" ]; then ROOT="$ROOT/twinleafgg"; fi
node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (!((major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major === 24)) { console.error("Use Node 22.12+ (22 LTS recommended) or Node 24 LTS."); process.exit(1); }'
INSTALL=0
if [ "${1:-}" = --install ] && [ "$#" = 1 ]; then INSTALL=1
elif [ "$#" != 0 ]; then echo 'Usage: deploy/build.sh [--install]' >&2; exit 2; fi
node "$DEPLOY/check-assets.cjs"
cd "$ROOT/ptcg-server"
if [ "$INSTALL" = 1 ]; then npm ci; fi
# postcompile copies these directories; absent licensed images are not fabricated.
mkdir -p avatars/duo sleeves scans/duo
if [ -f "$ROOT/public-data/catalog.json" ]; then
  cp "$ROOT/public-data/catalog.json" scans/duo/catalog.json
elif [ ! -f scans/duo/catalog.json ]; then
  echo 'Missing reviewed Chinese metadata: public-data/catalog.json' >&2
  exit 1
fi
npm run compile
cd "$ROOT/ptcg-play-react"
if [ "$INSTALL" = 1 ]; then npm ci; fi
npm run build
printf '%s\n' 'Built server before client. Use npm start for local play; see DEPLOYMENT.md for hosting.'
