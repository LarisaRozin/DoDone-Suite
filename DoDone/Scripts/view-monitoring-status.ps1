# DoDone Monitoring & Alerts Summary
# View all configured alerts and budgets

$PROJECT_ID = "dodone-mobile"
$BILLING_ACCOUNT = "0134AB-85CC2F-452610"

Write-Host "`n=== DoDone Monitoring & Alerts Status ===" -ForegroundColor Green
Write-Host ""

# List all alert policies
Write-Host "📊 Alert Policies (18 total):" -ForegroundColor Cyan
gcloud alpha monitoring policies list --project=$PROJECT_ID --format="table(displayName,enabled)" --sort-by=displayName

# List budgets
Write-Host "`n💰 Budget Alerts:" -ForegroundColor Cyan
gcloud billing budgets list --billing-account=$BILLING_ACCOUNT --format="table(displayName,amount.specifiedAmount.units,amount.specifiedAmount.currencyCode)"

# List notification channels
Write-Host "`n📧 Notification Channels:" -ForegroundColor Cyan
gcloud alpha monitoring channels list --project=$PROJECT_ID --format="table(displayName,type,labels.email_address)"

Write-Host "`n=== Alert Categories ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "Critical Infrastructure:" -ForegroundColor Cyan
Write-Host "  ✓ Cloud SQL Disk Space Critical (<20% free)"
Write-Host "  ✓ Cloud Run 5xx Server Errors"
Write-Host "  ✓ Cloud Run High Request Latency (p95 >2s)"
Write-Host "  ✓ Cloud Run Max Instances Reached"
Write-Host ""
Write-Host "Database Connection Management:" -ForegroundColor Cyan
Write-Host "  ✓ PostgreSQL Connection Slots Exhausted"
Write-Host "  ✓ DB Connections Critical (>45)"
Write-Host "  ✓ DB Connections Over 40"
Write-Host "  ✓ DB CPU/Memory Utilization"
Write-Host ""
Write-Host "Background Jobs:" -ForegroundColor Cyan
Write-Host "  ✓ Periodic Tasks Job Failed"
Write-Host "  ✓ Cloud Scheduler Job Failed"
Write-Host ""
Write-Host "Application Health:" -ForegroundColor Cyan
Write-Host "  ✓ Application Critical Errors"
Write-Host "  ✓ Email Delivery Failures"
Write-Host "  ✓ Unusual Authentication Activity"
Write-Host "  ✓ Cloud SQL Backup Failed"
Write-Host "  ✓ Error rate threshold"
Write-Host ""
Write-Host "Resource Monitoring:" -ForegroundColor Cyan
Write-Host "  ✓ Container High CPU/Memory Utilization"
Write-Host ""
Write-Host "Cost Management:" -ForegroundColor Cyan
Write-Host "  ✓ Monthly Budget Alert ($100)"
Write-Host "    - 50% threshold: $50"
Write-Host "    - 75% threshold: $75"
Write-Host "    - 90% threshold: $90"
Write-Host "    - 100% threshold: $100"
Write-Host ""
Write-Host "All alerts send notifications to: larisarozinworks@gmail.com" -ForegroundColor Green
Write-Host ""
