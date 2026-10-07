#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
source_icon="docs/branding/business2stl-favicon-master.png"

export_icon() {
  local size="$1"
  local destination="$2"
  local inner_size=$((size * 9 / 10))
  magick "$source_icon" -trim +repage -resize "${inner_size}x${inner_size}" \
    -gravity center -background none -extent "${size}x${size}" "$destination"
}

export_icon 16 public/favicon-16.png
export_icon 32 public/favicon-32.png
export_icon 48 public/favicon-48.png
export_icon 64 public/favicon.png
export_icon 192 public/icon-192.png
export_icon 512 public/icon-512.png
export_icon 180 public/apple-touch-icon.png
magick public/apple-touch-icon.png -background white -alpha remove -alpha off public/apple-touch-icon.png
magick public/favicon-16.png public/favicon-32.png public/favicon-48.png public/favicon.ico
