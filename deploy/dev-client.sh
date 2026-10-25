#!/usr/bin/env bash
# Server start is separate; rebuilding only, never opens a user database.
set -euo pipefail
DEPLOY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DEPLOY/.." && pwd)"
if [ ! -d "$ROOT/ptcg-server" ] && [ -d "$ROOT/twinleafgg/ptcg-server" ]; then ROOT="$ROOT/twinleafgg"; fi
node -e 'if (!/^20\.19\./.test(process.versions.node)) { console.error("Use Node 20.19.x"); process.exit(1); }'
node "$DEPLOY/check-assets.cjs"
cd "$ROOT/ptcg-server"
mkdir -p avatars/duo sleeves scans/duo
if [ -f "$ROOT/public-data/catalog.json" ]; then
  cp "$ROOT/public-data/catalog.json" scans/duo/catalog.json
elif [ ! -f scans/duo/catalog.json ]; then
  echo 'Missing reviewed Chinese metadata: public-data/catalog.json' >&2
  exit 1
fi
npm run compile
cd "$ROOT/ptcg-play-react"
exec npm run dev -- --force --host 127.0.0.1
