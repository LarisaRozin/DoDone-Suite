# DoDone GCP Production Deployment Checklist

## Prerequisites ✅
- [x] GCP account created with $300 free credits
- [x] Billing enabled on dodone-mobile project  
- [x] Google Cloud SDK installed and authenticated
- [x] Required APIs enabled (Cloud SQL, Cloud Run, Cloud Storage, etc.)

## Database Setup 🗄️
- [x] Cloud SQL PostgreSQL instance created (dodone-postgres)
- [x] PostgreSQL instance is RUNNABLE
- [x] Database 'dodone' created
- [x] Database user 'dodone_user' created with secure password
- [x] Entity Framework migrations applied

## Storage Setup 💾
- [x] Cloud Storage bucket created: `dodone-avatars-20241130-3278`
- [x] Bucket configured for public read access
- [x] CORS policy configured for web access
- [x] appsettings.GCP.json updated with bucket name

## Backend Deployment 🚀
- [x] Dockerfile created for .NET application
- [x] .dockerignore file configured
- [x] appsettings.Production.json created with production settings
- [x] Cloud Run service deployed: `dodone-server`
- [x] Environment variables configured (JWT_KEY, SMTP_PASSWORD)
- [x] Cloud SQL connection configured with connection pooling
- [x] Authentication middleware working with environment variables
- [x] Health endpoint responding correctly
- [x] Service URL: https://dodone-server-333732290566.us-east1.run.app

## Frontend Deployment 🌐
- [x] firebase.json configuration created
- [x] Environment template created (.env.production.template)
- [x] Production environment variables configured (.env.production)
- [x] React app built for production
- [x] Deployed to Firebase Hosting
- [x] API URL updated to Cloud Run endpoint
- [x] Firebase CLI installed and configured
- [x] Vite build configuration fixed for dodone-shared package
- [x] TypeScript errors resolved
- [x] Frontend URL: https://dodone-mobile.web.app

## Security & Configuration 🔐
- [x] JWT secret key generated and configured (environment variable)
- [x] Database password generated and secured
- [x] Firebase service account key configured
- [x] JwtService updated to use environment variables with fallback
- [x] Program.cs authentication updated for environment variables
- [x] EmailService updated to use environment variables
- [x] Email SMTP settings configured for production (using business domain)
- [x] Cloud Run environment variables updated (FROM_EMAIL, SMTP_USER)
- [x] HTTPS/SSL certificates configured (automatic with Cloud Run)

## Testing & Validation ✅
- [x] Database connection tested
- [x] API endpoints responding correctly
- [x] Authentication flow working (JWT environment variables fixed)
- [x] User login functionality verified
- [x] File upload (avatars) working - emoji vs image avatars resolved
- [ ] Email notifications working (pending business email setup)
- [x] Mobile app can connect to production API
- [x] Frontend can communicate with backend (CORS configured for production domains)
- [x] CORS policy configured for dodoneapp.com and Firebase domains

## Custom Domain & SSL 🌍
- [x] Custom domain purchased: dodoneapp.com (Squarespace)
- [x] Email aliases configured: info@, privacy@, support@dodoneapp.com
- [x] Firebase Hosting custom domain configured
- [x] DNS records updated (A and TXT records)
- [x] Domain verification completed
- [x] SSL certificate obtained (automatic after domain verification)
- [x] Frontend deployed to custom domain: https://dodoneapp.com
- [ ] Cloud Run custom domain mapping (api.dodoneapp.com)
- [ ] Update application URLs to use custom domain

## Monitoring & Maintenance 📊
- [x] Cloud Logging configured and working
- [x] Cloud Monitoring alerts set up
  - [x] Email notification channel created (larisarozinworks@gmail.com)
  - [x] CPU utilization alerts configured
  - [x] Memory utilization alerts configured  
  - [x] Database connection alerts configured
- [x] Cloud SQL Performance Insights enabled
- [ ] Backup strategy implemented
- [ ] Cost monitoring alerts configured
- [x] Performance monitoring enabled

## Scripts Created 📝
- [x] `deploy-gcp.ps1` - Main deployment script
- [x] `migrate-database.ps1` - Database migration script
- [x] `start-sql-proxy.ps1` - Local development Cloud SQL proxy
- [x] `run-migrations.ps1` - Automated migration with proxy management

## Current Status
**PostgreSQL Instance Status:** ✅ RUNNABLE in us-east1
**Backend API Status:** ✅ DEPLOYED at https://dodone-server-333732290566.us-east1.run.app
**Region:** us-east1 (South Carolina) - ~15-25ms latency from Bradenton, FL

## Development Environment Setup ✅
- [x] Cloud SQL Proxy configured for local development
- [x] VS Code debug configurations created:
  - "C#: DoDone.Server Debug (Local)" - Uses local PostgreSQL
  - "C#: DoDone.Server Debug (ProdDB)" - Uses production database via proxy
- [x] appsettings.DevProdDB.json created for hybrid local/production development

## Environment Variables Management
- [x] JWT_KEY: Generated 64-character secure key, configured in Cloud Run
- [x] SMTP_PASSWORD: Gmail app password configured
- [x] FROM_EMAIL: noreply@dodoneapp.com configured
- [x] SMTP_USER: larisarozinworks@gmail.com configured
- [x] .env file created for deployment (contains all secrets)
- [x] Environment variable fallback logic implemented in JwtService and Program.cs
- [x] EmailService updated to use environment variables with fallback


