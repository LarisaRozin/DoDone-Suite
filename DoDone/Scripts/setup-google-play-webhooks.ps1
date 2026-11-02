# Setup Google Play Webhook Infrastructure
# This script creates the necessary Google Cloud Pub/Sub resources for receiving
# Google Play Real-time Developer Notifications
#
#
# sandbox:.\Scripts\setup-google-play-webhooks.ps1 -WebhookUrl "https://dodone-server-sandbox-333732290566.us-east1.run.app" -Environment sandbox 
# production:.\Scripts\setup-google-play-webhooks.ps1 -WebhookUrl "https://dodone-server-333732290566.us-east1.run.app" -Environment production

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = "dodone-mobile",
    
    [Parameter(Mandatory=$true)]
    [string]$WebhookUrl,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("production", "sandbox", "webhooks")]
    [string]$Environment = "production"
)

# Set environment-specific topic and subscription names
$TopicName = "play-subscriptions-$Environment"
$SubscriptionName = "play-subscriptions-$Environment-push"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Google Play Webhook Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project:      $ProjectId" -ForegroundColor Yellow
Write-Host "Environment:  $Environment" -ForegroundColor Yellow
Write-Host "Topic:        $TopicName" -ForegroundColor Cyan
Write-Host "Subscription: $SubscriptionName" -ForegroundColor Cyan
Write-Host "Webhook URL:  $WebhookUrl" -ForegroundColor Yellow
Write-Host ""

# Confirm before proceeding
$confirm = Read-Host "Continue with setup? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Setup cancelled." -ForegroundColor Red
    exit
}

# Step 1: Create Pub/Sub Topic
Write-Host ""
Write-Host "Step 1: Creating Pub/Sub topic..." -ForegroundColor Green

$topicExists = gcloud pubsub topics describe $TopicName --project=$ProjectId 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Topic already exists" -ForegroundColor Yellow
} else {
    gcloud pubsub topics create $TopicName --project=$ProjectId
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Topic created successfully" -ForegroundColor Green
    } else {
        Write-Host "Failed to create topic" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Grant Google Play permission to publish
Write-Host ""
Write-Host "Step 2: Granting Google Play permission to publish..." -ForegroundColor Green

gcloud pubsub topics add-iam-policy-binding $TopicName `
    --member="serviceAccount:google-play-developer-notifications@system.gserviceaccount.com" `
    --role="roles/pubsub.publisher" `
    --project=$ProjectId

if ($LASTEXITCODE -eq 0) {
    Write-Host "Permissions granted successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to grant permissions" -ForegroundColor Red
    exit 1
}

# Step 3: Create Push Subscription
Write-Host ""
Write-Host "Step 3: Creating push subscription..." -ForegroundColor Green

$subscriptionExists = gcloud pubsub subscriptions describe $SubscriptionName --project=$ProjectId 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Subscription already exists. Updating..." -ForegroundColor Yellow
    
    # Update the push endpoint
    gcloud pubsub subscriptions update $SubscriptionName `
        --push-endpoint="$WebhookUrl/api/webhooks/google-play-subscription" `
        --project=$ProjectId
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Subscription updated successfully" -ForegroundColor Green
    } else {
        Write-Host "Failed to update subscription" -ForegroundColor Red
        exit 1
    }
} else {
    gcloud pubsub subscriptions create $SubscriptionName `
        --topic=$TopicName `
        --push-endpoint="$WebhookUrl/api/webhooks/google-play-subscription" `
        --ack-deadline=600 `
        --project=$ProjectId
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Subscription created successfully" -ForegroundColor Green
    } else {
        Write-Host "Failed to create subscription" -ForegroundColor Red
        exit 1
    }
}

# Step 4: Verify setup
Write-Host ""
Write-Host "Step 4: Verifying setup..." -ForegroundColor Green

Write-Host ""
Write-Host "Topic Details:" -ForegroundColor Cyan
gcloud pubsub topics describe $TopicName --project=$ProjectId

Write-Host ""
Write-Host "Subscription Details:" -ForegroundColor Cyan
gcloud pubsub subscriptions describe $SubscriptionName --project=$ProjectId

# Step 5: Display next steps
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configure Google Play Console:" -ForegroundColor White
Write-Host "   - Go to: https://play.google.com/console" -ForegroundColor Gray
Write-Host "   - Navigate to: Monetization setup -> Real-time developer notifications" -ForegroundColor Gray
Write-Host "   - Enable Real-time developer notifications" -ForegroundColor Gray
Write-Host "   - Topic name: projects/$ProjectId/topics/$TopicName" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Send a test notification from Google Play Console to verify" -ForegroundColor White
Write-Host ""
Write-Host "3. Monitor webhook logs:" -ForegroundColor White
Write-Host "   gcloud run services logs read dodone-server --region=us-east1 --limit=50 --project=$ProjectId | Select-String 'webhook|google play'" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test with a real subscription purchase (accelerated billing for testing)" -ForegroundColor White
Write-Host ""
Write-Host "For detailed testing instructions, see:" -ForegroundColor White
Write-Host "   Doc/GOOGLE_PLAY_WEBHOOK_TESTING_GUIDE.md" -ForegroundColor Cyan
Write-Host ""

# Optional: Display current Cloud Run URL if not provided
if (-not $WebhookUrl.StartsWith("http")) {
    Write-Host "Warning: Webhook URL should start with https://" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To get your Cloud Run URL:" -ForegroundColor White
    Write-Host "  gcloud run services describe dodone-server --region=us-east1 --format='value(status.url)' --project=$ProjectId" -ForegroundColor Gray
    Write-Host ""
}
