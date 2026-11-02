# Monitor Google Play Webhooks
# This script helps monitor webhook activity in real-time
#
# sandbox: .\Scripts\monitor-google-play-webhooks.ps1 -Environment sandbox -Follow


param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = "dodone-mobile",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("production", "sandbox")]
    [string]$Environment = "sandbox",
    
    [Parameter(Mandatory=$false)]
    [int]$Lines = 50,
    
    [Parameter(Mandatory=$false)]
    [switch]$Follow
)

$serviceName = if ($Environment -eq "sandbox") { "dodone-server-sandbox" } else { "dodone-server" }
$region = "us-east1"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Google Play Webhook Monitor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Service:     $serviceName" -ForegroundColor Yellow
Write-Host "Region:      $region" -ForegroundColor Yellow
Write-Host ""

if ($Follow) {
    Write-Host "Following logs (Ctrl+C to stop)..." -ForegroundColor Green
    Write-Host ""
    
    # Stream logs in real-time
    gcloud alpha run services logs tail $serviceName `
        --region=$region `
        --project=$ProjectId `
        --format="table(timestamp,severity,textPayload)" | 
        Select-String -Pattern "webhook|google|play|subscription|notification" -CaseSensitive:$false
        
} else {
    Write-Host "Fetching last $Lines log entries..." -ForegroundColor Green
    Write-Host ""
    
    # Get recent logs
    gcloud run services logs read $serviceName `
        --region=$region `
        --project=$ProjectId `
        --limit=$Lines `
        --format="table(timestamp,severity,textPayload)" |
        Select-String -Pattern "webhook|google|play|subscription|notification" -CaseSensitive:$false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Key Log Messages to Look For:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Received Google Play webhook notification" -ForegroundColor Green
Write-Host "  Webhook endpoint was called" -ForegroundColor Gray
Write-Host ""
Write-Host "Processing Google Play notification type: X" -ForegroundColor Green
Write-Host "   Notification was decoded successfully" -ForegroundColor Gray
Write-Host ""
Write-Host "Successfully processed Google Play notification for team XXX" -ForegroundColor Green
Write-Host "   Team subscription was updated" -ForegroundColor Gray
Write-Host ""
Write-Host "Failed to verify and decode Google Play notification" -ForegroundColor Red
Write-Host "   Check base64 encoding or message format" -ForegroundColor Gray
Write-Host ""
Write-Host "No team found for purchase token" -ForegroundColor Red
Write-Host "   Purchase wasn't verified via /api/subscriptions/verify first" -ForegroundColor Gray
Write-Host ""
Write-Host "Failed to verify purchase token with Google Play API" -ForegroundColor Red
Write-Host "   Check service account credentials" -ForegroundColor Gray
Write-Host ""

Write-Host "To follow logs in real-time, use:" -ForegroundColor White
Write-Host "  .\monitor-google-play-webhooks.ps1 -Follow" -ForegroundColor Cyan
Write-Host ""
Write-Host "To check Pub/Sub subscription status:" -ForegroundColor White
Write-Host "  gcloud pubsub subscriptions describe google-play-subscriptions-push --project=$ProjectId" -ForegroundColor Cyan
Write-Host ""
