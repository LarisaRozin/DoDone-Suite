# Domain Configuration Script for DoDone Production
# Run this script after purchasing and configuring your domain

param(
    [Parameter(Mandatory=$false)]
    [string]$Domain = "dodoneapp.com"
)

Write-Host "=== DoDone Domain Configuration Script ===" -ForegroundColor Green
Write-Host "Domain: $Domain" -ForegroundColor Yellow
Write-Host ""

# Step 1: Configure Firebase Hosting custom domain
Write-Host "1. Configure Firebase Hosting custom domain" -ForegroundColor Cyan
Write-Host "   Run: firebase hosting:sites:create $Domain" -ForegroundColor White
Write-Host "   Then: Add custom domain in Firebase Console" -ForegroundColor White
Write-Host "   URL: https://console.firebase.google.com/project/dodone-mobile/hosting/main" -ForegroundColor White
Write-Host ""

# Step 2: Configure Cloud Run domain mapping  
Write-Host "2. Configure Cloud Run API subdomain" -ForegroundColor Cyan
Write-Host "   Run: gcloud run domain-mappings create --service dodone-server --domain api.$Domain --region us-east1" -ForegroundColor White
Write-Host ""

# Step 3: DNS Configuration
Write-Host "3. DNS Configuration Required:" -ForegroundColor Cyan
Write-Host "   A Record: $Domain -> Firebase IP addresses" -ForegroundColor White
Write-Host "   CNAME: api.$Domain -> ghs.googlehosted.com" -ForegroundColor White
Write-Host "   Or A Record: api.$Domain -> Cloud Run IP" -ForegroundColor White
Write-Host ""

# Step 4: Update application configuration
Write-Host "4. Update Application Configuration:" -ForegroundColor Cyan
Write-Host "   - Update .env.production with new domain URLs" -ForegroundColor White
Write-Host "   - Update appsettings.Production.json email settings" -ForegroundColor White
Write-Host "   - Redeploy both frontend and backend" -ForegroundColor White
Write-Host ""

# Step 5: Email configuration
Write-Host "5. Email Configuration:" -ForegroundColor Cyan
Write-Host "   - Set up business email: noreply@$Domain" -ForegroundColor White  
Write-Host "   - Update Cloud Run environment variables" -ForegroundColor White
Write-Host "   - Test email functionality" -ForegroundColor White
Write-Host ""

Write-Host "Domain setup checklist created!" -ForegroundColor Green
Write-Host "Next: Configure DNS settings with your domain provider" -ForegroundColor Yellow