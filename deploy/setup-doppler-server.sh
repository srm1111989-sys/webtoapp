#!/bin/bash
set -euo pipefail

PROJECT="webtoapp"
CONFIG="prd"
TOKEN_DIR="/root/.doppler"
TOKEN_FILE="$TOKEN_DIR/${PROJECT}-${CONFIG}.token"

if [ -z "${DOPPLER_TOKEN:-}" ]; then
  echo "DOPPLER_TOKEN is required"
  exit 1
fi

mkdir -p "$TOKEN_DIR"
chmod 700 "$TOKEN_DIR"

if ! command -v doppler >/dev/null 2>&1; then
  curl -Ls https://cli.doppler.com/install.sh | sh
fi

printf '%s\n' "$DOPPLER_TOKEN" > "$TOKEN_FILE"
chmod 600 "$TOKEN_FILE"

DOPPLER_TOKEN="$DOPPLER_TOKEN" doppler secrets download \
  --project "$PROJECT" \
  --config "$CONFIG" \
  --format env-no-quotes \
  --no-file \
  --no-fallback > /dev/null

echo "Doppler access verified for $PROJECT/$CONFIG"
