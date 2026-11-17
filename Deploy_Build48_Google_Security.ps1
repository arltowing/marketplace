$ErrorActionPreference="Continue"
if(Test-Path variable:PSNativeCommandUseErrorActionPreference){$PSNativeCommandUseErrorActionPreference=$false}
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$dir=Join-Path $root 'neon-function'
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
npm install -g neon@latest
Push-Location $dir
try{
 npm install
 neon link --project-id sparkling-bread-64139319 --branch-id br-fancy-fire-ayw6kkh2
 node .\run-migration.mjs
 neon function deploy marketplaceapi --src .\marketplace-api.ts
 Write-Host "Build48 deployed. Existing Neon invocation URL remains linked to marketplaceapi." -ForegroundColor Green
}finally{Pop-Location}
Read-Host "Press Enter to close"
