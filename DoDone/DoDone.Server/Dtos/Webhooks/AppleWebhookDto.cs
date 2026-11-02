/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using System.Text.Json.Serialization;

namespace DoDone.Server.Dtos.Webhooks;

/// <summary>
/// Apple App Store Server Notification V2
/// https://developer.apple.com/documentation/appstoreservernotifications
/// </summary>
public class AppleServerNotification
{
    [JsonPropertyName("signedPayload")]
    public string SignedPayload { get; set; } = string.Empty;
}

/// <summary>
/// Decoded JWS payload from Apple
/// </summary>
public class AppleNotificationPayload
{
    [JsonPropertyName("notificationType")]
    public string NotificationType { get; set; } = string.Empty;

    [JsonPropertyName("subtype")]
    public string? Subtype { get; set; }

    [JsonPropertyName("notificationUUID")]
    public string NotificationUUID { get; set; } = string.Empty;

    [JsonPropertyName("data")]
    public AppleNotificationData Data { get; set; } = null!;

    [JsonPropertyName("version")]
    public string Version { get; set; } = string.Empty;

    [JsonPropertyName("signedDate")]
    public long SignedDate { get; set; }
}

public class AppleNotificationData
{
    [JsonPropertyName("appAppleId")]
    public long? AppAppleId { get; set; }

    [JsonPropertyName("bundleId")]
    public string BundleId { get; set; } = string.Empty;

    [JsonPropertyName("bundleVersion")]
    public string? BundleVersion { get; set; }

    [JsonPropertyName("environment")]
    public string Environment { get; set; } = string.Empty;

    [JsonPropertyName("signedRenewalInfo")]
    public string? SignedRenewalInfo { get; set; }

    [JsonPropertyName("signedTransactionInfo")]
    public string SignedTransactionInfo { get; set; } = string.Empty;
}

/// <summary>
/// Decoded transaction info from Apple JWS
/// </summary>
public class AppleTransactionInfo
{
    [JsonPropertyName("transactionId")]
    public string TransactionId { get; set; } = string.Empty;

    [JsonPropertyName("originalTransactionId")]
    public string OriginalTransactionId { get; set; } = string.Empty;

    [JsonPropertyName("webOrderLineItemId")]
    public string? WebOrderLineItemId { get; set; }

    [JsonPropertyName("bundleId")]
    public string BundleId { get; set; } = string.Empty;

    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("subscriptionGroupIdentifier")]
    public string? SubscriptionGroupIdentifier { get; set; }

    [JsonPropertyName("purchaseDate")]
    public long PurchaseDate { get; set; }

    [JsonPropertyName("originalPurchaseDate")]
    public long OriginalPurchaseDate { get; set; }

    [JsonPropertyName("expiresDate")]
    public long? ExpiresDate { get; set; }

    [JsonPropertyName("quantity")]
    public int Quantity { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("inAppOwnershipType")]
    public string InAppOwnershipType { get; set; } = string.Empty;

    [JsonPropertyName("signedDate")]
    public long SignedDate { get; set; }

    [JsonPropertyName("environment")]
    public string Environment { get; set; } = string.Empty;

    [JsonPropertyName("transactionReason")]
    public string? TransactionReason { get; set; }

    [JsonPropertyName("storefront")]
    public string? Storefront { get; set; }

    [JsonPropertyName("storefrontId")]
    public string? StorefrontId { get; set; }

    [JsonPropertyName("price")]
    public long? Price { get; set; }

    [JsonPropertyName("currency")]
    public string? Currency { get; set; }
}

