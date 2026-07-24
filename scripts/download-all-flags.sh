#!/bin/bash

# Download ALL circular flags from hatscripts/circle-flags
# Includes countries, territories, regions, and special flags

FLAGS_DIR="public/flags"
BASE_URL="https://hatscripts.github.io/circle-flags/flags"
API_URL="https://api.github.com/repos/HatScripts/circle-flags/contents/flags"

mkdir -p "$FLAGS_DIR"

echo "Fetching list of all available flags..."
FLAGS=$(curl -s "$API_URL" | grep '"name"' | sed 's/.*"name": "\(.*\)\.svg".*/\1/')
TOTAL=$(echo "$FLAGS" | wc -l | tr -d ' ')

echo "Found $TOTAL flags to download"
echo ""

SUCCESS=0
FAILED=0

for code in $FLAGS; do
  url="${BASE_URL}/${code}.svg"
  output="${FLAGS_DIR}/${code}.svg"

  if curl -s -f -o "$output" "$url"; then
    ((SUCCESS++))
    # Show progress every 50 flags
    if [ $((SUCCESS % 50)) -eq 0 ]; then
      echo "Progress: $SUCCESS / $TOTAL"
    fi
  else
    echo "✗ Failed: $code"
    ((FAILED++))
  fi
done

echo ""
echo "================================"
echo "Downloaded: $SUCCESS flags"
echo "Failed: $FAILED flags"
echo "Location: $FLAGS_DIR/"
echo "================================"
