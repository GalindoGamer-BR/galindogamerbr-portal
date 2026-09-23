#!/bin/sh
set -eu
psql -v ON_ERROR_STOP=1 --username postgres --dbname postgres --set=pass="$POSTGRES_PASSWORD" <<'SQL'
create role dashboard_user nologin;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create role authenticator login noinherit password :'pass';
grant anon, authenticated, service_role to authenticator;
create role supabase_auth_admin login createrole password :'pass';
create schema auth authorization supabase_auth_admin;
alter role supabase_auth_admin set search_path = auth, public, extensions;
grant usage on schema auth to anon, authenticated, service_role;
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')) $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim', true), ''), nullif(current_setting('request.jwt.claims', true), ''))::jsonb $$;
alter function auth.uid() owner to supabase_auth_admin;
alter function auth.role() owner to supabase_auth_admin;
alter function auth.jwt() owner to supabase_auth_admin;
create role supabase_admin login superuser replication password :'pass';
create schema _realtime authorization supabase_admin;
create schema realtime authorization supabase_admin;
create schema extensions;
create extension if not exists pgcrypto with schema extensions;
grant usage on schema public to anon, authenticated, service_role;
grant all on schema public to service_role;
SQL
