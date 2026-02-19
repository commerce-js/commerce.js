#!/bin/bash
# ---------------------------------------------------------------------------
# check-query-parity.sh — verify Drizzle and Prisma query barrels export the
# same set of public function names.
#
# Usage:  ./scripts/check-query-parity.sh
# Returns: 0 if in sync, 1 if there are differences
# ---------------------------------------------------------------------------

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLATFORM_DIR="$(dirname "$SCRIPT_DIR")"

DRIZZLE_BARREL="$PLATFORM_DIR/src/database/drizzle/queries/index.ts"
PRISMA_BARREL="$PLATFORM_DIR/src/database/prisma/queries/index.ts"

if [ ! -f "$DRIZZLE_BARREL" ]; then
  echo "❌ Drizzle barrel not found: $DRIZZLE_BARREL"
  exit 1
fi

if [ ! -f "$PRISMA_BARREL" ]; then
  echo "❌ Prisma barrel not found: $PRISMA_BARREL"
  exit 1
fi

# Extract ALL exported names from a barrel file.
# This captures both primary names and "as X" aliases.
# Filters out keywords (export, from, as, type) and file paths.
extract_exports() {
  grep -E '^\s+\w+' "$1" \
    | grep -v '^\s*//' \
    | grep -v "from '" \
    | sed 's/,//g' \
    | tr ' ' '\n' \
    | grep -v '^\s*$' \
    | grep -v '^as$' \
    | grep -v '^export$' \
    | grep -v '^from$' \
    | grep -v '^type$' \
    | grep -v '^{$' \
    | grep -v '^}$' \
    | sort -u
}

DRIZZLE_EXPORTS=$(extract_exports "$DRIZZLE_BARREL")
PRISMA_EXPORTS=$(extract_exports "$PRISMA_BARREL")

DIFF=$(diff <(echo "$DRIZZLE_EXPORTS") <(echo "$PRISMA_EXPORTS") || true)

if [ -z "$DIFF" ]; then
  echo "✅ Drizzle and Prisma query barrels are in sync!"
  echo "   Both export $(echo "$DRIZZLE_EXPORTS" | wc -l | tr -d ' ') names."
  exit 0
else
  echo "❌ Parity mismatch between Drizzle and Prisma query barrels:"
  echo ""
  ONLY_DRIZZLE=$(echo "$DIFF" | grep '^<' | sed 's/^< //' || true)
  ONLY_PRISMA=$(echo "$DIFF" | grep '^>' | sed 's/^> //' || true)

  if [ -n "$ONLY_DRIZZLE" ]; then
    echo "  Only in Drizzle (need to add to Prisma):"
    echo "$ONLY_DRIZZLE" | sed 's/^/    - /'
  fi
  echo ""
  if [ -n "$ONLY_PRISMA" ]; then
    echo "  Only in Prisma (may need to add to Drizzle):"
    echo "$ONLY_PRISMA" | sed 's/^/    - /'
  fi
  exit 1
fi
