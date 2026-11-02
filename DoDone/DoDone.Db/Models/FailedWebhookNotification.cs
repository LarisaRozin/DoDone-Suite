/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Db.Models;

/// <summary>
/// Stores webhook notifications that failed to process for retry
/// This handles race conditions where webhooks arrive before subscription verification
/// </summary>
public class FailedWebhookNotification
{
    public long Id { get; set; }
    
    /// <summary>
    /// Platform that sent the webhook ("google-play" or "apple")
    /// </summary>
    public required string Platform { get; set; }
    
    /// <summary>
    /// The raw webhook payload (JSON)
    /// </summary>
    public required string Payload { get; set; }
    
    /// <summary>
    /// Purchase token for Google Play or Transaction ID for Apple
    /// </summary>
    public string? PurchaseToken { get; set; }
    
    /// <summary>
    /// Product/Subscription ID from the notification
    /// </summary>
    public string? ProductId { get; set; }
    
    /// <summary>
    /// Notification type (e.g., SUBSCRIPTION_PURCHASED, SUBSCRIPTION_RENEWED)
    /// </summary>
    public int? NotificationType { get; set; }
    
    /// <summary>
    /// Reason for the failure
    /// </summary>
    public string? FailureReason { get; set; }
    
    /// <summary>
    /// Number of times we've attempted to process this notification
    /// </summary>
    public int RetryCount { get; set; } = 0;
    
    /// <summary>
    /// Maximum number of retries before giving up
    /// </summary>
    public int MaxRetries { get; set; } = 10;
    
    /// <summary>
    /// When this notification was first received and failed
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }
    
    /// <summary>
    /// When we last attempted to process this notification
    /// </summary>
    public DateTimeOffset? LastRetryAt { get; set; }
    
    /// <summary>
    /// When we should next attempt to process this notification
    /// </summary>
    public DateTimeOffset NextRetryAt { get; set; }
    
    /// <summary>
    /// Whether this notification has been successfully processed
    /// </summary>
    public bool IsProcessed { get; set; } = false;
    
    /// <summary>
    /// When the notification was successfully processed
    /// </summary>
    public DateTimeOffset? ProcessedAt { get; set; }
    
    /// <summary>
    /// Whether we've given up on this notification (exceeded max retries)
    /// </summary>
    public bool IsAbandoned { get; set; } = false;
    
    /// <summary>
    /// When we gave up on this notification
    /// </summary>
    public DateTimeOffset? AbandonedAt { get; set; }
}
