/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

/**
 * Subscription Configuration Guide
 * 
 * IMPORTANT: Before testing subscriptions, you must:
 * 
 * 1. CREATE PRODUCTS IN APP STORES
 * ================================
 * 
 * Google Play Console:
 * - Go to: Monetize > Subscriptions
 * - Create subscription products with these exact IDs:
 *   - dodone_pro_monthly (Monthly subscription)
 *   - dodone_pro_yearly (Yearly subscription)
 * - Set pricing:
 *   - Monthly: $6.99 USD
 *   - Yearly: $59.99 USD
 * - Set billing period and free trial if desired
 * - Save and activate the subscriptions
 * 
 * App Store Connect:
 * - Go to: Features > In-App Purchases
 * - Create Auto-Renewable Subscriptions with these exact IDs:
 *   - dodone_pro_monthly (Monthly subscription)
 *   - dodone_pro_yearly (Yearly subscription)
 * - Set pricing:
 *   - Monthly: $6.99 USD
 *   - Yearly: $59.99 USD
 * - Create subscription group if needed
 * - Submit for review (required even for testing)
 * 
 * 2. TESTING SETUP
 * ================
 * 
 * Google Play:
 * - Add test accounts in Google Play Console > Settings > License testing
 * - Install the app from internal testing track or Play Console
 * - Test accounts won't be charged
 * 
 * iOS/TestFlight:
 * - Create Sandbox Tester accounts in App Store Connect > Users and Access > Sandbox Testers
 * - Sign out of App Store on device
 * - When making purchase, sign in with sandbox account
 * - Subscriptions auto-renew faster in sandbox (e.g., 1 week = 3 minutes)
 * 
 * 3. BACKEND CONFIGURATION
 * ========================
 * 
 * Your backend needs to:
 * - Implement POST /api/subscriptions/verify endpoint
 * - Validate receipts with Google Play or Apple
 * - Update user subscription status in database
 * - Return subscription tier and expiration date
 * 
 * See: doc/MONETIZATION_IMPLEMENTATION_PLAN.md for backend setup
 * 
 * 4. TROUBLESHOOTING
 * ==================
 * 
 * Common issues:
 * - "Product not found": Products not created in store console, or app not published to testing track
 * - "Unable to purchase": Not using test account, or test account not properly configured
 * - "Verification failed": Backend not configured, or receipt validation logic incorrect
 * - iOS showing wrong price: Clear app data, or prices not set in App Store Connect
 */

/**
 * Product IDs - Must match EXACTLY what's configured in stores
 */
export const SUBSCRIPTION_PRODUCT_IDS = {
  /** Monthly Pro subscription - $6.99/month */
  PRO_MONTHLY: 'dodone_pro_monthly',
  
  /** Yearly Pro subscription - $59.99/year (saves 29%) */
  PRO_YEARLY: 'dodone_pro_yearly',
} as const;

/**
 * Subscription prices (fallback if store doesn't load)
 * These are shown when product info can't be fetched from store
 */
export const FALLBACK_PRICES = {
  PRO_MONTHLY: '$6.99',
  PRO_YEARLY: '$59.99',
} as const;

/**
 * Subscription renewal periods for sandbox testing
 * In production, these are the actual periods
 * In sandbox (testing), they're accelerated:
 * - 1 week = 3 minutes
 * - 1 month = 5 minutes
 * - 2 months = 10 minutes
 * - 3 months = 15 minutes
 * - 6 months = 30 minutes
 * - 1 year = 1 hour
 */
export const RENEWAL_PERIODS = {
  MONTHLY: 'P1M', // ISO 8601 duration: 1 month
  YEARLY: 'P1Y', // ISO 8601 duration: 1 year
} as const;

/**
 * Free trial configuration
 * Set to null if no free trial
 */
export const FREE_TRIAL = {
  /** Trial duration in days */
  DAYS: 7,
  
  /** Whether trial is enabled */
  ENABLED: false, // Set to true when ready to offer trials
} as const;

/**
 * Subscription tiers
 */
export const SUBSCRIPTION_TIERS = {
  FREE: 0,
  PRO: 1,
} as const;

export default {
  SUBSCRIPTION_PRODUCT_IDS,
  FALLBACK_PRICES,
  RENEWAL_PERIODS,
  FREE_TRIAL,
  SUBSCRIPTION_TIERS,
};
