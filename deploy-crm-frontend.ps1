# Deploy the Klypto CRM frontend to EC2.
#
# This is a static Vite SPA, not a Next.js app -- Nginx serves the built
# dist/ files directly, so there is no PM2 process for the frontend at all
# (unlike BIM's Next.js, which needs a live Node server). Separate from
# bimdesignsoftware in every way: own repo, own server directory
# (~/klypto-crm), own Nginx site file.
#
#   powershell -ExecutionPolicy Bypass -File .\deploy-crm-frontend.ps1
param([string]$EC2_IP = "3.108.132.233")
$ErrorActionPreference = "Stop"

$KEY  = "D:\WORK\bimsoftware-key.pem"
$REPO = "D:\WORK\klypto-crm"
# sslip.io resolves this hostname to $EC2_IP with no DNS setup, matching the
# pattern already used for the BIM staging site on this box.
$CRM_HOST = "crm.$EC2_IP.sslip.io"
$TARBALL = "crm-frontend-dist.tar.gz"

Write-Host ""
Write-Host "==> [1/4] Building the frontend" -ForegroundColor Cyan
Set-Location $REPO
if (-not (Test-Path node_modules)) {
    Write-Host "    installing dependencies (first run only)" -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
}

# VITE_API_URL is a build-time value: Vite inlines it into the static bundle
# and the browser never re-reads it afterward. It must point at this CRM's
# own origin -- the backend's CORS check only allows exact matches once
# NODE_ENV=production, so a wrong value here means every API call is
# silently blocked by the browser, not a visible server error.
$env:VITE_API_URL = "http://$CRM_HOST/api"

npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed. Nothing was uploaded." }
if (-not (Test-Path dist\index.html)) { throw "No dist\index.html after build." }

Write-Host ""
Write-Host "==> [2/4] Packing the build" -ForegroundColor Cyan
if (Test-Path $TARBALL) { Remove-Item -Force $TARBALL }
# Bare filename: tar reads a colon in the destination as remote host:path
# syntax and fails before anything reaches the server.
tar -czf $TARBALL -C dist .
# tar exits 1 (not 0) if a file changed mid-read -- a warning, not
# corruption. Only a missing/empty output or a harder failure is fatal.
if ($LASTEXITCODE -ge 2 -or -not (Test-Path $TARBALL) -or (Get-Item $TARBALL).Length -eq 0) {
    throw "Packing dist/ failed (tar exit $LASTEXITCODE)."
}
$sizeMb = [math]::Round((Get-Item $TARBALL).Length / 1MB, 1)
Write-Host "    bundle: $sizeMb MB"

Write-Host ""
Write-Host "==> [3/4] Uploading to $EC2_IP" -ForegroundColor Cyan
$uploaded = $false
foreach ($attempt in 1..3) {
    if ($attempt -gt 1) { Write-Host "    retry $attempt of 3..." -ForegroundColor Yellow }
    scp -o ServerAliveInterval=20 -o ServerAliveCountMax=10 -o ConnectTimeout=30 -C `
        -i $KEY $TARBALL "ubuntu@${EC2_IP}:/home/ubuntu/$TARBALL"
    if ($LASTEXITCODE -eq 0) { $uploaded = $true; break }
    Start-Sleep -Seconds 3
}
Remove-Item -Force $TARBALL
if (-not $uploaded) { throw "Upload failed after 3 attempts." }

Write-Host ""
Write-Host "==> [4/4] Releasing on the server" -ForegroundColor Cyan
# Swap into place beside the live one and only replace it once the new dist
# is confirmed to have an index.html, so a truncated transfer never leaves
# the site half-updated.
$remote = @'
set -e
mkdir -p ~/klypto-crm/dist-staging
rm -rf ~/klypto-crm/dist-staging/*
mkdir -p ~/klypto-crm
tar -xzf ~/crm-frontend-dist.tar.gz -C ~/klypto-crm/dist-staging
rm -f ~/crm-frontend-dist.tar.gz
test -f ~/klypto-crm/dist-staging/index.html
rm -rf ~/klypto-crm/dist-previous
if [ -d ~/klypto-crm/dist ]; then
  mv ~/klypto-crm/dist ~/klypto-crm/dist-previous
fi
mv ~/klypto-crm/dist-staging ~/klypto-crm/dist
sudo nginx -t
sudo systemctl reload nginx
'@
# Same CRLF stripping as the backend script -- PowerShell's pipe writes
# \r\n, which breaks every line of the remote script otherwise.
($remote -replace "`r`n", "`n") | ssh -i $KEY "ubuntu@$EC2_IP" 'bash -s'
if ($LASTEXITCODE -ne 0) { throw "Release failed on the server. The previous build is kept at ~/klypto-crm/dist-previous." }

Write-Host ""
Write-Host "==> Health check" -ForegroundColor Cyan
ssh -i $KEY "ubuntu@$EC2_IP" "curl -s -o /dev/null -w 'crm frontend : %{http_code}\n' --max-time 10 -H 'Host: $CRM_HOST' http://127.0.0.1"

Write-Host ""
Write-Host "Open: http://$CRM_HOST" -ForegroundColor Green
