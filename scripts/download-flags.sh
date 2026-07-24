#!/bin/bash

# Download circular flags from hatscripts/circle-flags
# These are perfect for the ball-style auto battler

FLAGS_DIR="public/flags"
BASE_URL="https://hatscripts.github.io/circle-flags/flags"

mkdir -p "$FLAGS_DIR"

echo "Downloading circular flag SVGs..."
echo ""

SUCCESS=0
FAILED=0

download_flag() {
  local key="$1"
  local code="$2"
  local url="${BASE_URL}/${code}.svg"
  local output="${FLAGS_DIR}/${key}.svg"

  if curl -s -f -o "$output" "$url"; then
    echo "✓ $key"
    ((SUCCESS++))
  else
    echo "✗ $key (failed)"
    ((FAILED++))
  fi
}

# Download all flags (key -> ISO code)
download_flag "usa" "us"
download_flag "china" "cn"
download_flag "germany" "de"
download_flag "japan" "jp"
download_flag "india" "in"
download_flag "uk" "gb"
download_flag "france" "fr"
download_flag "italy" "it"
download_flag "brazil" "br"
download_flag "canada" "ca"
download_flag "russia" "ru"
download_flag "south_korea" "kr"
download_flag "australia" "au"
download_flag "mexico" "mx"
download_flag "spain" "es"
download_flag "indonesia" "id"
download_flag "netherlands" "nl"
download_flag "saudi_arabia" "sa"
download_flag "turkey" "tr"
download_flag "switzerland" "ch"
download_flag "poland" "pl"
download_flag "argentina" "ar"
download_flag "sweden" "se"
download_flag "belgium" "be"
download_flag "ireland" "ie"
download_flag "israel" "il"
download_flag "norway" "no"
download_flag "austria" "at"
download_flag "uae" "ae"
download_flag "thailand" "th"
download_flag "singapore" "sg"
download_flag "nigeria" "ng"
download_flag "south_africa" "za"
download_flag "egypt" "eg"
download_flag "denmark" "dk"
download_flag "philippines" "ph"
download_flag "pakistan" "pk"
download_flag "vietnam" "vn"
download_flag "portugal" "pt"
download_flag "czech_republic" "cz"
download_flag "greece" "gr"
download_flag "finland" "fi"
download_flag "romania" "ro"
download_flag "colombia" "co"
download_flag "new_zealand" "nz"
download_flag "chile" "cl"
download_flag "ukraine" "ua"
download_flag "iran" "ir"
download_flag "north_korea" "kp"
download_flag "malaysia" "my"
download_flag "peru" "pe"
download_flag "hungary" "hu"
download_flag "qatar" "qa"
download_flag "kuwait" "kw"
download_flag "morocco" "ma"
download_flag "bangladesh" "bd"
download_flag "kenya" "ke"
download_flag "ethiopia" "et"
download_flag "algeria" "dz"
download_flag "iraq" "iq"
download_flag "croatia" "hr"
download_flag "serbia" "rs"
download_flag "luxembourg" "lu"
download_flag "iceland" "is"

echo ""
echo "================================"
echo "Downloaded: $SUCCESS flags"
echo "Failed: $FAILED flags"
echo "Location: $FLAGS_DIR/"
echo "================================"
