#!/usr/bin/env bash
# Project-local Python dependencies. Does not install a global Python package.
set -euo pipefail
DEPLOY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DEPLOY/.." && pwd)"
cd "$ROOT"
PYTHON="${PYTHON:-python3}"
command -v "$PYTHON" >/dev/null || { echo 'Install Python 3.10+ first.' >&2; exit 1; }
"$PYTHON" -c 'import sys; assert sys.version_info >= (3, 10), "Use Python 3.10+"'
[ ! -L .venv ] || { echo 'Refusing a symbolic-link .venv.' >&2; exit 1; }
for arg in "$@"; do
  if [ "$arg" = '--check' ]; then
    if [ ! -x .venv/bin/python ] || ! .venv/bin/python -c 'import PIL; assert PIL.__version__ == "12.1.1"' >/dev/null 2>&1; then
      echo 'Offline checks require the project Python dependencies. Run npm run assets:prepare while online first.' >&2
      exit 1
    fi
    exec .venv/bin/python "$DEPLOY/download-assets.py" --root "$ROOT" "$@"
  fi
done
if [ ! -d .venv ]; then "$PYTHON" -m venv .venv; fi
[ -x .venv/bin/python ] || { echo 'Missing .venv/bin/python; Linux/macOS or WSL2 is required.' >&2; exit 1; }
if ! .venv/bin/python -c 'import PIL; assert PIL.__version__ == "12.1.1"' >/dev/null 2>&1; then
  .venv/bin/python -m pip install --disable-pip-version-check -r "$DEPLOY/requirements-assets.txt"
fi
exec .venv/bin/python "$DEPLOY/download-assets.py" --root "$ROOT" "$@"
