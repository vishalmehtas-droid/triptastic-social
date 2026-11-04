#!/usr/bin/env bash
# Install OpenMontage (calesthio/OpenMontage, AGPL-3.0) next to this repo for agent-driven video production.
# Pinned to a reviewed commit; bump OM_REF deliberately after checking upstream changes.
# Usage: bash scripts/setup-openmontage.sh [install-dir]   (default: ../OpenMontage)
# Takes ~8 minutes on a fresh cloud session. API keys are read from the environment
# (PEXELS_API_KEY, PIXABAY_API_KEY, ...) and copied into OpenMontage's .env.
set -euo pipefail
OM_REF="d21f5d4eaa08422b09c7091757a05affcbabb35b"
DIR="${1:-$(cd "$(dirname "$0")/../.." && pwd)/OpenMontage}"

if [ ! -d "$DIR/.git" ]; then
  git clone https://github.com/calesthio/OpenMontage "$DIR"
fi
cd "$DIR"
git fetch --depth 1 origin "$OM_REF" 2>/dev/null || true
git checkout -q "$OM_REF"

[ -x .venv/bin/python ] || make setup
.venv/bin/python -m pip install -q faster-whisper   # transcription + word-level captions

# Pass through any keys set in the cloud environment.
for k in PEXELS_API_KEY PIXABAY_API_KEY UNSPLASH_ACCESS_KEY; do
  if [ -n "${!k:-}" ]; then
    grep -v "^$k=" .env > .env.tmp || true; mv .env.tmp .env
    echo "$k=${!k}" >> .env
  fi
done

export PATH="$DIR/.venv/bin:$PATH"
.venv/bin/python - <<'PY'
from tools.tool_registry import registry
registry.discover(); e = registry.support_envelope()
for n in ["pexels_video", "pixabay_video", "direct_clip_search", "piper_tts", "transcriber", "subtitle_gen", "hyperframes_compose", "auto_reframe"]:
    print(f"  {n:22} {e[n]['status']}")
PY
echo "OpenMontage ready at $DIR (run tools with PATH=$DIR/.venv/bin:\$PATH)"
