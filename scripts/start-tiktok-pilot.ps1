$ErrorActionPreference = 'Stop'
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
  docker compose --env-file .env.docker -f compose.yaml -f compose.tiktok-pilot.yaml up -d --build
  if ($LASTEXITCODE -ne 0) { throw 'Docker indisponível ou build falhou. Verifique o Docker Desktop; não resete os volumes.' }
  docker compose --env-file .env.docker -f compose.yaml -f compose.tiktok-pilot.yaml ps
} finally { Pop-Location }
