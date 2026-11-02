# DoDone Mobile Development Setup Script
# This script configures ADB and system settings for stable device connections

Write-Host "Setting up DoDone Mobile development environment..." -ForegroundColor Green

# Set ADB environment variables for longer timeouts
Write-Host "Configuring ADB timeout settings..." -ForegroundColor Yellow
$env:ADB_SERVER_SOCKET_TIMEOUT = "1800000"  # 30 minutes
$env:ADB_LOCAL_TRANSPORT_MAX_PORT = "5585"

# Kill and restart ADB server with new settings
Write-Host "Restarting ADB server..." -ForegroundColor Yellow
adb kill-server
Start-Sleep -Seconds 2
adb start-server

# Check device connections
Write-Host "Checking connected devices..." -ForegroundColor Yellow
adb devices

Write-Host "`nDevelopment environment setup complete!" -ForegroundColor Green
Write-Host "Tips for maintaining stable connections:" -ForegroundColor Cyan
Write-Host "1. Keep your Android device plugged in and screen on during development" -ForegroundColor White
Write-Host "2. In Android Developer Options, ensure 'Stay awake' is enabled" -ForegroundColor White
Write-Host "3. Set USB configuration to 'File Transfer (MTP)'" -ForegroundColor White
Write-Host "4. Avoid disconnecting USB during active development" -ForegroundColor White

# Optional: Start Metro bundler
$startMetro = Read-Host "`nStart Metro bundler now? (y/n)"
if ($startMetro -eq 'y' -or $startMetro -eq 'Y') {
    Write-Host "Starting Metro bundler..." -ForegroundColor Green
    npm start
}