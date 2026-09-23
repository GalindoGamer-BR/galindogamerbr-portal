#!/bin/sh
set -eu
attempt=0
until [ "$(psql -h db -U postgres -Atc "select to_regclass('realtime.messages') is not null")" = "t" ]; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then echo "Realtime schema not ready" >&2; exit 1; fi
  sleep 1
done
for file in /migrations/*.sql; do
  psql -h db -U postgres -v ON_ERROR_STOP=1 -f "$file"
done
psql -h db -U postgres -v ON_ERROR_STOP=1 -f /realtime.sql
psql -h db -U postgres -c "NOTIFY pgrst, 'reload schema';"
