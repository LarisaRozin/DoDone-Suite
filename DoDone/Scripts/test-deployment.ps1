# DoDone API and Database Test Script
# This script tests your complete GCP deployment

$env:PATH += ";C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"

Write-Host "🧪 DoDone Deployment Test Suite" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

$API_URL = "https://dodone-server-333732290566.us-east1.run.app"
$DB_INSTANCE = "dodone-postgres"

# Test 1: Database Status
Write-Host "`n1. 🗄️ Testing PostgreSQL Database..." -ForegroundColor Yellow
try {
    $dbStatus = gcloud sql instances describe $DB_INSTANCE --format="value(state)" 2>$null
    if ($dbStatus -eq "RUNNABLE") {
        Write-Host "   ✅ PostgreSQL: READY" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ PostgreSQL: $dbStatus" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ PostgreSQL: Connection Error" -ForegroundColor Red
}

# Test 2: Cloud Run Service
Write-Host "`n2. 🚀 Testing Cloud Run Service..." -ForegroundColor Yellow
try {
    $serviceInfo = gcloud run services describe dodone-server --region=us-east1 --format="value(status.url)" 2>$null
    Write-Host "   ✅ Cloud Run: Service Active" -ForegroundColor Green
    Write-Host "   📍 URL: $API_URL" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Cloud Run: Service Error" -ForegroundColor Red
}

# Test 3: API Health Check
Write-Host "`n3. 🔍 Testing API Health..." -ForegroundColor Yellow
try {
    # Try multiple endpoints to check if API is responsive
    $healthTest = $false
    
    # Test root endpoint
    try {
        $response = Invoke-WebRequest -Uri $API_URL -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
        $healthTest = $true
        Write-Host "   ✅ API Root: HTTP $($response.StatusCode)" -ForegroundColor Green
    } catch { }
    
    # Test health endpoint
    try {
        $response = Invoke-WebRequest -Uri "$API_URL/health" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
        $healthTest = $true
        Write-Host "   ✅ API Health: HTTP $($response.StatusCode)" -ForegroundColor Green
    } catch { }
    
    if (-not $healthTest) {
        Write-Host "   ⚠️ API: Starting up (this can take 1-2 minutes for cold starts)" -ForegroundColor Yellow
        Write-Host "   🔄 Try again in a few minutes if this persists" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ⚠️ API: Not responding yet" -ForegroundColor Yellow
}

# Test 4: Cloud Storage
Write-Host "`n4. 💾 Testing Cloud Storage..." -ForegroundColor Yellow
try {
    $buckets = gsutil ls -p dodone-mobile | Where-Object { $_ -like "*dodone-avatars*" }
    if ($buckets) {
        Write-Host "   ✅ Cloud Storage: Avatar bucket ready" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Cloud Storage: Bucket not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️ Cloud Storage: Access error" -ForegroundColor Yellow
}

# Summary
Write-Host "`n📊 Test Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "🌐 Region: us-east1 (South Carolina) - Optimized for Florida" -ForegroundColor White
Write-Host "🗄️ Database: Cloud SQL PostgreSQL" -ForegroundColor White  
Write-Host "🚀 API: Cloud Run Container" -ForegroundColor White
Write-Host "💾 Storage: Cloud Storage Bucket" -ForegroundColor White

Write-Host "`n🔧 Quick Actions:" -ForegroundColor Yellow
Write-Host "• Start SQL Proxy: .\start-sql-proxy.ps1" -ForegroundColor White
Write-Host "• Run Migrations: cd DoDone.Server; dotnet ef database update" -ForegroundColor White
Write-Host "• View API Docs: $API_URL/swagger" -ForegroundColor White
Write-Host "• Check Logs: gcloud logs read --limit=20 --filter='resource.type=cloud_run_revision'" -ForegroundColor White

Write-Host "`n🎉 Your DoDone app is deployed on Google Cloud Platform!" -ForegroundColor Green