# DoDone GCP Production Deployment Script
# Deploys to Production environment with secrets from .env.prod.deploy

# Set environment variables
$env:PATH += ";C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"
$PROJECT_ID = "dodone-mobile"
$REGION = "us-east1"
$DB_INSTANCE = "dodone-postgres"
$DB_NAME = "dodone"
$DB_USER = "dodone_user"
$CLOUD_RUN_SERVICE = "dodone-server"
$ENV_FILE = ".env.prod.deploy"

Write-Host "=== DoDone Production Deployment Script ===" -ForegroundColor Green

# Check if environment file exists
if (-not (Test-Path $ENV_FILE)) {
    Write-Host "ERROR: $ENV_FILE file not found!" -ForegroundColor Red
    Write-Host "This file contains required secrets (JWT_KEY, SMTP credentials, etc.)" -ForegroundColor Red
    exit 1
}

Write-Host "Using environment file: $ENV_FILE" -ForegroundColor Cyan

# Step 0: Enable Firestore API (required for dynamic configuration)
Write-Host "`n0. Enabling Google Cloud Firestore API..." -ForegroundColor Yellow
gcloud services enable firestore.googleapis.com --project $PROJECT_ID
Write-Host "   Firestore API enabled" -ForegroundColor Green

# Step 1: Wait for PostgreSQL to be ready
Write-Host "`n1. Checking PostgreSQL instance status..." -ForegroundColor Yellow
do {
    $status = gcloud sql instances describe $DB_INSTANCE --project $PROJECT_ID --format="value(state)" 2>$null
    if ($status -ne "RUNNABLE") {
        Write-Host "   PostgreSQL instance status: $status - waiting..."
        Start-Sleep -Seconds 30
    }
} while ($status -ne "RUNNABLE")

Write-Host "   PostgreSQL instance is ready!" -ForegroundColor Green

# Step 2: Get connection details
Write-Host "`n2. Getting connection details..." -ForegroundColor Yellow
$CONNECTION_NAME = gcloud sql instances describe $DB_INSTANCE --project $PROJECT_ID --format="value(connectionName)"
Write-Host "   Connection Name: $CONNECTION_NAME" -ForegroundColor Cyan

# Step 3: Build and deploy to Cloud Run
Write-Host "`n3. Building and deploying to Cloud Run..." -ForegroundColor Yellow

# Deploy to Cloud Run using --source (builds automatically)
gcloud run deploy $CLOUD_RUN_SERVICE `
    --source . `
    --platform managed `
    --region $REGION `
    --project $PROJECT_ID `
    --env-vars-file $ENV_FILE `
    --add-cloudsql-instances $CONNECTION_NAME `
    --allow-unauthenticated `
    --memory 512Mi `
    --cpu 1 `
    --max-instances 7 `
    --min-instances 0 `
    --timeout 300

if ($LASTEXITCODE -eq 0) {
    # Get Cloud Run URL
    $CLOUD_RUN_URL = gcloud run services describe $CLOUD_RUN_SERVICE --platform managed --region $REGION --project $PROJECT_ID --format "value(status.url)"
    
    Write-Host "`n=== Deployment Complete! ===" -ForegroundColor Green
    Write-Host "Cloud Run URL: $CLOUD_RUN_URL" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Test the deployment: $CLOUD_RUN_URL/health" 
    Write-Host "2. Update React app API URL if needed: $CLOUD_RUN_URL"
    Write-Host "3. Run migrations if database schema changed"
    Write-Host "4. Initialize Firestore configuration (first deployment only):" -ForegroundColor Cyan
    Write-Host "   .\Scripts\Initialize-FirestoreConfig.ps1 -Environment Production" -ForegroundColor White
    Write-Host ""
    Write-Host "Webhook URLs:" -ForegroundColor Cyan
    Write-Host "  Apple:  $CLOUD_RUN_URL/api/webhooks/apple" -ForegroundColor White
    Write-Host "  Google: $CLOUD_RUN_URL/api/webhooks/google-play-subscription" -ForegroundColor White
    Write-Host ""
    Write-Host "Configuration Management:" -ForegroundColor Cyan
    Write-Host "  • View current config: gcloud firestore documents get config/production --project $PROJECT_ID" -ForegroundColor White
    Write-Host "  • Edit config: Use Firestore Console at https://console.cloud.google.com/firestore" -ForegroundColor White
    Write-Host "  • Changes take effect within 30 seconds without redeployment" -ForegroundColor White
} else {
    Write-Host "`nProduction deployment failed!" -ForegroundColor Red
    exit 1
}