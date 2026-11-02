# DoDone Worker Deployment Script
# Deploys the periodic tasks worker as a Cloud Run Job

# Set environment variables
$env:PATH += ";C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"

# Add Docker to PATH (try common locations)
$dockerPaths = @(
    "C:\Program Files\Docker\Docker\resources\bin",
    "C:\Program Files\Docker\cli-plugins"
)
foreach ($path in $dockerPaths) {
    if (Test-Path $path) {
        $env:PATH += ";$path"
    }
}

$PROJECT_ID = "dodone-mobile"
$REGION = "us-east1"
$DB_INSTANCE = "dodone-postgres"
$WORKER_IMAGE = "gcr.io/$PROJECT_ID/dodone-worker"
$JOB_NAME = "dodone-periodic-tasks"
$SCHEDULER_NAME = "dodone-tasks-scheduler"
$ENV_FILE = ".env.prod.deploy"

Write-Host "=== DoDone Worker Deployment Script ===" -ForegroundColor Green

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

# Step 1: Build image using Google Cloud Build (no local Docker required)
Write-Host "`n1. Building Docker image using Cloud Build..." -ForegroundColor Yellow
gcloud builds submit --config cloudbuild.worker.yaml --project $PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "Cloud Build failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Get connection details
Write-Host "`n2. Getting Cloud SQL connection details..." -ForegroundColor Yellow
$CONNECTION_NAME = gcloud sql instances describe $DB_INSTANCE --project $PROJECT_ID --format="value(connectionName)"
Write-Host "   Connection Name: $CONNECTION_NAME" -ForegroundColor Cyan

# Step 3: Use env-vars-file instead of parsing manually
Write-Host "`n3. Preparing environment configuration..." -ForegroundColor Yellow

# Step 4: Deploy Cloud Run Job
Write-Host "`n4. Deploying Cloud Run Job..." -ForegroundColor Yellow

# Check if job exists
$jobExists = gcloud run jobs describe $JOB_NAME --region $REGION --project $PROJECT_ID 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Updating existing job..." -ForegroundColor Cyan
    gcloud run jobs update $JOB_NAME `
        --image $WORKER_IMAGE `
        --region $REGION `
        --project $PROJECT_ID `
        --env-vars-file $ENV_FILE `
        --set-cloudsql-instances $CONNECTION_NAME `
        --memory 512Mi `
        --cpu 1 `
        --max-retries 2 `
        --task-timeout 10m
} else {
    Write-Host "   Creating new job..." -ForegroundColor Cyan
    gcloud run jobs create $JOB_NAME `
        --image $WORKER_IMAGE `
        --region $REGION `
        --project $PROJECT_ID `
        --env-vars-file $ENV_FILE `
        --set-cloudsql-instances $CONNECTION_NAME `
        --memory 512Mi `
        --cpu 1 `
        --max-retries 2 `
        --task-timeout 10m
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Cloud Run Job deployment failed!" -ForegroundColor Red
    exit 1
}

# Step 5: Create or update Cloud Scheduler job
Write-Host "`n5. Setting up Cloud Scheduler..." -ForegroundColor Yellow

# Check if scheduler job exists
$schedulerExists = gcloud scheduler jobs describe $SCHEDULER_NAME --location $REGION --project $PROJECT_ID 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Updating existing scheduler job..." -ForegroundColor Cyan
    gcloud scheduler jobs update http $SCHEDULER_NAME `
        --location $REGION `
        --project $PROJECT_ID `
        --schedule "0 */6 * * *" `
        --uri "https://$REGION-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/$PROJECT_ID/jobs/${JOB_NAME}:run" `
        --http-method POST `
        --oauth-service-account-email "${PROJECT_ID}@appspot.gserviceaccount.com"
} else {
    Write-Host "   Creating new scheduler job..." -ForegroundColor Cyan
    gcloud scheduler jobs create http $SCHEDULER_NAME `
        --location $REGION `
        --project $PROJECT_ID `
        --schedule "0 */6 * * *" `
        --uri "https://$REGION-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/$PROJECT_ID/jobs/${JOB_NAME}:run" `
        --http-method POST `
        --oauth-service-account-email "${PROJECT_ID}@appspot.gserviceaccount.com" `
        --description "Triggers DoDone periodic tasks worker every 6 hours"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== Worker Deployment Complete! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Cloud Run Job: $JOB_NAME" -ForegroundColor Cyan
    Write-Host "Schedule: Every 6 hours (0 */6 * * *)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Initialize Firestore configuration (first deployment only):" 
    Write-Host "   .\Scripts\Initialize-FirestoreConfig.ps1 -Environment Production" -ForegroundColor White
    Write-Host "2. Test the job manually:" 
    Write-Host "   gcloud run jobs execute $JOB_NAME --region $REGION --project $PROJECT_ID" -ForegroundColor White
    Write-Host "3. View job executions:" 
    Write-Host "   gcloud run jobs executions list --job $JOB_NAME --region $REGION --project $PROJECT_ID" -ForegroundColor White
    Write-Host "4. View scheduler jobs:" 
    Write-Host "   gcloud scheduler jobs list --location $REGION --project $PROJECT_ID" -ForegroundColor White
    Write-Host "5. Update main server to disable PeriodicTasksService (set EnablePeriodicTasksService: false)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Configuration Management:" -ForegroundColor Cyan
    Write-Host "  • View current config: gcloud firestore documents get config/production --project $PROJECT_ID" -ForegroundColor White
    Write-Host "  • Edit config: Use Firestore Console at https://console.cloud.google.com/firestore" -ForegroundColor White
    Write-Host "  • Worker will pick up changes on next execution cycle" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "`nScheduler setup failed!" -ForegroundColor Red
    exit 1
}
