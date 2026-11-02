/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

// FIRESTORE DYNAMIC CONFIGURATION SETUP AND USAGE GUIDE
//
// This guide explains how to set up and use dynamic configuration with Google Cloud Firestore.
//
// ARCHITECTURE OVERVIEW:
// =====================
// 1. Configuration is stored in Firestore collection: "config"
// 2. Document IDs are environment names: "production", "sandbox"
// 3. Document content mirrors appsettings.json structure
// 4. Configuration Provider:
//    - Reads from Firestore on startup
//    - Caches in memory with 30-second TTL
//    - Automatically reloads every 30 seconds
//    - Gracefully falls back to appsettings.json if unavailable
//
// DEPLOYMENT STEPS:
// =================
//
// STEP 1: INITIAL FIRESTORE SETUP (Run once during first deployment)
// -------------------------------------------------------------------
// 1.1 Create the configuration collection in Firestore:
//     a. Go to https://console.cloud.google.com/firestore
//     b. Create a new collection named "config"
//
// 1.2 Create documents for each environment using deploy scripts:
//     
//     For Production Server + Worker:
//     ================================
//     gcloud firestore documents create config/production \
//       --data 'Serilog.MinimumLevel.Default=Information,Serilog.MinimumLevel.Override.DoDone.Server=Information,HttpLogging.Enabled=true,HttpLogging.LogHeaders=true,HttpLogging.LogRequestBody=true,HttpLogging.LogResponseBody=true,WebhookRetry.Enabled=false' \
//       --project dodone-mobile
//
//     OR upload the full JSON content via Firestore Console:
//     - Document ID: "production"
//     - Content: (See appsettings.Production.json converted to Firestore document)
//
//     For Sandbox Server:
//     ===================
//     gcloud firestore documents create config/sandbox \
//       --project dodone-mobile
//     - Document ID: "sandbox"
//     - Content: (See appsettings.Sandbox.json converted to Firestore document)
//
// 1.3 Important: The Firestore document should contain the ENTIRE configuration structure
//     matching your appsettings.json. During initialization, copy your appsettings.Production.json
//     and appsettings.Sandbox.json content into Firestore.
//
// STEP 2: DEPLOY DOCKER IMAGES
// ----------------------------
// The Dockerfile already includes the necessary packages.
// Standard deployment scripts (deploy-prod.ps1, deploy-sandbox.ps1, deploy-worker.ps1) work as-is.
//
// STEP 3: VERIFY FIRESTORE CONNECTION
// -----------------------------------
// After deployment, check logs:
// gcloud run services logs read dodone-server --region us-east1 --project dodone-mobile --limit 50
//
// Look for messages like:
// "[Startup] Firestore configuration provider added for environment: production"
//
// STEP 4: OPTIONAL - SEED INITIAL CONFIG
// =======================================
// The PowerShell script `Initialize-FirestoreConfig.ps1` will:
// - Read appsettings.Production.json and appsettings.Sandbox.json
// - Create/update corresponding Firestore documents
// - Can be run from deployment scripts for first-time setup
//
// USING DYNAMIC CONFIGURATION:
// =============================
//
// SCENARIO 1: Temporarily increase log verbosity for debugging
// -----------------------------------------------------------
// Option A: Using Firestore Console
// 1. Go to https://console.cloud.google.com/firestore
// 2. Navigate to collection "config" → document "production"
// 3. Edit the field: Serilog.MinimumLevel.Default = "Debug"
// 4. Save
// 5. Within 30 seconds, all running instances will reload and use Debug level
//
// Option B: Using gcloud CLI
// gcloud firestore documents update config/production \
//   --update="Serilog.MinimumLevel.Default=Debug" \
//   --project dodone-mobile
//
// SCENARIO 2: Disable HTTP request/response body logging
// -------------------------------------------------------
// In Firestore Console:
// 1. Open config/production
// 2. Change HttpLogging.LogRequestBody = false
// 3. Change HttpLogging.LogResponseBody = false
// 4. Save
// 5. Takes effect within 30 seconds on all instances
//
// SCENARIO 3: Enable webhook retry (if disabled)
// -----------------------------------------------
// In Firestore Console:
// 1. Open config/production
// 2. Change WebhookRetry.Enabled = true
// 3. Save
// 4. Worker will pick up the change on next cycle
//
// IMPORTANT NOTES:
// ================
//
// 1. FIRESTORE DOCUMENT STRUCTURE:
//    - Must use COLON-SEPARATED nested keys
//    - Example: Instead of nested object { "Serilog": { "MinimumLevel": { "Default": "Information" } } }
//    - Firestore will flatten to: "Serilog.MinimumLevel.Default" = "Information"
//    - See: FirestoreConfigurationProvider.FlattenDictionary()
//
// 2. SUPPORTED TYPES:
//    - String, Boolean, Number (int, long, double)
//    - Arrays of objects
//    - Nested maps/objects
//
// 3. CACHE TTL:
//    - Configuration is cached for 30 seconds
//    - All changes take effect within ~30 seconds across all instances
//    - Can be tuned via cacheTtlSeconds parameter in Program.cs
//
// 4. FALLBACK BEHAVIOR:
//    - If Firestore is unavailable on startup, uses appsettings.json
//    - If Firestore becomes unavailable after startup, keeps previous configuration
//    - If Firestore reload fails, logs warning and continues with previous values
//
// 5. ENVIRONMENT MAPPING:
//    - ASP.NET Core environment "Production" → Firestore document "production"
//    - ASP.NET Core environment "Sandbox" → Firestore document "sandbox"
//    - Unknown environments default to "production" document
//
// 6. WORKER SERVICE:
//    - Uses the same configuration system as the server
//    - Deployed with ASPNETCORE_ENVIRONMENT=Production (or as needed)
//    - Reads from the same Firestore collection
//    - Configuration changes apply on next periodic task execution
//
// 7. SECURITY:
//    - Firestore rules should restrict access to service account(s) only
//    - HTTP endpoint for config updates not implemented by default
//    - All changes are auditable via Firestore's built-in change history
//
// FIRESTORE RULES (Example - Restrict to GCP Service Account):
// =============================================================
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     // Only allow service account to read/write config
//     match /config/{environment} {
//       allow read, write: if request.auth.uid == '<your-service-account-id>';
//     }
//   }
// }
//
// TROUBLESHOOTING:
// ================
//
// Issue: "Firestore configuration provider added for environment" message not in logs
// Solution: Check that Google.Cloud.Firestore is properly installed and GOOGLE_CLOUD_PROJECT env var is set
//
// Issue: Configuration changes not taking effect
// Solution: 
//   - Check that Firestore document exists and is properly formatted
//   - Verify the environment name mapping (Production → production, Sandbox → sandbox)
//   - Check logs for "Error loading configuration from Firestore" messages
//   - Ensure cache TTL has elapsed (wait 30+ seconds)
//
// Issue: Firestore connection errors in production
// Solution:
//   - Verify Cloud SQL proxy has Firestore API permissions
//   - Check Cloud Run service account has "Cloud Datastore User" role
//   - Verify Firestore API is enabled in project: gcloud services enable firestore.googleapis.com
//
// MONITORING:
// ===========
// Watch configuration reload in real-time:
// gcloud run services logs read dodone-server \
//   --region us-east1 \
//   --project dodone-mobile \
//   --limit 200 | grep -i firestore
//
// View Firestore changes:
// gcloud firestore documents get config/production --project dodone-mobile

namespace DoDone.Server.Configuration.Docs
{
    // This is a documentation file - no code here
}
