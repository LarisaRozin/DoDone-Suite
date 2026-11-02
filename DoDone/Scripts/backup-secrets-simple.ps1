# DoDone Secure Secrets Backup Script
param(
    [string]$BackupPath = "$env:USERPROFILE\Documents\DoDone-Secrets-Backup"
)

Write-Host "=== DoDone Secure Secrets Backup ===" -ForegroundColor Green

# Create backup directory
if (!(Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force
}

# Files to backup
$secretFiles = @(
    ".env",
    ".env.deploy",
    "DoDone.Client/.env.production",
    "_misc/squarespace_backup_codes_larisarozin@gmail.com.txt"
)

# Create timestamped backup
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFolder = "$BackupPath\dodone-secrets-$timestamp"
New-Item -ItemType Directory -Path $backupFolder -Force

Write-Host "Creating backup: $backupFolder" -ForegroundColor Yellow

foreach ($file in $secretFiles) {
    if (Test-Path $file) {
        $fileName = Split-Path $file -Leaf
        $subDir = Split-Path $file -Parent
        
        if ($subDir -and $subDir -ne ".") {
            $destDir = "$backupFolder\$subDir"
            if (!(Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force
            }
            Copy-Item $file "$destDir\$fileName" -Force
        } else {
            Copy-Item $file "$backupFolder\$fileName" -Force
        }
        
        Write-Host "✅ Backed up: $file" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Not found: $file" -ForegroundColor Yellow
    }
}

# Create documentation
$readme = @"
DoDone Production Secrets Backup
Created: $(Get-Date)

CRITICAL INFORMATION:
- GCP Project: dodone-mobile
- Backend: https://dodone-server-333732290566.us-east1.run.app
- Frontend: https://dodone-mobile.web.app
- Domain: dodoneapp.com
- Email: larisarozin@gmail.com

ENVIRONMENT VARIABLES NEEDED:
- JWT_KEY (from .env file)
- SMTP_PASSWORD (from .env file) 
- FROM_EMAIL=noreply@dodoneapp.com
- SMTP_USER=larisarozin@gmail.com

RESTORE INSTRUCTIONS:
1. Copy .env files back to project directories
2. Run: gcloud run services update dodone-server --env-vars-file .env --region us-east1
3. Test: https://dodone-server-333732290566.us-east1.run.app/health

SECURITY: Store this backup in password manager or encrypted cloud storage
"@

$readme | Out-File "$backupFolder\README.txt" -Encoding UTF8

Write-Host " Documentation: README.txt" -ForegroundColor Cyan
Write-Host " Backup complete: $backupFolder" -ForegroundColor Green
Write-Host ""
Write-Host " NEXT STEPS:" -ForegroundColor Red
Write-Host "1. Store backup folder in password manager" -ForegroundColor White
Write-Host "2. Delete local backup after securing" -ForegroundColor White
Write-Host "3. Test restore process" -ForegroundColor White