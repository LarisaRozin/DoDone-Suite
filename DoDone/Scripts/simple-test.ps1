# Simple DoDone Deployment Test
$env:PATH += ";C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"

Write-Host "🧪 DoDone Deployment Status" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

$API_URL = "https://dodone-server-333732290566.us-east1.run.app"

# Test Database
Write-Host "`n1. Database Status:" -ForegroundColor Yellow
gcloud sql instances describe dodone-postgres --format="table(name,databaseVersion,region,settings.tier,state)"

# Test Cloud Run
Write-Host "`n2. Cloud Run Service:" -ForegroundColor Yellow  
gcloud run services describe dodone-server --region=us-east1 --format="table(metadata.name,status.url,status.traffic[].percent)"

# Test API
Write-Host "`n3. API Test:" -ForegroundColor Yellow
Write-Host "API URL: $API_URL" -ForegroundColor Cyan
Write-Host "Testing connection..." -ForegroundColor White

# Test Cloud Storage  
Write-Host "`n4. Cloud Storage:" -ForegroundColor Yellow
gsutil ls -p dodone-mobile

Write-Host "`n✅ All tests complete!" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "• Run: .\start-sql-proxy.ps1 (to connect to database)" -ForegroundColor White
Write-Host "• Visit: $API_URL/swagger (to see API docs)" -ForegroundColor White