/// <summary>
/// Apple notification types for subscription events
/// https://developer.apple.com/documentation/appstoreservernotifications/notificationtype
/// </summary>
public static class AppleNotificationType
{
    public const string SUBSCRIBED = "SUBSCRIBED";
    public const string DID_RENEW = "DID_RENEW";
    public const string DID_CHANGE_RENEWAL_STATUS = "DID_CHANGE_RENEWAL_STATUS";
    public const string DID_CHANGE_RENEWAL_PREF = "DID_CHANGE_RENEWAL_PREF";
    public const string DID_FAIL_TO_RENEW = "DID_FAIL_TO_RENEW";
    public const string EXPIRED = "EXPIRED";
    public const string GRACE_PERIOD_EXPIRED = "GRACE_PERIOD_EXPIRED";
    public const string OFFER_REDEEMED = "OFFER_REDEEMED";
    public const string PRICE_INCREASE = "PRICE_INCREASE";
    public const string REFUND = "REFUND";
    public const string REFUND_DECLINED = "REFUND_DECLINED";
    public const string RENEWAL_EXTENDED = "RENEWAL_EXTENDED";
    public const string REVOKE = "REVOKE";
    public const string TEST = "TEST";
}

/// <summary>
/// Legacy receipt validation request (for backwards compatibility)
/// </summary>
public class AppleReceiptValidationRequest
{
    [JsonPropertyName("receipt-data")]
    public string ReceiptData { get; set; } = string.Empty;

    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;

    [JsonPropertyName("exclude-old-transactions")]
    public bool ExcludeOldTransactions { get; set; } = true;
}

/// <summary>
/// Legacy receipt validation response
/// </summary>
public class AppleReceiptValidationResponse
{
    [JsonPropertyName("status")]
    public int Status { get; set; }

    [JsonPropertyName("environment")]
    public string? Environment { get; set; }

    [JsonPropertyName("receipt")]
    public AppleReceipt? Receipt { get; set; }

    [JsonPropertyName("latest_receipt_info")]
    public List<AppleReceiptInfo>? LatestReceiptInfo { get; set; }

    [JsonPropertyName("latest_receipt")]
    public string? LatestReceipt { get; set; }

    [JsonPropertyName("pending_renewal_info")]
    public List<ApplePendingRenewalInfo>? PendingRenewalInfo { get; set; }

    [JsonPropertyName("is-retryable")]
    public bool? IsRetryable { get; set; }
}

public class AppleReceipt
{
    [JsonPropertyName("receipt_type")]
    public string? ReceiptType { get; set; }

    [JsonPropertyName("bundle_id")]
    public string? BundleId { get; set; }

    [JsonPropertyName("in_app")]
    public List<AppleReceiptInfo>? InApp { get; set; }
}

public class AppleReceiptInfo
{
    [JsonPropertyName("quantity")]
    public string? Quantity { get; set; }

    [JsonPropertyName("product_id")]
    public string? ProductId { get; set; }

    [JsonPropertyName("transaction_id")]
    public string? TransactionId { get; set; }

    [JsonPropertyName("original_transaction_id")]
    public string? OriginalTransactionId { get; set; }

    [JsonPropertyName("purchase_date")]
    public string? PurchaseDate { get; set; }

    [JsonPropertyName("purchase_date_ms")]
    public string? PurchaseDateMs { get; set; }

    [JsonPropertyName("expires_date")]
    public string? ExpiresDate { get; set; }

    [JsonPropertyName("expires_date_ms")]
    public string? ExpiresDateMs { get; set; }

    [JsonPropertyName("is_trial_period")]
    public string? IsTrialPeriod { get; set; }

    [JsonPropertyName("is_in_intro_offer_period")]
    public string? IsInIntroOfferPeriod { get; set; }
}

public class ApplePendingRenewalInfo
{
    [JsonPropertyName("auto_renew_product_id")]
    public string? AutoRenewProductId { get; set; }

    [JsonPropertyName("original_transaction_id")]
    public string? OriginalTransactionId { get; set; }

    [JsonPropertyName("product_id")]
    public string? ProductId { get; set; }

    [JsonPropertyName("auto_renew_status")]
    public string? AutoRenewStatus { get; set; }
}
