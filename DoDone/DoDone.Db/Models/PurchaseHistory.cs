/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Enums;

namespace DoDone.Db.Models;

public class PurchaseHistory
{
    public long Id { get; set; }
    public long TeamId { get; set; }
    public Team Team { get; set; } = null!;
    
    // Platform information
    public required string Platform { get; set; }  // "android" or "ios"
    public required string ProductId { get; set; }  // Product identifier
    public SubscriptionTier SubscriptionTier { get; set; }
    
    // Platform-specific identifiers
    public string? PurchaseToken { get; set; }  // Google Play purchase token (Android)
    public string? TransactionId { get; set; }  // App Store transaction ID (iOS)
    public string? OriginalTransactionId { get; set; }  // App Store original transaction ID (iOS)
    
    // Purchase details
    public DateTimeOffset PurchaseDate { get; set; }
    public DateTimeOffset? ExpiryDate { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsCancelled { get; set; } = false;
    public DateTimeOffset? CancelledAt { get; set; }
    
    // Receipt data (iOS)
    public string? ReceiptData { get; set; }
    
    // Verification status
    public bool IsVerified { get; set; } = false;
    public DateTimeOffset? VerifiedAt { get; set; }
    public DateTimeOffset? LastVerificationAttempt { get; set; }
    
    // Metadata
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}
