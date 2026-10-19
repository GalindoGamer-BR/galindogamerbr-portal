#!/usr/bin/env bash
# Copia os DADOS de producao (Supabase) para o Postgres do stack local (compose.yaml do portal).
# Somente leitura em producao (pg_dump). O esquema local vem das migrations; aqui so os dados sao substituidos.
#
# Uso: scripts/dump-prod-to-local.sh [--no-auth] [--dump-only] [--yes]
#   --no-auth    nao copia auth.users/auth.identities (sem dados pessoais de usuarios)
#   --dump-only  so grava o dump em tmp/prod-dump.sql, sem restaurar
#   --yes        nao pede confirmacao antes de apagar os dados locais
# DATABASE_URL: variavel de ambiente ou deploy-platform/github-secrets.env (conexao do pooler, porta 5432).
set -euo pipefail

cd "$(dirname "$0")/.."
SCHEMAS=(public auth_service multichat)
AUTH=1; RESTORE=1; YES=0
for a in "$@"; do
  case "$a" in
    --no-auth) AUTH=0 ;;
    --dump-only) RESTORE=0 ;;
    --yes) YES=1 ;;
    *) echo "opcao desconhecida: $a" >&2; exit 2 ;;
  esac
done

if [ -z "${DATABASE_URL:-}" ]; then
  secrets=../deploy-platform/github-secrets.env
  [ -f "$secrets" ] || { echo "DATABASE_URL ausente e $secrets nao existe" >&2; exit 1; }
  DATABASE_URL=$(grep -E '^DATABASE_URL=' "$secrets" | head -1 | cut -d= -f2- | tr -d '\r"'"'")
fi
[ -n "$DATABASE_URL" ] || { echo "DATABASE_URL vazia" >&2; exit 1; }
export DATABASE_URL

compose=(docker compose --env-file .env.docker)
"${compose[@]}" ps --status running --services 2>/dev/null | grep -qx db \
  || { echo "O Postgres local nao esta rodando: docker compose --env-file .env.docker up -d" >&2; exit 1; }

mkdir -p tmp
dump=tmp/prod-dump.sql
base=(--data-only --no-owner --no-privileges --disable-triggers)
# --table anula --schema no pg_dump: schemas da aplicacao e tabelas do auth saem em execucoes separadas
schema_args=("${base[@]}"); for s in "${SCHEMAS[@]}"; do schema_args+=(--schema="$s"); done
pgdump() { docker run --rm -e DATABASE_URL postgres:17-alpine sh -c 'pg_dump "$DATABASE_URL" "$@"' sh "$@"; }

echo "Baixando dados de producao (somente leitura)..."
pgdump "${schema_args[@]}" > "$dump"
if [ "$AUTH" = 1 ]; then pgdump "${base[@]}" --table=auth.users --table=auth.identities >> "$dump"; fi
echo "Dump salvo em $dump ($(wc -c < "$dump") bytes)"
[ "$RESTORE" = 1 ] || exit 0

if [ "$YES" != 1 ]; then
  read -r -p "Isso APAGA os dados locais de ${SCHEMAS[*]}$([ "$AUTH" = 1 ] && echo ' e auth.users') e os substitui pelos de producao. Continuar? [s/N] " ans
  [ "$ans" = s ] || [ "$ans" = S ] || { echo "Cancelado."; exit 1; }
fi

psql_local=("${compose[@]}" exec -T db psql -U postgres -v ON_ERROR_STOP=1 -q)

echo "Limpando tabelas locais..."
"${psql_local[@]}" <<SQL
DO \$\$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT format('%I.%I', schemaname, tablename) FROM pg_tables
    WHERE schemaname IN ('public','auth_service','multichat')
       OR ($AUTH = 1 AND schemaname = 'auth' AND tablename IN ('users','identities'))
  LOOP
    EXECUTE 'TRUNCATE ' || t || ' RESTART IDENTITY CASCADE';
  END LOOP;
END \$\$;
SQL

echo "Restaurando..."
{ echo "SET session_replication_role = replica;"; cat "$dump"; } | "${psql_local[@]}" --single-transaction
"${psql_local[@]}" -c "NOTIFY pgrst, 'reload schema';"

echo "Pronto. Observacoes:"
echo " - Os segredos locais (JWT/TOKEN_ENCRYPTION_KEY) diferem dos de producao: sessoes antigas nao valem e tokens de plataforma vinculados nao decifram."
echo " - tmp/prod-dump.sql contem dados reais; apague quando nao precisar mais (tmp/ nao deve ir para o git)."
