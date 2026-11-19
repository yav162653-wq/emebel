$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$composeFile = Join-Path $projectRoot "docker-compose.test.yml"
$projectName = "emebel-integration-$([guid]::NewGuid().ToString('N').Substring(0, 8))"
$databaseUrl = "postgresql://postgres:disposable-test-only@127.0.0.1:55437/emebel_test"
$composeArgs = @("--project-name", $projectName, "-f", $composeFile)

$env:INTEGRATION_TEST_DATABASE_URL = $databaseUrl
$env:DATABASE_URL = $databaseUrl
$env:MIGRATION_DATABASE_URL = $databaseUrl
$composeAttempted = $false

try {
  Set-Location $projectRoot
  $composeAttempted = $true
  docker compose @composeArgs up --detach --wait
  if ($LASTEXITCODE -ne 0) { throw "Disposable PostgreSQL did not become ready" }

  npx prisma migrate deploy
  if ($LASTEXITCODE -ne 0) { throw "Prisma migration deployment failed" }

  npx prisma migrate status
  if ($LASTEXITCODE -ne 0) { throw "Prisma migration status check failed" }

  npx tsx --test `
    server/db/cart.race.integration.test.ts `
    server/modules/orders/orders.race.integration.test.ts `
    server/db/migration.integration.test.ts
  if ($LASTEXITCODE -ne 0) { throw "PostgreSQL integration tests failed" }
}
finally {
  if ($composeAttempted) {
    docker compose @composeArgs down --remove-orphans
    if ($LASTEXITCODE -ne 0) {
      Write-Warning "Disposable PostgreSQL cleanup failed; inspect Docker Compose project $projectName"
    }
  }
}
