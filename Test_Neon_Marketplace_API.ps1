$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$config = Get-Content -LiteralPath (Join-Path $root 'api-config.js') -Raw
$m = [regex]::Match($config, "https://[^'\"\s]+")
if (-not $m.Success) { throw "api-config.js does not contain a deployed Neon Function URL." }
$base = $m.Value.TrimEnd('/')
Write-Host "Testing $base" -ForegroundColor Cyan
$health = Invoke-RestMethod "$base/api/health"
$public = Invoke-RestMethod "$base/api/listings/public"
$health | ConvertTo-Json -Depth 6
Write-Host "Approved public adverts: $(@($public).Count)" -ForegroundColor Green
if (-not $health.ok) { throw "Neon health check failed." }
if (-not $health.database.ok) { throw "Neon PostgreSQL check failed." }
if (-not $health.storage.configured) { throw "Neon Object Storage is not configured for the Function." }
Write-Host "Neon database and Function API checks passed." -ForegroundColor Green
Read-Host "Press Enter to close"
