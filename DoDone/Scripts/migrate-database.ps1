# Database Migration Script for GCP Cloud SQL
# Run this script to apply Entity Framework migrations to your Cloud SQL database

param(
    [Parameter(Mandatory=$true)]
    [string]$ConnectionString,
    [string]$MigrationName = ""
)

$env:PATH += ";C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"

Write-Host "=== DoDone Database Migration ===" -ForegroundColor Green

# Navigate to server project
Set-Location "DoDone.Server"

# Set connection string environment variable
$env:ConnectionStrings__DefaultConnection = $ConnectionString

Write-Host "Connection String: $ConnectionString" -ForegroundColor Cyan

# Apply migrations
if ($MigrationName) {
    Write-Host "Applying specific migration: $MigrationName" -ForegroundColor Yellow
    dotnet ef database update $MigrationName
} else {
    Write-Host "Applying all pending migrations..." -ForegroundColor Yellow
    dotnet ef database update
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Database migration failed!" -ForegroundColor Red
    exit 1
}

# Navigate back
Set-Location ".."

Write-Host "Migration script completed." -ForegroundColor Green