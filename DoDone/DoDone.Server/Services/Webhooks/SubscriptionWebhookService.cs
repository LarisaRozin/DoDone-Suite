/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Db.Repositories;
using DoDone.Server.Dtos.Webhooks;
using DoDone.Shared;
using DoDone.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace DoDone.Server.Services.Webhooks;

public interface ISubscriptionWebhookService
{
    Task<bool> ProcessGooglePlayNotificationAsync(GooglePlayDeveloperNotification notification);
    Task<bool> ProcessAppleNotificationAsync(AppleNotificationPayload notification);
    Task<Team?> FindTeamByPurchaseTokenAsync(string purchaseToken);
    Task<Team?> FindTeamByTransactionIdAsync(string transactionId);
}

public class SubscriptionWebhookService : ISubscriptionWebhookService
{
    private readonly ITeamRepository _teamRepository;
    private readonly IGooglePlayWebhookService _googlePlayService;
    private readonly IAppleWebhookService _appleService;
    private readonly IEmailService _emailService;
    private readonly IFirebaseService _firebaseService;
    private readonly ILogger<SubscriptionWebhookService> _logger;
    private readonly DoDoneDbContext _dbContext;
    private readonly IFailedWebhookNotificationRepository _failedWebhookRepository;
    private readonly IPurchaseHistoryRepository _purchaseHistoryRepository;
    private readonly IUserDevicesRepository _userDevicesRepository;

    public SubscriptionWebhookService(
        ITeamRepository teamRepository,
        IGooglePlayWebhookService googlePlayService,
        IAppleWebhookService appleService,
        IEmailService emailService,
        IFirebaseService firebaseService,
        ILogger<SubscriptionWebhookService> logger,
        DoDoneDbContext dbContext,
        IFailedWebhookNotificationRepository failedWebhookRepository,
        IPurchaseHistoryRepository purchaseHistoryRepository,
        IUserDevicesRepository userDevicesRepository)
    {
        _teamRepository = teamRepository;
        _googlePlayService = googlePlayService;
        _appleService = appleService;
        _emailService = emailService;
        _firebaseService = firebaseService;
        _logger = logger;
        _dbContext = dbContext;
        _failedWebhookRepository = failedWebhookRepository;
        _purchaseHistoryRepository = purchaseHistoryRepository;
        _userDevicesRepository = userDevicesRepository;
    }

