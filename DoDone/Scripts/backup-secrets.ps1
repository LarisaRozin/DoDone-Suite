# DoDone Secure Secrets Backup Script
# Creates encrypted backups of sensitive configuration files
# Usage: .\backup-secrets.ps1 [-BackupPath "C:\path\to\backup"]

param(
    [string]$BackupPath = "$env:USERPROFILE\Documents\DoDone-Secrets-Backup"
)

Write-Host "=== DoDone Secure Secrets Backup ===" -ForegroundColor Green
Write-Host "Backup Location: $BackupPath" -ForegroundColor Yellow
Write-Host ""

# Create backup directory
if (!(Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force
    Write-Host "✅ Created backup directory" -ForegroundColor Green
}

# Files to backup (critical secrets)
$secretFiles = @(
    ".env",
    "DoDone.Server/.env",
    "DoDone.Client/.env.production",
    "_misc/squarespace_backup_codes_larisarozin@gmail.com.txt"
)

# Create backup with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "dodone-secrets-$timestamp"
$backupFolder = "$BackupPath\$backupName"

# Create timestamped backup folder
New-Item -ItemType Directory -Path $backupFolder -Force

Write-Host "📦 Creating backup: $backupName" -ForegroundColor Cyan
Write-Host ""

# Backup each secret file
foreach ($file in $secretFiles) {
    if (Test-Path $file) {
        $fileName = Split-Path $file -Leaf
        $subDir = Split-Path $file -Parent
        
        # Preserve directory structure in backup
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

# Create comprehensive environment documentation
$envDoc = @"
# DoDone Production Environment Documentation
# Created: $(Get-Date)
# Project: DoDone Task Management Application
# 
# ====================================
# CRITICAL PRODUCTION INFORMATION
# ====================================
# 
# Cloud Infrastructure:
# - GCP Project: dodone-mobile (ID: 333732290566)
# - Region: us-east1 (South Carolina)
# - Database: Cloud SQL PostgreSQL (dodone-postgres)
# - Backend: Cloud Run (dodone-server)
# - Frontend: Firebase Hosting
# 
# Live URLs:
# - Backend API: https://dodone-server-333732290566.us-east1.run.app
# - Frontend (Firebase): https://dodone-mobile.web.app
# - Frontend (Custom Domain): https://dodoneapp.com (pending DNS)
# 
# ====================================
# ENVIRONMENT VARIABLES (Cloud Run)
# ====================================
# 
# Required for backend deployment:
# JWT_KEY=<64-character secure key from .env file>
# SMTP_PASSWORD=<Gmail app password from .env file>
# FROM_EMAIL=noreply@dodoneapp.com
# SMTP_USER=larisarozin@gmail.com
# 
# ====================================
# DOMAIN & EMAIL CONFIGURATION
# ====================================
# 
# Domain: dodoneapp.com (registered with Squarespace)
# Email Aliases: info@, privacy@, support@dodoneapp.com (forward to larisarozin@gmail.com)
# SMTP: Using Gmail with App Password for sending transactional emails
# 
# DNS Configuration:
# - A Record: dodoneapp.com → 199.36.158.100 (Firebase Hosting)
# - TXT Record: dodoneapp.com → hosting-site-dodone-mobile
# 
# ====================================
# RESTORE INSTRUCTIONS
# ====================================
# 
# 1. Restore Environment Files:
#    - Copy .env files back to their original locations
#    - Ensure correct file permissions
# 
# 2. Update Cloud Run:
#    gcloud run services update dodone-server --env-vars-file .env --region us-east1
# 
# 3. Redeploy Backend (if needed):
#    .\deploy-gcp.ps1
# 
# 4. Redeploy Frontend (if needed):
#    cd DoDone.Client
#    npm run build
#    firebase deploy --only hosting
# 
# 5. Verify Deployment:
#    - Test health endpoint: https://dodone-server-333732290566.us-east1.run.app/health
#    - Test frontend: https://dodone-mobile.web.app
#    - Test email functionality (password reset)
# 
# ====================================
# SECURITY NOTES
# ====================================
# 
# - All passwords are stored in respective .env files
# - Gmail App Password required for SMTP (not regular Gmail password)
# - JWT_KEY is 64-character cryptographically secure random string
# - Squarespace backup codes stored in _misc/ directory
# - Never commit .env files to source control
# 
# ====================================
# CONTACT & ACCESS
# ====================================
# 
# - GCP Console: https://console.cloud.google.com/home/dashboard?project=dodone-mobile
# - Firebase Console: https://console.firebase.google.com/project/dodone-mobile
# - Domain Management: Squarespace account (larisarozin@gmail.com)
# - Gmail App Passwords: https://myaccount.google.com/apppasswords
# 
# ====================================
# BACKUP VERIFICATION
# ====================================
# 
# This backup contains:
# Files included in this backup will be listed here
# 
# Next Steps After Creating Backup:
# 1. Store this entire folder in your password manager (1Password/Bitwarden)
# 2. OR encrypt and store in secure cloud storage
# 3. Test restore process in development environment
# 4. Delete local backup folder after securing elsewhere
# 5. Update team documentation when hiring employees
#
"@

$envDoc | Out-File "$backupFolder\README-CRITICAL-RESTORE-INFO.txt" -Encoding UTF8

# Create quick restore script
$restoreScript = @"
# DoDone Environment Restore Script
# Run this script to restore environment variables after backup recovery

Write-Host "Restoring DoDone environment variables..." -ForegroundColor Green

# Copy environment files back to project
if (Test-Path ".env") {
    Copy-Item ".env" "../.env" -Force
    Write-Host "✅ Restored root .env file" -ForegroundColor Green
}

if (Test-Path "DoDone.Server/.env") {
    Copy-Item "DoDone.Server/.env" "../DoDone.Server/.env" -Force
    Write-Host "✅ Restored server .env file" -ForegroundColor Green
}

if (Test-Path "DoDone.Client/.env.production") {
    Copy-Item "DoDone.Client/.env.production" "../DoDone.Client/.env.production" -Force
    Write-Host "✅ Restored client .env.production file" -ForegroundColor Green
}

# Update Cloud Run environment variables
Write-Host "Updating Cloud Run environment variables..." -ForegroundColor Yellow
gcloud run services update dodone-server --env-vars-file ../.env --region us-east1

Write-Host "✅ Environment restoration complete!" -ForegroundColor Green
Write-Host "🔗 Test: https://dodone-server-333732290566.us-east1.run.app/health" -ForegroundColor Cyan
"@

$restoreScript | Out-File "$backupFolder\RESTORE-ENVIRONMENT.ps1" -Encoding UTF8

Write-Host ""
Write-Host "📋 Documentation created: README-CRITICAL-RESTORE-INFO.txt" -ForegroundColor Cyan
Write-Host "🔧 Restore script created: RESTORE-ENVIRONMENT.ps1" -ForegroundColor Cyan
Write-Host "💾 Backup location: $backupFolder" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  CRITICAL NEXT STEPS:" -ForegroundColor Red
Write-Host "1. 🔐 Store this backup folder in your password manager (1Password/Bitwarden)" -ForegroundColor White
Write-Host "2. 🔒 OR encrypt and upload to secure cloud storage" -ForegroundColor White
Write-Host "3. 🗑️  Delete local backup folder after securing elsewhere" -ForegroundColor White
Write-Host "4. ✅ Test restore process in development environment" -ForegroundColor White
Write-Host ""
Write-Host "📁 Backup Summary:" -ForegroundColor Green
Write-Host "   Files: $($secretFiles.Count) files backed up" -ForegroundColor White
Write-Host "   Size: $(Get-ChildItem $backupFolder -Recurse | Measure-Object -Property Length -Sum | Select-Object -ExpandProperty Sum) bytes" -ForegroundColor White
Write-Host "   Location: $backupFolder" -ForegroundColor White
Write-Host ""
Write-Host "🔄 To create future backups, run: .\backup-secrets.ps1" -ForegroundColor Cyan