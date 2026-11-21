#!/usr/bin/env bash
# Runs the database tests on a throwaway local Postgres database:
#   Supabase shim -> all migrations (in order) -> pgTAP tests.
# Needs: psql access to a Postgres 15+ server with pgTAP installed.
#   PGHOST/PGUSER/etc. are respected. Default: local socket as current user.
# With the Supabase CLI and Docker you can instead run:  supabase test db
set -euo pipefail

cd "$(dirname "$0")/.."
DB="gather_test_$$"

createdb "$DB"
trap 'dropdb --if-exists "$DB" >/dev/null 2>&1 || true' EXIT

PSQL=(psql -X -q -v ON_ERROR_STOP=1 -d "$DB")

"${PSQL[@]}" -f supabase/tests/local/supabase-shim.sql >/dev/null
for f in supabase/migrations/*.sql; do
  echo "migrate: $f"
  "${PSQL[@]}" -f "$f" >/dev/null
done
"${PSQL[@]}" -c 'create extension if not exists pgtap with schema extensions' >/dev/null

status=0
for t in supabase/tests/database/*.test.sql; do
  echo "test: $t"
  out=$(psql -X -q -t -A -d "$DB" -v ON_ERROR_STOP=1 -f "$t" 2>&1) || status=1
  echo "$out" | grep -E '^(not ok|ok|#|1\.\.)' | sed 's/^/  /'
  if echo "$out" | grep -qE '^not ok|Looks like|ERROR'; then status=1; echo "$out" | grep -E 'ERROR' || true; fi
done
exit $status
