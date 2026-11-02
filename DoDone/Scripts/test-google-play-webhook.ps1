# Test Google Play Webhook
# This script helps test your Google Play webhook endpoint by simulating a notification
#
# sandbox:.\Scripts\test-google-play-webhook.ps1 -Environment sandbox -NotificationType 1
# production:.\Scripts\test-google-play-webhook.ps1 -Environment production -NotificationType 1

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("local", "sandbox", "production")]
    [string]$Environment = "sandbox",
    
    [Parameter(Mandatory=$false)]
    [string]$LocalUrl = "http://localhost:5000",
    
    [Parameter(Mandatory=$false)]
    [int]$NotificationType = 1,  # 1 = SUBSCRIPTION_PURCHASED
    
    [Parameter(Mandatory=$false)]
    [string]$PurchaseToken = "test-purchase-token-123",
    
    [Parameter(Mandatory=$false)]
    [string]$SubscriptionId = "dodone_pro_monthly"
)

# Define endpoint URLs
$endpoints = @{
    "local" = "$LocalUrl/api/webhooks/google-play-subscription"
    "sandbox" = "https://dodone-server-sandbox-333732290566.us-east1.run.app/api/webhooks/google-play-subscription"
    "production" = "https://dodone-server-333732290566.us-east1.run.app/api/webhooks/google-play-subscription"
}

$webhookUrl = $endpoints[$Environment]

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Google Play Webhook Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment:       $Environment" -ForegroundColor Yellow
Write-Host "Webhook URL:       $webhookUrl" -ForegroundColor Yellow
Write-Host "Notification Type: $NotificationType" -ForegroundColor Yellow
Write-Host "Purchase Token:    $PurchaseToken" -ForegroundColor Yellow
Write-Host "Subscription ID:   $SubscriptionId" -ForegroundColor Yellow
Write-Host ""

# Create test notification payload
$notification = @{
    version = "1.0"
    packageName = "com.larisarozin.dodone"
    eventTimeMillis = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds().ToString()
    subscriptionNotification = @{
        version = "1.0"
        notificationType = $NotificationType
        purchaseToken = $PurchaseToken
        subscriptionId = $SubscriptionId
    }
} | ConvertTo-Json -Depth 10

# Base64 encode the notification (as Google does)
$notificationBytes = [System.Text.Encoding]::UTF8.GetBytes($notification)
$base64Data = [Convert]::ToBase64String($notificationBytes)

# Create Pub/Sub message wrapper
$pubSubMessage = @{
    message = @{
        data = $base64Data
        messageId = "test-message-" + [Guid]::NewGuid().ToString()
        publishTime = [DateTimeOffset]::UtcNow.ToString("o")
    }
    subscription = "projects/dodone-mobile/subscriptions/google-play-subscriptions-push"
} | ConvertTo-Json -Depth 10

Write-Host "Sending test notification..." -ForegroundColor Green
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $webhookUrl `
        -Method Post `
        -Body $pubSubMessage `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✓ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
} catch {
    Write-Host "✗ Failed to send test notification" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Error Details:" -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Notification Type Reference:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 1 = SUBSCRIPTION_PURCHASED" -ForegroundColor Gray
Write-Host " 2 = SUBSCRIPTION_CANCELED" -ForegroundColor Gray
Write-Host " 3 = SUBSCRIPTION_RECOVERED" -ForegroundColor Gray
Write-Host " 4 = SUBSCRIPTION_RENEWED" -ForegroundColor Gray
Write-Host " 5 = SUBSCRIPTION_ON_HOLD" -ForegroundColor Gray
Write-Host " 6 = SUBSCRIPTION_IN_GRACE_PERIOD" -ForegroundColor Gray
Write-Host " 7 = SUBSCRIPTION_RESTARTED" -ForegroundColor Gray
Write-Host "12 = SUBSCRIPTION_REVOKED" -ForegroundColor Gray
Write-Host "13 = SUBSCRIPTION_EXPIRED" -ForegroundColor Gray
Write-Host ""
Write-Host "To test different types, use:" -ForegroundColor White
Write-Host "  .\test-google-play-webhook.ps1 -NotificationType 4 -Environment sandbox" -ForegroundColor Cyan
Write-Host ""
