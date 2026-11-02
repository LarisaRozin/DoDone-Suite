/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Enums;

namespace DoDone.Db.Dtos;

public class SubscriptionInfo
{
    public SubscriptionTier SubscriptionTier { get; set; }
    public DateTimeOffset? SubscriptionExpiresAt { get; set; }
    public DateTimeOffset? TrialEndsAt { get; set; }
    public string? SubscriptionPlatform { get; set; }  // android or ios
    public string? PurchaseToken { get; set; }  // Google Play purchase token (Android)
    public string? TransactionId { get; set; }  // App Store transaction ID (iOS)
    public string? OriginalTransactionId { get; set; }  // App Store original transaction ID (iOS)
    public string? ReceiptData { get; set; }  // Base64 encoded receipt data (iOS)
    public string? ProductId { get; set; }  // Product identifier for the subscription
    public DateTimeOffset CreatedAt { get; set; }  
}

public static class SubscriptionInfoExtensions
{
    // TODO: move to config
    const int ANDROID_YEARLY_GRACE_DAYS = 14;
    const int ANDROID_MONTHLY_GRACE_DAYS = 7;

    public static bool IsActive(this SubscriptionInfo subscriptionInfo, DateTimeOffset currentDate) =>
        subscriptionInfo.SubscriptionTier != SubscriptionTier.Free 
            && subscriptionInfo.SubscriptionExpiresAt.HasValue
            && subscriptionInfo.SubscriptionExpiresAt.Value > currentDate;

    public static bool IsTrialActive(this SubscriptionInfo subscriptionInfo, DateTimeOffset currentDate) =>
       subscriptionInfo.SubscriptionTier == SubscriptionTier.Free 
       && subscriptionInfo.TrialEndsAt.HasValue && subscriptionInfo.TrialEndsAt.Value > currentDate;

    public static bool IsGrandfathered(this SubscriptionInfo subscriptionInfo, DateTimeOffset monetizationStartDate) =>
        subscriptionInfo.SubscriptionTier == SubscriptionTier.Free && subscriptionInfo.CreatedAt < monetizationStartDate;
    
    public static DateTimeOffset? GetGracePeriodEndsAt(this SubscriptionInfo subscriptionInfo, DateTimeOffset monetizationStartDate, int grandfatheredGracePeriodDays)
    {
        if (subscriptionInfo.SubscriptionTier == SubscriptionTier.Pro && subscriptionInfo.IsActive(currentDate: DateTimeOffset.UtcNow))
            return null;

        if (!subscriptionInfo.SubscriptionExpiresAt.HasValue)
            return null;

        if (!IsGrandfathered(subscriptionInfo, monetizationStartDate))
        {
            if (subscriptionInfo.SubscriptionPlatform == "android")
            {
                if (subscriptionInfo.ProductId != null && subscriptionInfo.ProductId.ToLower().EndsWith("_yearly"))
                {
                    return subscriptionInfo.SubscriptionExpiresAt.Value.AddDays(ANDROID_YEARLY_GRACE_DAYS);
                }
                else if (subscriptionInfo.ProductId != null && subscriptionInfo.ProductId.ToLower().EndsWith("_monthly"))
                {
                    return subscriptionInfo.SubscriptionExpiresAt.Value.AddDays(ANDROID_MONTHLY_GRACE_DAYS);
                }
            }
            else if (subscriptionInfo.SubscriptionPlatform == "ios")
            {
                // iOS subscriptions do not have a grace period
                return null;
            }
            else
            {
                // Unknown platform
                return null;
            }

            return null;
        }
        else
        {
            return monetizationStartDate.AddDays(grandfatheredGracePeriodDays);
        }
    }

    public static bool IsGracePeriodActive(this SubscriptionInfo subscriptionInfo, DateTimeOffset currentDate, DateTimeOffset monetizationStartDate, int grandfatheredGracePeriodDays)
    {
        var gracePeriodEndsAt = subscriptionInfo.GetGracePeriodEndsAt(monetizationStartDate, grandfatheredGracePeriodDays);
        if (!gracePeriodEndsAt.HasValue)
            return false;

        return currentDate <= gracePeriodEndsAt.Value;
    }
}