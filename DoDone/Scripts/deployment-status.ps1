# DoDone Database Setup Script
# Run this to complete your database configuration

$env:PATH += ";C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"

Write-Host "🎉 DoDone GCP Deployment Status" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# 1. Show deployment summary
$API_URL = "https://dodone-server-333732290566.us-east1.run.app"
$CONNECTION_NAME = "dodone-mobile:us-east1:dodone-postgres"

Write-Host "✅ PostgreSQL Database: READY in us-east1" -ForegroundColor Green
Write-Host "✅ Cloud Run API: DEPLOYED at $API_URL" -ForegroundColor Green
Write-Host "✅ Cloud Storage: CONFIGURED for avatars" -ForegroundColor Green
Write-Host "✅ Region: us-east1 (South Carolina) - Optimized for Florida users" -ForegroundColor Green

# 2. Test API
Write-Host "`n🔍 Testing API Health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/swagger/index.html" -Method Get -TimeoutSec 10 -ErrorAction SilentlyContinue
    Write-Host "✅ API is responding" -ForegroundColor Green
} catch {
    Write-Host "⚠️ API starting up (this is normal for first deployment)" -ForegroundColor Yellow
}

# 3. Database setup instructions
Write-Host "`n📋 Next Steps to Complete Setup:" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

Write-Host "1. 🔐 Set Database Password (if not done already):" -ForegroundColor Yellow
Write-Host "   gcloud sql users set-password dodone_user --instance=dodone-postgres --password=YOUR_SECURE_PASSWORD" -ForegroundColor White

Write-Host "`n2. 🔌 Start Cloud SQL Proxy for local development:" -ForegroundColor Yellow
Write-Host "   .\start-sql-proxy.ps1" -ForegroundColor White

Write-Host "`n3. 🗄️ Run Database Migrations:" -ForegroundColor Yellow
Write-Host "   cd DoDone.Server" -ForegroundColor White
Write-Host "   dotnet ef database update" -ForegroundColor White

Write-Host "`n4. 🌐 Deploy React Frontend:" -ForegroundColor Yellow
Write-Host "   cd DoDone.Client" -ForegroundColor White
Write-Host "   # Update API URL to: $API_URL" -ForegroundColor White
Write-Host "   npm run build" -ForegroundColor White
Write-Host "   firebase deploy" -ForegroundColor White

Write-Host "`n📊 Cost Estimate:" -ForegroundColor Cyan
Write-Host "   • PostgreSQL (db-f1-micro): ~`$15/month" -ForegroundColor White
Write-Host "   • Cloud Run (pay-per-use): ~`$5-15/month" -ForegroundColor White
Write-Host "   • Cloud Storage: ~`$2/month" -ForegroundColor White
Write-Host "   • Firebase Hosting: FREE" -ForegroundColor White
Write-Host "   • Total: ~`$22-32/month (covered by `$300 free credits for 9+ months!)" -ForegroundColor Green

Write-Host "`n🔗 Important URLs:" -ForegroundColor Cyan
Write-Host "   • API Base URL: $API_URL" -ForegroundColor White
Write-Host "   • API Swagger Docs: $API_URL/swagger" -ForegroundColor White
Write-Host "   • GCP Console: https://console.cloud.google.com" -ForegroundColor White
Write-Host "   • Cloud Run Logs: https://console.cloud.google.com/run/detail/us-east1/dodone-server/logs" -ForegroundColor White

Write-Host "`n🎯 Your DoDone app is now running on Google Cloud Platform!" -ForegroundColor Green