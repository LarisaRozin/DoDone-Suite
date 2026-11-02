# Cloud SQL Proxy Setup for Local Development
param(
    [string]$InstanceConnectionName = "dodone-mobile:us-east1:dodone-postgres",
    [int]$Port = 5433,
    [switch]$TestOnly
)

$env:PATH += ";C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"

Write-Host "=== Cloud SQL Proxy Setup ===" -ForegroundColor Green

# Check authentication first
$credFile = "$env:APPDATA\gcloud\application_default_credentials.json"
if (-not (Test-Path $credFile)) {
    Write-Host "⚠️ Application Default Credentials not found!" -ForegroundColor Yellow
    Write-Host "Run: gcloud auth application-default login" -ForegroundColor Cyan
    exit 1
}

# Download Cloud SQL Proxy if not exists
$proxyPath = "cloud-sql-proxy.exe"
if (-not (Test-Path $proxyPath)) {
    Write-Host "Downloading Cloud SQL Proxy..." -ForegroundColor Yellow
    # Use the correct download URL for Cloud SQL Proxy v2
    Invoke-WebRequest -Uri "https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.13.0/cloud-sql-proxy.x64.exe" -OutFile $proxyPath
    Write-Host "Cloud SQL Proxy downloaded successfully" -ForegroundColor Green
}

# Start Cloud SQL Proxy
Write-Host "Starting Cloud SQL Proxy..." -ForegroundColor Yellow
Write-Host "Instance: $InstanceConnectionName" -ForegroundColor Cyan
Write-Host "Local Port: $Port" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connection string for local development:" -ForegroundColor Yellow
Write-Host "Host=127.0.0.1;Port=$Port;Database=dodone;Username=dodone_user;Password=DoDoneSecure2024Pass" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the proxy" -ForegroundColor Yellow

# Run the proxy
Write-Host "✅ Authentication verified!" -ForegroundColor Green
if ($TestOnly) {
    Write-Host "Test mode - proxy would start successfully" -ForegroundColor Cyan
    exit 0
}

$proxyArgs = @("--port", $Port, $InstanceConnectionName)
Write-Host "Starting proxy: .\cloud-sql-proxy.exe $($proxyArgs -join ' ')" -ForegroundColor Gray
Write-Host "Proxy will run until you press Ctrl+C" -ForegroundColor Yellow

# Start the proxy in foreground so you can see logs and stop with Ctrl+C
& ".\cloud-sql-proxy.exe" @proxyArgs