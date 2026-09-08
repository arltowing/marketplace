param(
  [string]$ProjectId = "sparkling-bread-64139319",
  [string]$BranchId = "br-fancy-fire-ayw6kkh2",
  [string]$FunctionName = "marketplace-api"
)
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
if (Test-Path variable:PSNativeCommandUseErrorActionPreference) { $PSNativeCommandUseErrorActionPreference = $false }
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$functionDir = Join-Path $root "neon-function"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js 20 or later is required." }
Write-Host "Installing the latest Neon CLI..." -ForegroundColor Cyan
npm install -g neon@latest
if ($LASTEXITCODE -ne 0) { throw "Neon CLI installation failed." }
Write-Host "Signing in to Neon if required..." -ForegroundColor Cyan
try { neon projects list | Out-Null } catch { neon login }
Push-Location $functionDir
try {
  npm install
  if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
  neon link --project-id $ProjectId --branch-id $BranchId
  if ($LASTEXITCODE -ne 0) { throw "Neon project link failed." }
  Write-Host "Deploying $FunctionName directly to Neon Functions..." -ForegroundColor Cyan
  neon function deploy $FunctionName --src .\marketplace-api.ts
  if ($LASTEXITCODE -ne 0) { throw "Neon Function deployment failed." }
  $details = (neon functions get $FunctionName -o yaml 2>&1 | Out-String)
  Write-Host $details
  $match = [regex]::Match($details, 'https://[^\s"'']+')
  $url = if ($match.Success) { $match.Value.TrimEnd('/') } else { Read-Host "Paste the invocation URL shown by Neon" }
  if ($url -notmatch '^https://') { throw "A valid Neon invocation URL was not supplied." }
  $config = "/* Neon Function API */`r`nwindow.TCS_API_BASE='$url';`r`n"
  Set-Content -LiteralPath (Join-Path $root 'api-config.js') -Value $config -Encoding UTF8
  Write-Host "`nSUCCESS" -ForegroundColor Green
  Write-Host "Neon Function URL: $url"
  Write-Host "api-config.js was updated. Upload the complete marketplace-main folder to GitHub."
  Write-Host "Do not upload node_modules."
} finally { Pop-Location }
Read-Host "Press Enter to close"
