/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using System.Text.Json.Serialization;

namespace DoDone.Server.Dtos.Webhooks;

/// <summary>
/// Google Cloud Pub/Sub message format for subscription notifications
/// https://developer.android.com/google/play/billing/rtdn-reference
/// </summary>
public class GooglePlayPubSubMessage
{
    [JsonPropertyName("message")]
    public PubSubMessage Message { get; set; } = null!;

    [JsonPropertyName("subscription")]
    public string Subscription { get; set; } = string.Empty;
}

public class PubSubMessage
{
    [JsonPropertyName("attributes")]
    public Dictionary<string, string>? Attributes { get; set; }

    [JsonPropertyName("data")]
    public string Data { get; set; } = string.Empty;

    [JsonPropertyName("messageId")]
    public string MessageId { get; set; } = string.Empty;

    [JsonPropertyName("publishTime")]
    public DateTime PublishTime { get; set; }
}

/// <summary>
/// Decoded data from Pub/Sub message
/// </summary>
public class GooglePlayDeveloperNotification
{
    [JsonPropertyName("version")]
    public string Version { get; set; } = string.Empty;

    [JsonPropertyName("packageName")]
    public string PackageName { get; set; } = string.Empty;

    [JsonPropertyName("eventTimeMillis")]
    public string EventTimeMillis { get; set; } = string.Empty;

    [JsonPropertyName("subscriptionNotification")]
    public SubscriptionNotification? SubscriptionNotification { get; set; }

    [JsonPropertyName("testNotification")]
    public TestNotification? TestNotification { get; set; }
}

public class SubscriptionNotification
{
    [JsonPropertyName("version")]
    public string Version { get; set; } = string.Empty;

    [JsonPropertyName("notificationType")]
    public int NotificationType { get; set; }

    [JsonPropertyName("purchaseToken")]
    public string PurchaseToken { get; set; } = string.Empty;

    [JsonPropertyName("subscriptionId")]
    public string SubscriptionId { get; set; } = string.Empty;
}

public class TestNotification
{
    [JsonPropertyName("version")]
    public string Version { get; set; } = string.Empty;
}

/// <summary>
/// Google Play subscription notification types
/// https://developer.android.com/google/play/billing/rtdn-reference#sub
/// </summary>
public enum GooglePlayNotificationType
{
    SUBSCRIPTION_RECOVERED = 1,
    SUBSCRIPTION_RENEWED = 2,
    SUBSCRIPTION_CANCELED = 3,
    SUBSCRIPTION_PURCHASED = 4,
    SUBSCRIPTION_ON_HOLD = 5,
    SUBSCRIPTION_IN_GRACE_PERIOD = 6,
    SUBSCRIPTION_RESTARTED = 7,
    SUBSCRIPTION_PRICE_CHANGE_CONFIRMED = 8,
    SUBSCRIPTION_DEFERRED = 9,
    SUBSCRIPTION_PAUSED = 10,
    SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED = 11,
    SUBSCRIPTION_REVOKED = 12,
    SUBSCRIPTION_EXPIRED = 13
}

/// <summary>
/// Response from Google Play Developer API for subscription verification
/// https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions
/// </summary>
public class GooglePlaySubscriptionResponse
{
    [JsonPropertyName("kind")]
    public string Kind { get; set; } = string.Empty;

    [JsonPropertyName("startTimeMillis")]
    public long StartTimeMillis { get; set; }

    [JsonPropertyName("expiryTimeMillis")]
    public long ExpiryTimeMillis { get; set; }

    [JsonPropertyName("autoRenewing")]
    public bool AutoRenewing { get; set; }

    [JsonPropertyName("priceCurrencyCode")]
    public string PriceCurrencyCode { get; set; } = string.Empty;

    [JsonPropertyName("priceAmountMicros")]
    public long PriceAmountMicros { get; set; }

    [JsonPropertyName("countryCode")]
    public string CountryCode { get; set; } = string.Empty;

    [JsonPropertyName("developerPayload")]
    public string DeveloperPayload { get; set; } = string.Empty;

    [JsonPropertyName("paymentState")]
    public int? PaymentState { get; set; }

    [JsonPropertyName("cancelReason")]
    public int? CancelReason { get; set; }

    [JsonPropertyName("userCancellationTimeMillis")]
    public long? UserCancellationTimeMillis { get; set; }

    [JsonPropertyName("orderId")]
    public string OrderId { get; set; } = string.Empty;

    [JsonPropertyName("linkedPurchaseToken")]
    public string? LinkedPurchaseToken { get; set; }

    [JsonPropertyName("purchaseType")]
    public int? PurchaseType { get; set; }

    [JsonPropertyName("acknowledgementState")]
    public int AcknowledgementState { get; set; }

    [JsonPropertyName("obfuscatedExternalAccountId")]
    public string? ObfuscatedExternalAccountId { get; set; }
}
