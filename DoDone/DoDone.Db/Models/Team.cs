/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Enums;

namespace DoDone.Db.Models;

public class Team
{
    public long Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; } = default!;
    public bool IsBusiness { get; set; } = false;
    public DateTimeOffset CreatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public SubscriptionTier SubscriptionTier { get; set; } = SubscriptionTier.Free;
    public DateTimeOffset? SubscriptionExpiresAt { get; set; }
    public DateTimeOffset? TrialEndsAt { get; set; }
    public string? SubscriptionPlatform { get; set; }  // android or ios
    public string? PurchaseToken { get; set; }  // Google Play purchase token (Android)
    public string? TransactionId { get; set; }  // App Store transaction ID (iOS)
    public string? OriginalTransactionId { get; set; }  // App Store original transaction ID (iOS)
    public string? ReceiptData { get; set; }  // Base64 encoded receipt data (iOS)
    public string? ProductId { get; set; }  // Product identifier for the subscription
    public User? UpdatedByUser { get; set; }
    public List<User> Members { get; set; } = new();
    public List<TaskItem> TaskItems { get; set; } = new();
    public List<TaskGroup> TaskGroups { get; set; } = new();
    public List<TeamAllowanceInterval> AllowanceIntervals { get; set; } = new();
    public List<AllowanceHistory> AllowanceHistories { get; set; } = new();
    public List<PurchaseHistory> PurchaseHistories { get; set; } = new();
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}