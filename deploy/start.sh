#!/usr/bin/env bash
set -euo pipefail
DEPLOY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DEPLOY/.." && pwd)"
if [ ! -d "$ROOT/ptcg-server" ] && [ -d "$ROOT/twinleafgg/ptcg-server" ]; then ROOT="$ROOT/twinleafgg"; fi
cd "$ROOT/ptcg-server"
node -e 'const v = process.versions.node; if (!/^(20\.19\.|22\.|24\.)/.test(v)) { console.error("Backend runtime: prefer supported Node 22 LTS; accepted ranges are 20.19.x/22.x/24.x (validate your environment)"); process.exit(1); } if (v.startsWith("20.")) console.error("WARNING: Node 20 is EOL; use only as the inherited build baseline, not a long-term public runtime.");'
test -f output/backend/app.js || { echo 'Build the server first: bash deploy/build.sh --install' >&2; exit 1; }
node <<'JS'
require('dotenv').config();
const isPlaceholder = value => /placeholder|replace[_ -]?with|change[_ -]?me/i.test(value);
const secret = process.env.secret;
if (!secret || secret.length < 32 || isPlaceholder(secret)) {
  console.error('Configure a generated signing secret (lowercase variable: secret), at least 32 characters.');
  process.exit(1);
}
if (process.env.DUO_ROOM_PASSWORD && (process.env.DUO_ROOM_PASSWORD.length < 20 || isPlaceholder(process.env.DUO_ROOM_PASSWORD))) {
  console.error('DUO_ROOM_PASSWORD must be blank to disable registration or a generated production password (20+ characters).');
  process.exit(1);
}
JS
exec node --expose-gc --max-old-space-size=4096 start.js
