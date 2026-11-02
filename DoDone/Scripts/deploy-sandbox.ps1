# Deploy DoDone Server to GCP Cloud Run (Sandbox Environment)
# This deploys to a separate sandbox service for testing subscriptions

Write-Host "Deploying DoDone Server to Sandbox environment..." -ForegroundColor Green

# Check if .env.sandbox.deploy exists
if (-not (Test-Path ".env.sandbox.deploy")) {
    Write-Host "ERROR: .env.sandbox.deploy file not found!" -ForegroundColor Red
    Write-Host "This file contains required secrets (JWT_KEY, SMTP credentials, etc.)" -ForegroundColor Red
    exit 1
}

# Enable Firestore API (required for dynamic configuration)
Write-Host "Enabling Google Cloud Firestore API..." -ForegroundColor Yellow
gcloud services enable firestore.googleapis.com --project dodone-mobile
Write-Host "Firestore API enabled" -ForegroundColor Green

# Deploy to Cloud Run with Sandbox environment
gcloud run deploy dodone-server-sandbox `
  --source . `
  --platform managed `
  --region us-east1 `
  --project dodone-mobile `
  --env-vars-file .env.sandbox.deploy `
  --add-cloudsql-instances dodone-mobile:us-east1:dodone-postgres `
  --allow-unauthenticated `
  --min-instances 0 `
  --max-instances 2 `
  --memory 512Mi `
  --cpu 1 `
  --timeout 120 `
  --concurrency 40

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSandbox deployment completed successfully!" -ForegroundColor Green
    Write-Host "`nService URL:" -ForegroundColor Cyan
    $serviceUrl = gcloud run services describe dodone-server-sandbox --region us-east1 --project dodone-mobile --format 'value(status.url)'
    Write-Host $serviceUrl -ForegroundColor White
    Write-Host "`nWebhook URLs:" -ForegroundColor Cyan
    Write-Host "  Apple:  $serviceUrl/api/webhooks/apple" -ForegroundColor White
    Write-Host "  Google: $serviceUrl/api/webhooks/google-play-subscription" -ForegroundColor White
    Write-Host "`nConfiguration Management:" -ForegroundColor Cyan
    Write-Host "  • Initialize Firestore config: .\Scripts\Initialize-FirestoreConfig.ps1 -Environment Sandbox" -ForegroundColor White
    Write-Host "  • View current config: gcloud firestore documents get config/sandbox --project dodone-mobile" -ForegroundColor White
    Write-Host "  • Edit config: Use Firestore Console at https://console.cloud.google.com/firestore" -ForegroundColor White
} else {
    Write-Host "`nSandbox deployment failed!" -ForegroundColor Red
    exit 1
}