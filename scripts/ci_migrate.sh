#!/usr/bin/env bash
set -euo pipefail

SQLITE="backend/data/db.sqlite3"
PG_CONN="${PG_CONN:-}"
if [ -z "$PG_CONN" ]; then
  echo "PG_CONN is not set" >&2
  exit 1
fi

TMPDIR=$(mktemp -d)
echo "Using temp dir: $TMPDIR"

export PGPASSWORD=""

tables=(usuarios empresas planos assinaturas email_tokens)

for t in "${tables[@]}"; do
  echo "Processing table: $t"
  csvfile="$TMPDIR/${t}.csv"
  # export to csv (ignore errors if table missing)
  sqlite3 -header -csv "$SQLITE" "SELECT * FROM $t;" > "$csvfile" || true
  # if file has content (header + rows) then import
  if [ -s "$csvfile" ] && [ $(wc -l < "$csvfile") -gt 1 ]; then
    echo "Importing $t into Postgres..."
    psql "$PG_CONN" -c "\copy $t FROM '$csvfile' CSV HEADER"
  else
    echo "No data to import for $t (or table missing). Skipping.";
  fi
done

echo "Cleaning up"
rm -rf "$TMPDIR"
echo "Import finished"
