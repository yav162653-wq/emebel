$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$composeFile = Join-Path $projectRoot "docker-compose.test.yml"
$projectName = "emebel-recovery-$([guid]::NewGuid().ToString('N').Substring(0, 8))"
$composeArgs = @("--project-name", $projectName, "-f", $composeFile)
$databaseUrl = "postgresql://postgres:disposable-test-only@127.0.0.1:55437/emebel_test"
$composeAttempted = $false

try {
  Set-Location $projectRoot
  $env:DATABASE_URL = $databaseUrl
  $env:MIGRATION_DATABASE_URL = $databaseUrl
  $composeAttempted = $true
  docker compose @composeArgs up --detach --wait
  if ($LASTEXITCODE -ne 0) { throw "Disposable PostgreSQL did not become ready" }

  npx prisma migrate deploy
  if ($LASTEXITCODE -ne 0) { throw "Prisma migration deployment failed" }

  docker compose @composeArgs exec -T postgres psql -U postgres -d emebel_test `
    -v ON_ERROR_STOP=1 `
    -c "CREATE TABLE recovery_probe (id integer PRIMARY KEY, marker text NOT NULL); INSERT INTO recovery_probe VALUES (1, 'recovery-ok');"
  if ($LASTEXITCODE -ne 0) { throw "Could not create disposable recovery marker" }

  docker compose @composeArgs exec -T postgres pg_dump -U postgres `
    --format=custom --file=/tmp/emebel-recovery.dump emebel_test
  if ($LASTEXITCODE -ne 0) { throw "Disposable PostgreSQL backup failed" }

  docker compose @composeArgs exec -T postgres createdb -U postgres emebel_restore
  if ($LASTEXITCODE -ne 0) { throw "Could not create isolated restore database" }

  docker compose @composeArgs exec -T postgres pg_restore -U postgres `
    --no-owner --exit-on-error --dbname=emebel_restore /tmp/emebel-recovery.dump
  if ($LASTEXITCODE -ne 0) { throw "Disposable PostgreSQL restore failed" }

  $restoredMarker = docker compose @composeArgs exec -T postgres psql -U postgres `
    -d emebel_restore -t -A -v ON_ERROR_STOP=1 `
    -c "SELECT marker FROM recovery_probe WHERE id = 1"
  if ($LASTEXITCODE -ne 0 -or $restoredMarker.Trim() -ne "recovery-ok") {
    throw "Restored database did not contain the recovery marker"
  }

  $sourceMigrations = docker compose @composeArgs exec -T postgres psql -U postgres `
    -d emebel_test -t -A -v ON_ERROR_STOP=1 `
    -c "SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL"
  $restoredMigrations = docker compose @composeArgs exec -T postgres psql -U postgres `
    -d emebel_restore -t -A -v ON_ERROR_STOP=1 `
    -c "SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL"
  if ($LASTEXITCODE -ne 0 -or $sourceMigrations.Trim() -ne $restoredMigrations.Trim()) {
    throw "Restored migration journal does not match the source backup"
  }

  $env:MIGRATION_DATABASE_URL = "postgresql://postgres:disposable-test-only@127.0.0.1:55437/emebel_restore"
  npx prisma migrate status
  if ($LASTEXITCODE -ne 0) { throw "Restored database migration status failed" }
}
finally {
  if ($composeAttempted) {
    docker compose @composeArgs down --remove-orphans
    if ($LASTEXITCODE -ne 0) {
      Write-Warning "Disposable recovery database cleanup failed; inspect Compose project $projectName"
    }
  }
}
