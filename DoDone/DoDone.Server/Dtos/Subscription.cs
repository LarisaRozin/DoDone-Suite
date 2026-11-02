/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Enums;

namespace DoDone.Server.Dtos;

// GET /api/subscription/status response
public class SubscriptionStatusResponse
{
    public SubscriptionTier CurrentTier { get; set; }
    public DateTimeOffset? ExpirationDate { get; set; }
    public bool IsTrialActive { get; set; }
    public DateTimeOffset? TrialEndsAt { get; set; }

    public bool IsGracePeriodActive { get; set; }
    public DateTimeOffset? GracePeriodEndsAt { get; set; }
    public string? Platform { get; set; }
    public bool IsActive { get; set; }
}

// POST /api/subscription/verify request
public class VerifyPurchaseRequest
{
    public required string Platform { get; set; }  // "android" or "ios"
    public required string ProductId { get; set; }
    
    // Android fields
    public string? PurchaseToken { get; set; }
    
    // iOS StoreKit 1 fields (legacy)
    public string? ReceiptData { get; set; }
    public string? TransactionId { get; set; }
    
    // iOS StoreKit 2 fields (preferred)
    public string? SignedTransactionInfo { get; set; }
    public string? SignedRenewalInfo { get; set; }
}

// POST /api/subscription/verify response
public class VerifyPurchaseResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public SubscriptionTier? SubscriptionTier { get; set; }
    public DateTimeOffset? ExpirationDate { get; set; }
}

// POST /api/subscription/cancel request
public class CancelSubscriptionRequest
{
    public required string Platform { get; set; }  // "android" or "ios"
}

// POST /api/subscription/cancel response
public class CancelSubscriptionResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public DateTimeOffset? ExpirationDate { get; set; }  // Subscription continues until this date
    public string? CancellationUrl { get; set; }  // For iOS, deep link to App Store
}

// GET /api/subscription/receipt response item
public class PurchaseReceiptItem
{
    public long Id { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string ProductId { get; set; } = string.Empty;
    public SubscriptionTier SubscriptionTier { get; set; }
    public DateTimeOffset PurchaseDate { get; set; }
    public DateTimeOffset? ExpiryDate { get; set; }
    public bool IsActive { get; set; }
    public bool IsCancelled { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
}

// GET /api/subscription/receipt response
public class PurchaseReceiptResponse
{
    public List<PurchaseReceiptItem> Purchases { get; set; } = new();
    public string? CurrentPlatform { get; set; }
}
