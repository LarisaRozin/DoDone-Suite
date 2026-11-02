# Database Migration Script for DoDone
# Runs Entity Framework migrations against Cloud SQL via proxy

param(
    [int]$Port = 5433
)

$env:PATH += ";C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"

Write-Host "=== DoDone Database Migration ===" -ForegroundColor Green

# Check if proxy is running
$proxyProcess = Get-Process -Name "cloud-sql-proxy" -ErrorAction SilentlyContinue
if ($proxyProcess) {
    Write-Host "Cloud SQL Proxy already running" -ForegroundColor Yellow
} else {
    Write-Host "Starting Cloud SQL Proxy on port $Port..." -ForegroundColor Cyan
    
    # Start proxy in background
    Start-Job -ScriptBlock {
        param($Port)
        Set-Location "C:\aDev\DoDone"
        & ".\cloud-sql-proxy.exe" --port $Port "dodone-mobile:us-east1:dodone-postgres"
    } -ArgumentList $Port -Name "MigrationProxy"
    
    Write-Host "Waiting for proxy to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8
}

# Set connection string
$connectionString = "Host=127.0.0.1;Port=$Port;Database=dodone;Username=dodone_user;Password=DoDoneSecure2024Pass"
$env:ConnectionStrings__DefaultConnection = $connectionString

Write-Host "Connection: localhost:$Port" -ForegroundColor Cyan

# Navigate to server project and run migrations
Set-Location "DoDone.Server"

Write-Host "Running migrations..." -ForegroundColor Green
dotnet ef database update

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migrations completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Migration failed!" -ForegroundColor Red
}

# Return to root directory
Set-Location ".."

# Clean up background proxy if we started it
$job = Get-Job -Name "MigrationProxy" -ErrorAction SilentlyContinue
if ($job) {
    Stop-Job -Name "MigrationProxy" -ErrorAction SilentlyContinue
    Remove-Job -Name "MigrationProxy" -ErrorAction SilentlyContinue
}

Write-Host "Migration script completed" -ForegroundColor Green