    public async Task<bool> ProcessGooglePlayNotificationAsync(GooglePlayDeveloperNotification notification)
    {
        try
        {
            if (notification.TestNotification != null)
            {
                _logger.LogInformation("Received test notification from Google Play");
                return true;
            }

            var subNotification = notification.SubscriptionNotification;
            if (subNotification == null)
            {
                _logger.LogWarning("Subscription notification is null");
                return false;
            }

            _logger.LogInformation("Processing Google Play notification type: {NotificationType}, PurchaseToken: {PurchaseToken}, SubscriptionId: {SubscriptionId}",
                subNotification.NotificationType, subNotification.PurchaseToken, subNotification.SubscriptionId);

            // Find the team by purchase token
            var team = await FindTeamByPurchaseTokenAsync(subNotification.PurchaseToken);
            if (team == null)
            {
                _logger.LogError("No team found for purchase token: {PurchaseToken}. SubscriptionId: {SubscriptionId}. This means /api/subscriptions/verify was never called or failed.",
                    subNotification.PurchaseToken, subNotification.SubscriptionId);
                
                // Try to find team by subscription ID as fallback for recovery
                var teamBySubscription = await _dbContext.Teams
                    .FirstOrDefaultAsync(t => t.ProductId == subNotification.SubscriptionId && 
                                             t.SubscriptionPlatform == "android");
                
                if (teamBySubscription != null)
                {
                    _logger.LogWarning("Found team {TeamId} by subscription ID instead. Updating purchase token from {OldToken} to {NewToken}",
                        teamBySubscription.Id, teamBySubscription.PurchaseToken ?? "null", subNotification.PurchaseToken);
                    team = teamBySubscription;
                    team.PurchaseToken = subNotification.PurchaseToken; // Update to new token
                }
                else
                {
                    _logger.LogError("No fallback team found by subscription ID either. Queueing for retry.");
                    
                    // Queue this notification for retry
                    await QueueFailedGooglePlayNotificationAsync(notification, 
                        "Team not found - likely race condition with /api/subscription/verify");
                    
                    return false;
                }
            }

            // Verify the purchase with Google Play API
            var subscriptionDetails = await _googlePlayService.VerifyPurchaseTokenAsync(
                notification.PackageName,
                subNotification.SubscriptionId,
                subNotification.PurchaseToken);

            if (subscriptionDetails == null)
            {
                _logger.LogError("Failed to verify purchase token with Google Play API");
                return false;
            }

            var notificationType = (GooglePlayNotificationType)subNotification.NotificationType;
            var expiryDate = DateTimeOffset.FromUnixTimeMilliseconds(subscriptionDetails.ExpiryTimeMillis);

            _logger.LogInformation("Subscription details - AutoRenewing: {AutoRenewing}, Expires: {ExpiryDate}",
                subscriptionDetails.AutoRenewing, expiryDate);

            // Update team subscription based on notification type
            bool shouldSendEmail = false;
            string emailSubject = "";
            string emailMessage = "";

            switch (notificationType)
            {
                case GooglePlayNotificationType.SUBSCRIPTION_PURCHASED:
                case GooglePlayNotificationType.SUBSCRIPTION_RENEWED:
                case GooglePlayNotificationType.SUBSCRIPTION_RECOVERED:
                case GooglePlayNotificationType.SUBSCRIPTION_RESTARTED:
                    team.SubscriptionTier = MapProductIdToTier(subNotification.SubscriptionId);
                    team.SubscriptionExpiresAt = expiryDate;
                    team.SubscriptionPlatform = "android";
                    team.ProductId = subNotification.SubscriptionId;
                    team.TransactionId = subscriptionDetails.OrderId;
                    team.OriginalTransactionId = subscriptionDetails.LinkedPurchaseToken;
                    shouldSendEmail = true;
                    emailSubject = notificationType == GooglePlayNotificationType.SUBSCRIPTION_PURCHASED 
                        ? "Welcome to DoDone Pro!" 
                        : "Your DoDone Pro subscription has been renewed";
                    emailMessage = $"Your subscription is now active until {expiryDate:MMMM dd, yyyy}.";
                    break;

                case GooglePlayNotificationType.SUBSCRIPTION_CANCELED:
                    // Don't immediately downgrade - subscription is valid until expiry
                    _logger.LogInformation("Subscription canceled but remains active until {ExpiryDate}", expiryDate);
                    shouldSendEmail = true;
                    emailSubject = "Your DoDone Pro subscription has been canceled";
                    emailMessage = $"Your subscription will remain active until {expiryDate:MMMM dd, yyyy}. You can reactivate anytime.";
                    break;

                case GooglePlayNotificationType.SUBSCRIPTION_EXPIRED:
                    team.SubscriptionTier = SubscriptionTier.Free;
                    team.SubscriptionExpiresAt = expiryDate;
                    shouldSendEmail = true;
                    emailSubject = "Your DoDone Pro subscription has expired";
                    emailMessage = "Your account has been downgraded to the Free tier. Upgrade anytime to regain Pro features.";
                    break;

                case GooglePlayNotificationType.SUBSCRIPTION_REVOKED:
                    // Revoked means refunded or canceled by Google
                    team.SubscriptionTier = SubscriptionTier.Free;
                    team.SubscriptionExpiresAt = DateTimeOffset.UtcNow;
                    shouldSendEmail = true;
                    emailSubject = "Your DoDone Pro subscription has been revoked";
                    emailMessage = "Your subscription has been revoked. Please contact support if you believe this is an error.";
                    break;

                case GooglePlayNotificationType.SUBSCRIPTION_ON_HOLD:
                case GooglePlayNotificationType.SUBSCRIPTION_IN_GRACE_PERIOD:
                    // Keep subscription active during grace period
                    _logger.LogInformation("Subscription in grace period or on hold until {ExpiryDate}", expiryDate);
                    shouldSendEmail = true;
                    emailSubject = "Payment issue with your DoDone Pro subscription";
                    emailMessage = $"There was an issue processing your payment. Please update your payment method to continue your subscription.";
                    break;

                case GooglePlayNotificationType.SUBSCRIPTION_PAUSED:
                    _logger.LogInformation("Subscription paused");
                    break;

                case GooglePlayNotificationType.SUBSCRIPTION_PRICE_CHANGE_CONFIRMED:
                    _logger.LogInformation("Price change confirmed");
                    break;
            }

            team.UpdatedAt = DateTimeOffset.UtcNow;
            
            // Retry logic for database updates (handles timeouts and lock contention)
            int maxRetries = 3;
            int retryCount = 0;
            Exception? lastException = null;
            
            while (retryCount < maxRetries)
            {
                try
                {
                    _logger.LogInformation("Attempting to update team subscription (attempt {Attempt}/{MaxRetries})", 
                        retryCount + 1, maxRetries);
                    
                    await _teamRepository.UpdateAsync(team);
                    
                    _logger.LogInformation("Successfully updated team {TeamId} subscription", team.Id);
                    break; // Success, exit retry loop
                }
                catch (Exception ex) when (retryCount < maxRetries - 1)
                {
                    lastException = ex;
                    retryCount++;
                    
                    int delayMs = 1000 * retryCount; // 1s, 2s wait times
                    _logger.LogWarning(ex, "Database update failed on attempt {Attempt}, retrying in {DelayMs}ms. Error: {ErrorMessage}",
                        retryCount, delayMs, ex.Message);
                    
                    await Task.Delay(delayMs);
                }
            }
            
            if (retryCount >= maxRetries && lastException != null)
            {
                _logger.LogError(lastException, "Failed to update team subscription after {MaxRetries} attempts", maxRetries);
                throw lastException;
            }

            // Create or update purchase history record
            try
            {
                var existingRecord = await _purchaseHistoryRepository.GetByPurchaseTokenAsync(subNotification.PurchaseToken);
                
                if (existingRecord == null)
                {
                    // Create new purchase history record
                    var purchaseHistory = new PurchaseHistory
                    {
                        TeamId = team.Id,
                        Platform = Constants.ANDROID_PLATFORM,
                        ProductId = subNotification.SubscriptionId,
                        SubscriptionTier = team.SubscriptionTier,
                        PurchaseToken = subNotification.PurchaseToken,
                        TransactionId = subscriptionDetails.OrderId,
                        OriginalTransactionId = subscriptionDetails.LinkedPurchaseToken,
                        PurchaseDate = DateTimeOffset.FromUnixTimeMilliseconds(subscriptionDetails.StartTimeMillis),
                        ExpiryDate = expiryDate,
                        IsActive = notificationType != GooglePlayNotificationType.SUBSCRIPTION_EXPIRED && 
                                  notificationType != GooglePlayNotificationType.SUBSCRIPTION_REVOKED,
                        IsCancelled = notificationType == GooglePlayNotificationType.SUBSCRIPTION_CANCELED || 
                                     notificationType == GooglePlayNotificationType.SUBSCRIPTION_REVOKED,
                        IsVerified = true,
                        VerifiedAt = DateTimeOffset.UtcNow
                    };
                    
                    await _purchaseHistoryRepository.CreateAsync(purchaseHistory);
                    _logger.LogInformation("Created purchase history record for team {TeamId}, purchase token {Token}", 
                        team.Id, subNotification.PurchaseToken);
                }
                else
                {
                    // Update existing record
                    existingRecord.TransactionId = subscriptionDetails.OrderId;
                    existingRecord.OriginalTransactionId = subscriptionDetails.LinkedPurchaseToken;
                    existingRecord.ExpiryDate = expiryDate;
                    existingRecord.IsActive = notificationType != GooglePlayNotificationType.SUBSCRIPTION_EXPIRED && 
                                             notificationType != GooglePlayNotificationType.SUBSCRIPTION_REVOKED;
                    existingRecord.IsCancelled = notificationType == GooglePlayNotificationType.SUBSCRIPTION_CANCELED || 
                                               notificationType == GooglePlayNotificationType.SUBSCRIPTION_REVOKED;
                    existingRecord.UpdatedAt = DateTimeOffset.UtcNow;
                    
                    await _purchaseHistoryRepository.UpdateAsync(existingRecord);
                    _logger.LogInformation("Updated purchase history record for team {TeamId}, purchase token {Token}", 
                        team.Id, subNotification.PurchaseToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating/updating purchase history record for team {TeamId}", team.Id);
                // Don't fail the webhook processing due to purchase history errors
            }

            // Acknowledge the purchase if not already acknowledged
            if (subscriptionDetails.AcknowledgementState == 0)
            {
                _logger.LogInformation("Acknowledging purchase for team {TeamId}, subscription {SubscriptionId}", 
                    team.Id, subNotification.SubscriptionId);
                
                var acknowledged = await _googlePlayService.AcknowledgePurchaseAsync(
                    notification.PackageName,
                    subNotification.SubscriptionId,
                    subNotification.PurchaseToken);
                
                if (acknowledged)
                {
                    _logger.LogInformation("Successfully acknowledged purchase token to Google Play");
                }
                else
                {
                    _logger.LogError("Failed to acknowledge purchase token to Google Play. Team may be charged twice.");
                }
            }
            else
            {
                _logger.LogInformation("Purchase already acknowledged (AcknowledgementState={State})", subscriptionDetails.AcknowledgementState);
            }

            // Send confirmation email
            if (shouldSendEmail)
            {
                await SendSubscriptionEmailAsync(team, emailSubject, emailMessage);
                await SendSubscriptionPushNotificationAsync(team, emailSubject, emailMessage);
            }

            _logger.LogInformation("Successfully processed Google Play notification for team {TeamId}", team.Id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Google Play notification");
            return false;
        }
    }

    public async Task<bool> ProcessAppleNotificationAsync(AppleNotificationPayload notification)
    {
        try
        {
            if (notification.NotificationType == AppleNotificationType.TEST)
            {
                _logger.LogInformation("Received test notification from Apple");
                return true;
            }

            _logger.LogInformation("Processing Apple notification type: {NotificationType}, UUID: {UUID}",
                notification.NotificationType, notification.NotificationUUID);

            // Decode transaction info
            var transactionInfo = _appleService.DecodeTransactionInfoAsync(
                notification.Data.SignedTransactionInfo);

            if (transactionInfo == null)
            {
                _logger.LogError("Failed to decode transaction info");
                return false;
            }

            // Find team by original transaction ID
            var team = await FindTeamByTransactionIdAsync(transactionInfo.OriginalTransactionId);
            if (team == null)
            {
                _logger.LogWarning("No team found for transaction ID: {TransactionId}. Queueing for retry.", 
                    transactionInfo.OriginalTransactionId);
                
                // Queue this notification for retry
                await QueueFailedAppleNotificationAsync(notification, 
                    "Team not found - likely race condition with /api/subscription/verify");
                
                return false;
            }

            var expiryDate = transactionInfo.ExpiresDate.HasValue
                ? DateTimeOffset.FromUnixTimeMilliseconds(transactionInfo.ExpiresDate.Value)
                : (DateTimeOffset?)null;

            _logger.LogInformation("Transaction details - ProductId: {ProductId}, Expires: {ExpiryDate}",
                transactionInfo.ProductId, expiryDate);

            bool shouldSendEmail = false;
            string emailSubject = "";
            string emailMessage = "";

            switch (notification.NotificationType)
            {
                case AppleNotificationType.SUBSCRIBED:
                case AppleNotificationType.DID_RENEW:
                case AppleNotificationType.RENEWAL_EXTENDED:
                    team.SubscriptionTier = MapProductIdToTier(transactionInfo.ProductId);
                    team.SubscriptionExpiresAt = expiryDate;
                    team.SubscriptionPlatform = "ios";
                    team.TransactionId = transactionInfo.TransactionId;
                    team.OriginalTransactionId = transactionInfo.OriginalTransactionId;
                    team.ProductId = transactionInfo.ProductId;
                    shouldSendEmail = true;
                    emailSubject = notification.NotificationType == AppleNotificationType.SUBSCRIBED
                        ? "Welcome to DoDone Pro!"
                        : "Your DoDone Pro subscription has been renewed";
                    emailMessage = expiryDate.HasValue
                        ? $"Your subscription is now active until {expiryDate.Value:MMMM dd, yyyy}."
                        : "Your subscription is now active.";
                    break;

                case AppleNotificationType.DID_CHANGE_RENEWAL_STATUS:
                    // Check renewal status from notification subtype
                    if (notification.Subtype == "AUTO_RENEW_DISABLED")
                    {
                        _logger.LogInformation("Auto-renew disabled, subscription active until {ExpiryDate}", expiryDate);
                        shouldSendEmail = true;
                        emailSubject = "Your DoDone Pro subscription renewal has been canceled";
                        emailMessage = expiryDate.HasValue
                            ? $"Your subscription will remain active until {expiryDate.Value:MMMM dd, yyyy}. You can reactivate anytime."
                            : "Your subscription will remain active until it expires. You can reactivate anytime.";
                    }
                    break;

                case AppleNotificationType.EXPIRED:
                    team.SubscriptionTier = SubscriptionTier.Free;
                    if (expiryDate.HasValue)
                    {
                        team.SubscriptionExpiresAt = expiryDate;
                    }
                    shouldSendEmail = true;
                    emailSubject = "Your DoDone Pro subscription has expired";
                    emailMessage = "Your account has been downgraded to the Free tier. Upgrade anytime to regain Pro features.";
                    break;

                case AppleNotificationType.GRACE_PERIOD_EXPIRED:
                case AppleNotificationType.DID_FAIL_TO_RENEW:
                    shouldSendEmail = true;
                    emailSubject = "Payment issue with your DoDone Pro subscription";
                    emailMessage = "There was an issue processing your payment. Please update your payment method to continue your subscription.";
                    break;

                case AppleNotificationType.REFUND:
                case AppleNotificationType.REVOKE:
                    team.SubscriptionTier = SubscriptionTier.Free;
                    team.SubscriptionExpiresAt = DateTimeOffset.UtcNow;
                    shouldSendEmail = true;
                    emailSubject = "Your DoDone Pro subscription has been refunded";
                    emailMessage = "Your subscription has been refunded. Please contact support if you believe this is an error.";
                    break;
            }

            team.UpdatedAt = DateTimeOffset.UtcNow;

            var strategy = _dbContext.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _dbContext.Database.BeginTransactionAsync();
                try
                {
                    // Update team
                    _dbContext.Teams.Update(team);
                    await _dbContext.SaveChangesAsync();

                    // Create or update purchase history record
                    // Query directly by OriginalTransactionId since that's the unique constraint
                    var existingRecord = await _dbContext.PurchaseHistories
                        .FirstOrDefaultAsync(p => p.OriginalTransactionId == transactionInfo.OriginalTransactionId);

                    if (existingRecord == null)
                    {
                        // Create new purchase history record
                        var purchaseHistory = new PurchaseHistory
                        {
                            TeamId = team.Id,
                            Platform = Constants.IOS_PLATFORM,
                            ProductId = transactionInfo.ProductId,
                            SubscriptionTier = team.SubscriptionTier,
                            TransactionId = transactionInfo.TransactionId,
                            OriginalTransactionId = transactionInfo.OriginalTransactionId,
                            ReceiptData = notification.Data.SignedTransactionInfo,  // Store for customer support and audit trail
                            PurchaseDate = DateTimeOffset.FromUnixTimeMilliseconds(transactionInfo.PurchaseDate),
                            ExpiryDate = expiryDate,
                            IsActive = notification.NotificationType != AppleNotificationType.EXPIRED &&
                                      notification.NotificationType != AppleNotificationType.REVOKE &&
                                      notification.NotificationType != AppleNotificationType.REFUND,
                            IsCancelled = notification.NotificationType == AppleNotificationType.DID_CHANGE_RENEWAL_STATUS &&
                                         notification.Subtype == "AUTO_RENEW_DISABLED",
                            IsVerified = true,
                            VerifiedAt = DateTimeOffset.UtcNow,
                            CreatedAt = DateTimeOffset.UtcNow
                        };

                        _dbContext.PurchaseHistories.Add(purchaseHistory);
                        await _dbContext.SaveChangesAsync();
                        _logger.LogInformation("Created purchase history record for team {TeamId}, transaction ID {TransactionId}",
                            team.Id, transactionInfo.OriginalTransactionId);
                    }
                    else
                    {
                        // Update existing record
                        existingRecord.TransactionId = transactionInfo.TransactionId;
                        existingRecord.ExpiryDate = expiryDate;
                        existingRecord.ReceiptData = notification.Data.SignedTransactionInfo; // Update receipt data
                        existingRecord.IsActive = notification.NotificationType != AppleNotificationType.EXPIRED &&
                                                 notification.NotificationType != AppleNotificationType.REVOKE &&
                                                 notification.NotificationType != AppleNotificationType.REFUND;
                        existingRecord.IsCancelled = notification.NotificationType == AppleNotificationType.DID_CHANGE_RENEWAL_STATUS &&
                                                   notification.Subtype == "AUTO_RENEW_DISABLED";
                        existingRecord.UpdatedAt = DateTimeOffset.UtcNow;

                        _dbContext.PurchaseHistories.Update(existingRecord);
                        await _dbContext.SaveChangesAsync();
                        _logger.LogInformation("Updated purchase history record for team {TeamId}, transaction ID {TransactionId}",
                            team.Id, transactionInfo.OriginalTransactionId);
                    }

                    await transaction.CommitAsync();
                }
                catch (DbUpdateException ex)
                {
                    await transaction.RollbackAsync();

                    // Check if it's a duplicate key error (constraint violation)
                    if (ex.InnerException?.Message.Contains("duplicate key") == true ||
                        ex.InnerException?.Message.Contains("unique constraint") == true)
                    {
                        _logger.LogWarning("Duplicate purchase history detected for transaction {TransactionId}, treating as success",
                            transactionInfo.OriginalTransactionId);
                        return;
                    }

                    throw;
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });

            // Send confirmation email
            if (shouldSendEmail)
            {
                await SendSubscriptionEmailAsync(team, emailSubject, emailMessage);
                await SendSubscriptionPushNotificationAsync(team, emailSubject, emailMessage);
            }

            _logger.LogInformation("Successfully processed Apple notification for team {TeamId}", team.Id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Apple notification");
            return false;
        }
    }

    public async Task<Team?> FindTeamByPurchaseTokenAsync(string purchaseToken)
    {
        return await _dbContext.Teams
            .FirstOrDefaultAsync(t => t.PurchaseToken == purchaseToken);
    }

    public async Task<Team?> FindTeamByTransactionIdAsync(string transactionId)
    {
        return await _dbContext.Teams
            .FirstOrDefaultAsync(t => t.OriginalTransactionId == transactionId || t.TransactionId == transactionId);
    }

    private SubscriptionTier MapProductIdToTier(string productId)
    {
        // Map product IDs to subscription tiers
        // Adjust these based on your actual product IDs from Google Play and App Store
        if (string.IsNullOrEmpty(productId))
            return SubscriptionTier.Free;

        return productId.ToLowerInvariant() switch
        {
            var id when id.Contains("pro") => SubscriptionTier.Pro,
            // Add more tiers as needed
            _ => SubscriptionTier.Free
        };
    }

    private async Task SendSubscriptionEmailAsync(Team team, string subject, string message)
    {
        try
        {
            // Get team admin email
            var adminUser = await _dbContext.Users
                .Where(u => u.TeamId == team.Id && u.IsAdmin)
                .OrderBy(u => u.Id)
                .FirstOrDefaultAsync();

            if (adminUser == null || string.IsNullOrEmpty(adminUser.Email))
            {
                _logger.LogWarning("No admin email found for team {TeamId}", team.Id);
                return;
            }

            // Send email using email service
            await _emailService.SendSubscriptionEmailAsync(
                adminUser.Email, 
                adminUser.FirstName, 
                subject, 
                message, 
                team.IsBusiness);

            _logger.LogInformation("Subscription email sent to {Email}: {Subject}", adminUser.Email, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending subscription email for team {TeamId}", team.Id);
        }
    }

    private async Task SendSubscriptionPushNotificationAsync(Team team, string title, string message)
    {
        try
        {
            // Get all team members
            var teamUsers = await _dbContext.Users
                .Where(u => u.TeamId == team.Id)
                .ToListAsync();

            if (!teamUsers.Any())
            {
                _logger.LogWarning("No users found for team {TeamId}", team.Id);
                return;
            }

            // For each user, get their devices and send push notifications
            foreach (var user in teamUsers)
            {
                try
                {
                    var userDevices = await _userDevicesRepository.GetUserDevicesAsync(user.Id);
                    userDevices = userDevices.Where(d => !string.IsNullOrEmpty(d.FcmToken)).ToList();

                    if (!userDevices.Any())
                    {
                        _logger.LogInformation("No devices with FCM tokens found for user {UserId}", user.Id);
                        continue;
                    }

                    var data = new Dictionary<string, string>
                    {
                        ["type"] = "subscription_update",
                        // ["teamId"] = team.Id.ToString()
                    };

                    var tokens = userDevices.Select(d => d.FcmToken).ToList();

                    if (tokens.Count == 1)
                    {
                        await _firebaseService.SendNotificationAsync(tokens[0], title, message, data);
                    }
                    else if (tokens.Count > 1)
                    {
                        await _firebaseService.SendMulticastNotificationAsync(tokens, title, message, data);
                    }

                    _logger.LogInformation("Subscription push notification sent to user {UserId}: {Title}", user.Id, title);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending subscription push notification to user {UserId}", user.Id);
                    // Continue with next user even if one fails
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending subscription push notifications for team {TeamId}", team.Id);
        }
    }

    private async Task QueueFailedGooglePlayNotificationAsync(GooglePlayDeveloperNotification notification, string failureReason)
    {
        try
        {
            var subNotification = notification.SubscriptionNotification;
            if (subNotification == null)
            {
                return;
            }

            var payload = JsonSerializer.Serialize(notification);
            var alreadyQueued = await _dbContext.FailedWebhookNotifications
                .AnyAsync(n => n.Platform == "google-play" && n.Payload == payload && !n.IsProcessed && !n.IsAbandoned);

            if (alreadyQueued)
            {
                _logger.LogInformation("Duplicate Google Play webhook payload already queued. PurchaseToken: {PurchaseToken}, NotificationType: {NotificationType}",
                    subNotification.PurchaseToken, subNotification.NotificationType);
                return;
            }

            var failedNotification = new FailedWebhookNotification
            {
                Platform = "google-play",
                Payload = payload,
                PurchaseToken = subNotification.PurchaseToken,
                ProductId = subNotification.SubscriptionId,
                NotificationType = subNotification.NotificationType,
                FailureReason = failureReason,
                NextRetryAt = DateTimeOffset.UtcNow.AddMinutes(1) // First retry in 1 minute
            };

            await _failedWebhookRepository.CreateAsync(failedNotification);
            
            _logger.LogInformation("Queued failed Google Play webhook notification for retry. PurchaseToken: {PurchaseToken}, NotificationType: {NotificationType}",
                subNotification.PurchaseToken, subNotification.NotificationType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error queuing failed webhook notification");
        }
    }

    private async Task QueueFailedAppleNotificationAsync(AppleNotificationPayload notification, string failureReason)
    {
        try
        {
            var payload = JsonSerializer.Serialize(notification);
            var alreadyQueued = await _dbContext.FailedWebhookNotifications
                .AnyAsync(n => n.Platform == "apple" && n.Payload == payload && !n.IsProcessed && !n.IsAbandoned);

            if (alreadyQueued)
            {
                _logger.LogInformation("Duplicate Apple webhook payload already queued. Skipping.");
                return;
            }

            var failedNotification = new FailedWebhookNotification
            {
                Platform = "apple",
                Payload = payload,
                FailureReason = failureReason,
                NextRetryAt = DateTimeOffset.UtcNow.AddMinutes(1) // First retry in 1 minute
            };

            await _failedWebhookRepository.CreateAsync(failedNotification);
            
            _logger.LogInformation("Queued failed Apple webhook notification for retry");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error queuing failed webhook notification");
        }
    }
}
