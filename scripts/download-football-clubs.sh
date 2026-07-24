#!/bin/bash

# Download football club badges from TheSportsDB (free API)
# Covers top 5 European leagues + more

CRESTS_DIR="public/crests"
API_BASE="https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php"

mkdir -p "$CRESTS_DIR"

# Leagues to download
declare -a LEAGUES=(
  "English Premier League"
  "Spanish La Liga"
  "German Bundesliga"
  "Italian Serie A"
  "French Ligue 1"
  "Dutch Eredivisie"
  "Portuguese Primeira Liga"
  "Turkish Super Lig"
  "Scottish Premiership"
  "Belgian First Division A"
  "UEFA Champions League"
)

echo "Downloading football club badges..."
echo ""

TOTAL_SUCCESS=0
TOTAL_FAILED=0

for league in "${LEAGUES[@]}"; do
  echo "=== $league ==="

  # URL encode the league name
  encoded_league=$(echo "$league" | sed 's/ /%20/g')

  # Fetch teams from API
  response=$(curl -s "${API_BASE}?l=${encoded_league}")

  if [ -z "$response" ] || [ "$response" = "null" ]; then
    echo "  No data for $league"
    continue
  fi

  # Parse and download each team's badge
  echo "$response" | jq -r '.teams[]? | "\(.idTeam)|\(.strTeam)|\(.strBadge)"' 2>/dev/null | while IFS='|' read -r id name badge_url; do
    if [ -z "$badge_url" ] || [ "$badge_url" = "null" ]; then
      continue
    fi

    # Create safe filename from team name
    safe_name=$(echo "$name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g' | sed 's/__*/_/g' | sed 's/^_//;s/_$//')
    output="${CRESTS_DIR}/${safe_name}.png"

    # Skip if already exists
    if [ -f "$output" ]; then
      echo "  ✓ $name (exists)"
      continue
    fi

    # Download badge
    if curl -s -f -o "$output" "$badge_url"; then
      echo "  ✓ $name"
    else
      echo "  ✗ $name (failed)"
    fi
  done

  echo ""
done

# Count results
TOTAL=$(ls -1 "$CRESTS_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ')

echo "================================"
echo "Total badges: $TOTAL"
echo "Location: $CRESTS_DIR/"
echo "================================"
