/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

// Re-export types from dodone-shared for convenience
export {
  SubscriptionTier,
  SubscriptionAction,
  UNLIMITED,
} from '@larisarozin/dodone-shared';

export type {
  FeatureLimit,
  SubscriptionLimitsResponse,
  ValidateSubscriptionActionRequest,
  ValidateSubscriptionActionResponse,
  SubscriptionStatusResponse,
  VerifyPurchaseRequest,
  VerifyPurchaseResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  PurchaseReceiptItem,
  PurchaseReceiptResponse,
} from '@larisarozin/dodone-shared';

/**
 * Product IDs for in-app purchases
 * These must match the IDs configured in Google Play Console and App Store Connect
 */
export const SUBSCRIPTION_PRODUCT_IDS = {
  PRO_MONTHLY: 'dodone_pro_monthly',
  PRO_YEARLY: 'dodone_pro_yearly',
  // Team tier will be added later
  // TEAM_MONTHLY: 'dodone_team_monthly',
  // TEAM_YEARLY: 'dodone_team_yearly',
} as const;

/**
 * Subscription product information for UI display
 */
export interface SubscriptionProduct {
  productId: string;
  tier: number; // SubscriptionTier
  interval: 'monthly' | 'yearly';
  displayName: string;
  price: string;
  savingsPercent?: number;
  features: string[];
}

/**
 * Map of features available in each tier
 */
export const TIER_FEATURES = {
  FREE: [
    '1 allowance interval',
    'Up to 3 family members',
    'Up to 50 tasks',
    'Basic task management',
    'GPA calculation',
    'Emoji avatars',
    'Basic notifications',
  ],
  PRO: [
    'Unlimited allowance intervals',
    'Unlimited family members',
    'Unlimited tasks',
    'Grade configuration',
    'Bonuses',
    'Image avatars',
    'Multi-select tasks',
    'Private tasks',
    'Proposed tasks',
    'Task comments',
    'Task groups, kinds, categories',
    'Celebration effects',
    'Advanced filters',
    'Email support',
  ],
} as const;
