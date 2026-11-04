#!/usr/bin/env bash
# Make a one-image storyboard (contact sheet) of a Reel so the owner can approve every scene at a glance.
# Usage: bash scripts/storyboard.sh content/2026-w45/reel-honeymoon.mp4 [seconds-between-frames, default 2]
# Output: same path with -storyboard.png
set -euo pipefail
IN="$1"; STEP="${2:-2}"
OUT="${IN%.*}-storyboard.png"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
N=$(python3 -c "import math; print(max(1, math.ceil($DUR / $STEP)))")
COLS=$(( N < 6 ? N : 6 )); ROWS=$(( (N + COLS - 1) / COLS ))
ffmpeg -loglevel error -y -i "$IN" -vf "fps=1/$STEP,scale=270:-1,drawtext=text='%{pts\:hms}':x=10:y=h-34:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=6,tile=${COLS}x${ROWS}:padding=8:margin=8:color=white" -frames:v 1 "$OUT"
echo "$OUT"
