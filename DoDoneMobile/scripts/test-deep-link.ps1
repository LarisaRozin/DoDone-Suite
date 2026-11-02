# Test script for deep linking on Windows
# Usage: .\test-deep-link.ps1

Write-Host "Testing deep link for password reset..." -ForegroundColor Green
Write-Host "Make sure your app is installed and running in debug mode" -ForegroundColor Yellow
Write-Host ""

# Example deep link URL
$DEEP_LINK = "dodone://reset-password?token=test-token-12345&email=test@example.com"

Write-Host "Testing deep link: $DEEP_LINK" -ForegroundColor Cyan
Write-Host ""

# For Android (using adb)
Write-Host "Sending deep link to Android device/emulator..." -ForegroundColor Green

try {
    & adb shell am start -W -a android.intent.action.VIEW -d "$DEEP_LINK" com.dodoneMobile
    Write-Host ""
    Write-Host "Deep link sent successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure adb is in your PATH and device is connected" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "If the app opened to the Reset Password screen, deep linking is working!" -ForegroundColor Green
Write-Host "If not, check:" -ForegroundColor Yellow
Write-Host "1. App is installed and running" -ForegroundColor White
Write-Host "2. Android manifest has the correct intent filter" -ForegroundColor White
Write-Host "3. Navigation configuration is set up correctly" -ForegroundColor White
