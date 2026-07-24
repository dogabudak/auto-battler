#!/bin/bash

# Keep only UN member states + observer states + recognized territories
# Remove regional flags, historical flags, and special flags

FLAGS_DIR="public/flags"
BACKUP_DIR="public/flags_backup"

# Create backup
mkdir -p "$BACKUP_DIR"
cp "$FLAGS_DIR"/*.svg "$BACKUP_DIR/" 2>/dev/null

# Valid ISO 3166-1 alpha-2 codes (UN members + observers + territories)
# 193 UN members + 2 observers + major territories
VALID_CODES=(
  # UN Member States (193)
  ad ae af ag ai al am ao aq ar as at au aw ax az
  ba bb bd be bf bg bh bi bj bl bm bn bo bq br bs bt bv bw by bz
  ca cc cd cf cg ch ci ck cl cm cn co cr cu cv cw cx cy cz
  de dj dk dm do dz
  ec ee eg eh er es et
  fi fj fk fm fo fr
  ga gb gd ge gf gg gh gi gl gm gn gp gq gr gs gt gu gw gy
  hk hm hn hr ht hu
  id ie il im in io iq ir is it
  je jm jo jp
  ke kg kh ki km kn kp kr kw ky kz
  la lb lc li lk lr ls lt lu lv ly
  ma mc md me mf mg mh mk ml mm mn mo mp mq mr ms mt mu mv mw mx my mz
  na nc ne nf ng ni nl no np nr nu nz
  om
  pa pe pf pg ph pk pl pm pn pr ps pt pw py
  qa
  re ro rs ru rw
  sa sb sc sd se sg sh si sj sk sl sm sn so sr ss st sv sx sy sz
  tc td tf tg th tj tk tl tm tn to tr tt tv tw tz
  ua ug um us uy uz
  va vc ve vg vi vn vu
  wf ws
  xk
  ye yt
  za zm zw
)

echo "Cleaning flags directory..."
echo "Keeping only UN countries and territories"
echo ""

# Convert array to a lookup string
VALID_STRING=" ${VALID_CODES[*]} "

KEPT=0
REMOVED=0

for file in "$FLAGS_DIR"/*.svg; do
  filename=$(basename "$file" .svg)

  # Check if it's a valid 2-letter code (no hyphens = not regional)
  if [[ "$filename" =~ ^[a-z]{2}$ ]] && [[ "$VALID_STRING" =~ " $filename " ]]; then
    ((KEPT++))
  else
    rm "$file"
    ((REMOVED++))
  fi
done

echo "================================"
echo "Kept: $KEPT flags"
echo "Removed: $REMOVED flags"
echo "Backup: $BACKUP_DIR/"
echo "================================"

echo ""
echo "Remaining flags:"
ls "$FLAGS_DIR"/*.svg | wc -l
