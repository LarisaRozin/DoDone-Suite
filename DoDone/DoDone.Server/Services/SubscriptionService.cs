/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Dtos;
using DoDone.Db.Models;
using DoDone.Db.Repositories;
using DoDone.Server.Dtos;
using DoDone.Server.Services.Webhooks;
using DoDone.Shared;
using DoDone.Shared.Enums;
using Microsoft.Extensions.Options;

namespace DoDone.Server.Services;

public class SubscriptionSettings
{
    public const string SectionName = "Subscription";
    public bool MonetizationEnabled { get; set; } = false;
    public int TrialPeriodDays { get; set; } = 30;
    public int GrandfatheredGracePeriodDays { get; set; } = 60;  // Extended period for early users
    public int MaxFreeUsersPerTeam { get; set; } = 3;
    public int MaxFreeTasksPerTeam { get; set; } = 30;
    public int MaxFreeAllowanceIntervalsPerTeam { get; set; } = 1;
    public GooglePlaySettings GooglePlay { get; set; } = new GooglePlaySettings();
    public AppleSettings Apple { get; set; } = new AppleSettings();
}

public class AppleSettings
{
    public string Environment { get; set; } = "production"; // or "sandbox"
    public string SharedSecret { get; set; } = string.Empty;
    public bool SkipJwsValidation { get; set; } = true;
    public bool UseStoreKit2 { get; set; } = true;  // Prefer StoreKit 2 over legacy receipt validation
    public DateTimeOffset LaunchDate { get; set; } = new DateTimeOffset(2025, 12, 29, 0, 0, 0, TimeSpan.Zero); // TODO: Update to actual launch date
}

public class GooglePlaySettings
{
    public string PackageName { get; set; } = "com.larisarozin.dodone";
    public string ServiceAccountJson { get; set; } = string.Empty;
    public DateTimeOffset LaunchDate { get; set; } = new DateTimeOffset(2025, 12, 29, 0, 0, 0, TimeSpan.Zero); // TODO: Update to actual launch date
}

public interface ISubscriptionService
{
    Task<SubscriptionLimitsResponse> GetSubscriptionLimits();
    Task<ValidateSubscriptionActionResponse> ValidateSubscriptionAction(ValidateSubscriptionActionRequest request);
    Task<SubscriptionStatusResponse> GetSubscriptionStatus(SubscriptionInfo? subscriptionInfo = null);
    Task<VerifyPurchaseResponse> VerifyPurchase(VerifyPurchaseRequest request);
    Task<CancelSubscriptionResponse> CancelSubscription(CancelSubscriptionRequest request);
    Task<PurchaseReceiptResponse> GetPurchaseReceipt();
}

public class SubscriptionService : ISubscriptionService
{
    private readonly ITeamRepository _teamRepository;
    private readonly ITaskItemRepository _taskItemRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPurchaseHistoryRepository _purchaseHistoryRepository;
    private readonly IGooglePlayWebhookService _googlePlayService;
    private readonly IAppleWebhookService _appleService;
    private readonly ILogger<SubscriptionService> _logger;
    private readonly SubscriptionSettings _subscriptionSettings;

    public SubscriptionService(
        ITeamRepository teamRepository,
        ITaskItemRepository taskItemRepository,
        ICurrentUserService currentUserService,
        IPurchaseHistoryRepository purchaseHistoryRepository,
        IGooglePlayWebhookService googlePlayService,
        IAppleWebhookService appleService,
        ILogger<SubscriptionService> logger,
        IOptions<SubscriptionSettings> subscriptionSettings)
    {
        _teamRepository = teamRepository;
        _taskItemRepository = taskItemRepository;
        _currentUserService = currentUserService;
        _purchaseHistoryRepository = purchaseHistoryRepository;
        _googlePlayService = googlePlayService;
        _appleService = appleService;
        _logger = logger;
        _subscriptionSettings = subscriptionSettings.Value;
    }

    public async Task<SubscriptionLimitsResponse> GetSubscriptionLimits()
    {
        var teamSubscriptionInfo = await _teamRepository.GetTeamSubscriptionInfoAsync(_currentUserService.TeamId);
        var subscriptionStatus = await GetSubscriptionStatus(teamSubscriptionInfo);

        var taskItemsCount = await _taskItemRepository.GetCountByTeamIdAsync(_currentUserService.TeamId);
        var taskItemsUnarchivedCount = await _taskItemRepository.GetUnarchivedCountByTeamIdAsync(_currentUserService.TeamId);
        var membersCount = await _teamRepository.GetTeamMembersCountAsync(_currentUserService.TeamId);
        var membersActiveCount = await _teamRepository.GetTeamMembersActiveCountAsync(_currentUserService.TeamId);
        var allowanceIntervalsCount = await _teamRepository.GetAllowanceIntervalsCountAsync(_currentUserService.TeamId);
        var allowanceIntervalsActiveCount = await _teamRepository.GetActiveAllowanceIntervalsCountAsync(_currentUserService.TeamId);

        var limits = SubscriptionHelper.GetSubscriptionLimits(
            teamSubscriptionInfo,
            subscriptionStatus,
            _subscriptionSettings,
            taskItemsCount,
            taskItemsUnarchivedCount,
            membersCount,
            membersActiveCount,
            allowanceIntervalsCount,
            allowanceIntervalsActiveCount);

        return limits;
    }

    public async Task<ValidateSubscriptionActionResponse> ValidateSubscriptionAction(ValidateSubscriptionActionRequest request)
    {
        var limits = await GetSubscriptionLimits();

        bool isAllowed = request.Action switch
        {
            SubscriptionAction.AddTeamMember => limits.TeamMembersLimit.CanAdd,
            SubscriptionAction.AddAllowanceInterval => limits.AllowanceIntervalsLimit.CanAdd,
            SubscriptionAction.AddTaskItem => limits.TaskItemsLimit.CanAdd,
            _ => true
        };

        SubscriptionTier upgradeRequired = SubscriptionTier.Free;
        if (!isAllowed)
        {
            upgradeRequired = SubscriptionTier.Pro;
            // upgradeRequired = request.Action switch
            // {
            //     SubscriptionAction.AddTeamMember => SubscriptionTier.Pro,
            //     SubscriptionAction.AddAllowanceInterval => SubscriptionTier.Pro,
            //     SubscriptionAction.AddTaskItem => SubscriptionTier.Pro,
            //     _ => SubscriptionTier.Pro
            // };
        }

        return new ValidateSubscriptionActionResponse
        {
            IsAllowed = isAllowed,
            Reason = isAllowed ? null : "Subscription limit reached",
            UpgradeRequired = upgradeRequired,
            CurrentTier = limits.SubscriptionTier
        };
    }

    public async Task<SubscriptionStatusResponse> GetSubscriptionStatus(SubscriptionInfo? subscriptionInfo = null)
    {

        // return new SubscriptionStatusResponse
        // {
        //     CurrentTier = SubscriptionTier.Free,
        //     ExpirationDate = null,
        //     IsTrialActive = false,
        //     TrialEndsAt = null,
        //     IsGracePeriodActive = false,
        //     GracePeriodEndsAt = null,
        //     Platform = null,
        //     IsActive = false
        // };

        if (!_subscriptionSettings.MonetizationEnabled)
        {
            return new SubscriptionStatusResponse
            {
                CurrentTier = SubscriptionTier.Pro,
                ExpirationDate = null,
                IsTrialActive = false,
                TrialEndsAt = null,
                IsGracePeriodActive = false,
                GracePeriodEndsAt = null,
                Platform = null,
                IsActive = true
            };
        }

        var teamSubscriptionInfo = subscriptionInfo ?? await _teamRepository.GetTeamSubscriptionInfoAsync(_currentUserService.TeamId);
        DateTimeOffset monetizationLaunchDate = teamSubscriptionInfo.SubscriptionPlatform == "ios" ? _subscriptionSettings.Apple.LaunchDate : _subscriptionSettings.GooglePlay.LaunchDate;  

        return new SubscriptionStatusResponse
        {
            CurrentTier = teamSubscriptionInfo.SubscriptionTier,
            Platform = teamSubscriptionInfo.SubscriptionPlatform,
            IsActive = teamSubscriptionInfo.IsActive(DateTimeOffset.UtcNow),
            ExpirationDate = teamSubscriptionInfo.SubscriptionExpiresAt,
            IsTrialActive = teamSubscriptionInfo.IsTrialActive(DateTimeOffset.UtcNow),
            TrialEndsAt = teamSubscriptionInfo.TrialEndsAt,
            IsGracePeriodActive = teamSubscriptionInfo.IsGracePeriodActive(DateTimeOffset.UtcNow, monetizationLaunchDate, _subscriptionSettings.GrandfatheredGracePeriodDays),
            GracePeriodEndsAt = teamSubscriptionInfo.GetGracePeriodEndsAt(monetizationLaunchDate, _subscriptionSettings.GrandfatheredGracePeriodDays),
        };
    }

    public async Task<VerifyPurchaseResponse> VerifyPurchase(VerifyPurchaseRequest request)
    {
        try
        {
            var teamId = _currentUserService.TeamId;
            var team = await _teamRepository.GetDetailsAsync(teamId);
            
            if (team == null)
            {
                _logger.LogError("Team not found for teamId {TeamId}", teamId);
                return new VerifyPurchaseResponse 
                { 
                    Success = false, 
                    Message = "Team not found" 
                };
            }

            if (request.Platform.ToLower() == Constants.ANDROID_PLATFORM)
            {
                return await VerifyAndroidPurchase(request, team);
            }
            else if (request.Platform.ToLower() == Constants.IOS_PLATFORM)
            {
                return await VerifyIosPurchase(request, team);
            }
            else
            {
                _logger.LogWarning("Invalid platform '{Platform}' for purchase verification for team {TeamId}", request.Platform, team.Id);
                return new VerifyPurchaseResponse 
                { 
                    Success = false, 
                    Message = $"Invalid platform. Must be '{Constants.ANDROID_PLATFORM}' or '{Constants.IOS_PLATFORM}'" 
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying purchase for team {TeamId}", _currentUserService.TeamId);
            return new VerifyPurchaseResponse 
            { 
                Success = false, 
                Message = "An error occurred while verifying the purchase" 
            };
        }
    }

    private async Task<VerifyPurchaseResponse> VerifyAndroidPurchase(VerifyPurchaseRequest request, Team team)
    {
        if (string.IsNullOrEmpty(request.PurchaseToken))
        {
            _logger.LogWarning("PurchaseToken is missing for Android purchase verification for team {TeamId}", team.Id);
            return new VerifyPurchaseResponse 
            { 
                Success = false, 
                Message = "PurchaseToken is required for Android" 
            };
        }

        // Verify with Google Play
        var packageName = _subscriptionSettings.GooglePlay.PackageName;
        var verificationResult = await _googlePlayService.VerifyPurchaseTokenAsync(
            packageName, 
            request.ProductId, 
            request.PurchaseToken);

        if (verificationResult == null)
        {
            _logger.LogWarning("Verification result is null for Android purchase verification for team {TeamId}", team.Id);
            return new VerifyPurchaseResponse 
            { 
                Success = false, 
                Message = "Failed to verify purchase with Google Play" 
            };
        }
        _logger.LogInformation("Google Play verification result for team {TeamId}: AcknowledgementState={AcknowledgementState}, ExpiryTimeMillis={ExpiryTimeMillis}", 
            team.Id, 
            verificationResult.AcknowledgementState, 
            verificationResult.ExpiryTimeMillis);

        // Map product ID to subscription tier
        var tier = MapProductIdToTier(request.ProductId);
        var expiryDate = DateTimeOffset.FromUnixTimeMilliseconds(verificationResult.ExpiryTimeMillis);

        // Update team subscription
        team.SubscriptionTier = tier;
        team.SubscriptionExpiresAt = expiryDate;
        team.SubscriptionPlatform = Constants.ANDROID_PLATFORM;
        team.PurchaseToken = request.PurchaseToken;
        team.ProductId = request.ProductId;
        team.UpdatedAt = DateTimeOffset.UtcNow;
        team.TransactionId = verificationResult.OrderId;
        team.OriginalTransactionId = verificationResult.LinkedPurchaseToken;
        team.ReceiptData = request.ReceiptData;  // optional for Android
        
        await _teamRepository.UpdateAsync(team);

        // Create purchase history record
        var purchaseHistory = new PurchaseHistory
        {
            TeamId = team.Id,
            Platform = Constants.ANDROID_PLATFORM,
            ProductId = request.ProductId,
            SubscriptionTier = tier,
            PurchaseToken = request.PurchaseToken,
            PurchaseDate = DateTimeOffset.UtcNow,
            ExpiryDate = expiryDate,
            IsActive = true,
            IsVerified = true,
            VerifiedAt = DateTimeOffset.UtcNow,
            TransactionId = verificationResult.OrderId,
            OriginalTransactionId = verificationResult.LinkedPurchaseToken,
            ReceiptData = request.ReceiptData
        };

        await _purchaseHistoryRepository.CreateAsync(purchaseHistory);

        // Acknowledge the purchase
        await _googlePlayService.AcknowledgePurchaseAsync(packageName, request.ProductId, request.PurchaseToken);

        _logger.LogInformation("Purchase acknowledged for team {TeamId}", team.Id);

        return new VerifyPurchaseResponse
        {
            Success = true,
            Message = "Purchase verified successfully",
            SubscriptionTier = tier,
            ExpirationDate = expiryDate
        };
    }

    private async Task<VerifyPurchaseResponse> VerifyIosPurchase(VerifyPurchaseRequest request, Team team)
    {
        // Prefer StoreKit 2 if available and enabled
        var useStoreKit2 = _subscriptionSettings.Apple.UseStoreKit2 && !string.IsNullOrEmpty(request.SignedTransactionInfo);
        
        if (useStoreKit2)
        {
            _logger.LogInformation("Using StoreKit 2 for iOS purchase verification for team {TeamId}", team.Id);
            return await VerifyIosStoreKit2Purchase(request, team);
        }
        else if (!string.IsNullOrEmpty(request.ReceiptData))
        {
            _logger.LogInformation("Using StoreKit 1 (legacy) for iOS purchase verification for team {TeamId}", team.Id);
            return await VerifyIosStoreKit1Purchase(request, team);
        }
        else
        {
            _logger.LogWarning("Neither StoreKit 2 nor StoreKit 1 receipt data provided for team {TeamId}", team.Id);
            return new VerifyPurchaseResponse 
            { 
                Success = false, 
                Message = "Either SignedTransactionInfo (StoreKit 2) or ReceiptData (StoreKit 1) is required for iOS" 
            };
        }
    }

    private async Task<VerifyPurchaseResponse> VerifyIosStoreKit2Purchase(VerifyPurchaseRequest request, Team team)
    {
        if (string.IsNullOrEmpty(request.SignedTransactionInfo))
        {
            _logger.LogWarning("SignedTransactionInfo is missing for iOS StoreKit 2 purchase verification for team {TeamId}", team.Id);
            return new VerifyPurchaseResponse 
            { 
                Success = false, 
                Message = "SignedTransactionInfo is required for StoreKit 2" 
            };
        }

        // Verify with Apple using StoreKit 2
        var transactionInfo = await _appleService.VerifyStoreKit2TransactionAsync(request.SignedTransactionInfo);

        if (transactionInfo == null)
        {
            _logger.LogWarning("Failed to verify StoreKit 2 transaction with Apple for team {TeamId}", team.Id);
            return new VerifyPurchaseResponse 
            { 
                Success = false, 
                Message = "Failed to verify StoreKit 2 transaction with Apple" 
            };
        }

        _logger.LogInformation("Apple StoreKit 2 transaction verified successfully for team {TeamId}: TransactionId={TransactionId}", 
            team.Id, transactionInfo.TransactionId);

        // Map product ID to subscription tier
        var tier = MapProductIdToTier(transactionInfo.ProductId);
        var expiryDate = transactionInfo.ExpiresDate.HasValue 
            ? DateTimeOffset.FromUnixTimeMilliseconds(transactionInfo.ExpiresDate.Value)
            : (DateTimeOffset?)null;

        // Update team subscription
        team.SubscriptionTier = tier;
        team.SubscriptionExpiresAt = expiryDate;
        team.SubscriptionPlatform = "ios";
        team.TransactionId = transactionInfo.TransactionId;
        team.OriginalTransactionId = transactionInfo.OriginalTransactionId;
        team.ReceiptData = request.SignedTransactionInfo;  // Store JWT for audit trail
        team.ProductId = transactionInfo.ProductId;
        team.UpdatedAt = DateTimeOffset.UtcNow;
        
        await _teamRepository.UpdateAsync(team);

        // Create or update purchase history record
        var existingPurchaseHistory = string.IsNullOrEmpty(transactionInfo.OriginalTransactionId) 
            ? null 
            : await _purchaseHistoryRepository.GetByTransactionIdAsync(transactionInfo.OriginalTransactionId);
        
        if (existingPurchaseHistory == null)
        {
            // Create new purchase history record
            var purchaseHistory = new PurchaseHistory
            {
                TeamId = team.Id,
                Platform = "ios",
                ProductId = transactionInfo.ProductId,
                SubscriptionTier = tier,
                TransactionId = transactionInfo.TransactionId,
                OriginalTransactionId = transactionInfo.OriginalTransactionId,
                ReceiptData = request.SignedTransactionInfo,
                PurchaseDate = DateTimeOffset.FromUnixTimeMilliseconds(transactionInfo.PurchaseDate),
                ExpiryDate = expiryDate,
                IsActive = true,
                IsVerified = true,
                VerifiedAt = DateTimeOffset.UtcNow
            };

            await _purchaseHistoryRepository.CreateAsync(purchaseHistory);
        }
        else
        {
            // Update existing record
            existingPurchaseHistory.TransactionId = transactionInfo.TransactionId;
            existingPurchaseHistory.ExpiryDate = expiryDate;
            existingPurchaseHistory.SubscriptionTier = tier;
            existingPurchaseHistory.ReceiptData = request.SignedTransactionInfo;
            existingPurchaseHistory.IsVerified = true;
            existingPurchaseHistory.VerifiedAt = DateTimeOffset.UtcNow;
            existingPurchaseHistory.UpdatedAt = DateTimeOffset.UtcNow;

            await _purchaseHistoryRepository.UpdateAsync(existingPurchaseHistory);
        }

        _logger.LogInformation("iOS StoreKit 2 purchase verified and recorded for team {TeamId}", team.Id);

        return new VerifyPurchaseResponse
        {
            Success = true,
            Message = "Purchase verified successfully using StoreKit 2",
            SubscriptionTier = tier,
            ExpirationDate = expiryDate
        };
    }

    private async Task<VerifyPurchaseResponse> VerifyIosStoreKit1Purchase(VerifyPurchaseRequest request, Team team)
    {
        if (string.IsNullOrEmpty(request.ReceiptData))
        {
            _logger.LogWarning("ReceiptData is missing for iOS purchase verification for team {TeamId}", team.Id);
            return new VerifyPurchaseResponse 
            { 
                Success = false, 
                Message = "ReceiptData is required for iOS" 
            };
        }

        // Verify with Apple
        var verificationResult = await _appleService.VerifyReceiptAsync(request.ReceiptData);

        if (verificationResult == null || verificationResult.Status != 0)
        {
            _logger.LogWarning("Failed to verify receipt with Apple for team {TeamId}. Status: {Status}", team.Id, verificationResult?.Status ?? -1);
            return new VerifyPurchaseResponse 
            { 
                Success = false, 
                Message = $"Failed to verify receipt with Apple. Status: {verificationResult?.Status ?? -1}" 
            };
        }
        _logger.LogInformation("Apple receipt verified successfully for team {TeamId} : Status={Status}", team.Id, verificationResult.Status);

        // Get the latest receipt info
        var latestReceipt = verificationResult.LatestReceiptInfo?.FirstOrDefault();
        if (latestReceipt == null)
        {
            _logger.LogWarning("No receipt information found for iOS purchase verification for team {TeamId}", team.Id);
            return new VerifyPurchaseResponse 
            { 
                Success = false, 
                Message = "No receipt information found" 
            };
        }

        // Map product ID to subscription tier
        var tier = MapProductIdToTier(request.ProductId);
        var expiryDate = DateTimeOffset.FromUnixTimeMilliseconds(long.Parse(latestReceipt.ExpiresDateMs ?? "0"));

        // Update team subscription
        team.SubscriptionTier = tier;
        team.SubscriptionExpiresAt = expiryDate;
        team.SubscriptionPlatform = "ios";
        team.TransactionId = request.TransactionId;
        team.OriginalTransactionId = latestReceipt.OriginalTransactionId;
        team.ReceiptData = request.ReceiptData;  // Store for customer support and audit trail
        team.ProductId = request.ProductId;
        team.UpdatedAt = DateTimeOffset.UtcNow;
        
        await _teamRepository.UpdateAsync(team);

        // Create or update purchase history record
        var existingPurchaseHistory = string.IsNullOrEmpty(latestReceipt.OriginalTransactionId) 
            ? null 
            : await _purchaseHistoryRepository.GetByTransactionIdAsync(latestReceipt.OriginalTransactionId);
        
        if (existingPurchaseHistory == null)
        {
            // Create new purchase history record
            var purchaseHistory = new PurchaseHistory
            {
                TeamId = team.Id,
                Platform = "ios",
                ProductId = request.ProductId,
                SubscriptionTier = tier,
                TransactionId = request.TransactionId,
                OriginalTransactionId = latestReceipt.OriginalTransactionId,
                ReceiptData = request.ReceiptData,  // Store for customer support and audit trail
                PurchaseDate = DateTimeOffset.UtcNow,
                ExpiryDate = expiryDate,
                IsActive = true,
                IsVerified = true,
                VerifiedAt = DateTimeOffset.UtcNow
            };

            await _purchaseHistoryRepository.CreateAsync(purchaseHistory);
        }
        else
        {
            // Update existing record
            existingPurchaseHistory.TransactionId = request.TransactionId;
            existingPurchaseHistory.ExpiryDate = expiryDate;
            existingPurchaseHistory.SubscriptionTier = tier;
            existingPurchaseHistory.ReceiptData = request.ReceiptData;
            existingPurchaseHistory.IsVerified = true;
            existingPurchaseHistory.VerifiedAt = DateTimeOffset.UtcNow;
            existingPurchaseHistory.UpdatedAt = DateTimeOffset.UtcNow;

            await _purchaseHistoryRepository.UpdateAsync(existingPurchaseHistory);
        }

        _logger.LogInformation("iOS purchase verified and recorded for team {TeamId}", team.Id);

        return new VerifyPurchaseResponse
        {
            Success = true,
            Message = "Purchase verified successfully",
            SubscriptionTier = tier,
            ExpirationDate = expiryDate
        };
    }

    public async Task<CancelSubscriptionResponse> CancelSubscription(CancelSubscriptionRequest request)
    {
        try
        {
            var teamId = _currentUserService.TeamId;
            var team = await _teamRepository.GetDetailsAsync(teamId);
            
            if (team == null)
            {
                return new CancelSubscriptionResponse 
                { 
                    Success = false, 
                    Message = "Team not found" 
                };
            }

            if (request.Platform.ToLower() == Constants.ANDROID_PLATFORM)
            {
                // For Android, we would need to call Google Play API to cancel
                // However, Google recommends handling cancellations through the app settings
                // The webhook will notify us when the user cancels
                _logger.LogInformation("Android subscription cancellation requested for team {TeamId}", team.Id);
                return new CancelSubscriptionResponse
                {
                    Success = false,
                    Message = "Android subscriptions must be cancelled through Google Play Store settings. The system will be notified automatically.",
                    ExpirationDate = team.SubscriptionExpiresAt
                };
            }
            else if (request.Platform.ToLower() == Constants.IOS_PLATFORM)
            {
                // For iOS, redirect to App Store subscription management
                var managementUrl = "https://apps.apple.com/account/subscriptions";
                
                _logger.LogInformation("iOS subscription cancellation requested for team {TeamId}", team.Id);
                return new CancelSubscriptionResponse
                {
                    Success = true,
                    Message = "Please use the link to manage your subscription in the App Store",
                    CancellationUrl = managementUrl,
                    ExpirationDate = team.SubscriptionExpiresAt
                };
            }
            else
            {
                _logger.LogWarning("Invalid platform '{Platform}' for subscription cancellation for team {TeamId}", request.Platform, team.Id);
                return new CancelSubscriptionResponse 
                { 
                    Success = false, 
                    Message = $"Invalid platform. Must be '{Constants.ANDROID_PLATFORM}' or '{Constants.IOS_PLATFORM}'" 
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling subscription for team {TeamId}", _currentUserService.TeamId);
            return new CancelSubscriptionResponse 
            { 
                Success = false, 
                Message = "An error occurred while processing the cancellation" 
            };
        }
    }

    public async Task<PurchaseReceiptResponse> GetPurchaseReceipt()
    {
        var teamId = _currentUserService.TeamId;
        var purchases = await _purchaseHistoryRepository.GetByTeamIdAsync(teamId);
        
        var team = await _teamRepository.GetDetailsAsync(teamId);
        
        var receiptItems = purchases.Select(p => new PurchaseReceiptItem
        {
            Id = p.Id,
            Platform = p.Platform,
            ProductId = p.ProductId,
            SubscriptionTier = p.SubscriptionTier,
            PurchaseDate = p.PurchaseDate,
            ExpiryDate = p.ExpiryDate,
            IsActive = p.IsActive,
            IsCancelled = p.IsCancelled,
            CancelledAt = p.CancelledAt
        }).ToList();

        return new PurchaseReceiptResponse
        {
            Purchases = receiptItems,
            CurrentPlatform = team?.SubscriptionPlatform
        };
    }

    private SubscriptionTier MapProductIdToTier(string productId)
    {
        // Map product IDs to subscription tiers
        // TODO: Move to configuration or database
        return productId.ToLower() switch
        {
            var id when id.Contains("pro") => SubscriptionTier.Pro,
            _ => SubscriptionTier.Free
        };
    }
}

internal class SubscriptionHelper
{
    internal static SubscriptionLimitsResponse GetSubscriptionLimits(SubscriptionInfo teamSubscriptionInfo, SubscriptionStatusResponse subscriptionStatus, SubscriptionSettings subscriptionSettings
        , int taskItemsCount = 0, int taskItemsUnarchivedCount = 0, int membersCount = 0, int membersActiveCount = 0, int allowanceIntervalsCount = 0, int allowanceIntervalsActiveCount = 0)
    {
        if (!subscriptionSettings.MonetizationEnabled)
        {
            return new SubscriptionLimitsResponse
            {
                SubscriptionTier = SubscriptionTier.Pro,
                TeamMembersLimit = new FeatureLimit
                {
                    Max = Constants.UNLIMITED,
                    CurrentTotal = membersCount,
                    CurrentActive = membersActiveCount,
                    CanAdd = true
                },
                TaskItemsLimit = new FeatureLimit
                {
                    Max = Constants.UNLIMITED,
                    CurrentTotal = taskItemsCount,
                    CurrentActive = taskItemsUnarchivedCount,
                    CanAdd = true
                },
                AllowanceIntervalsLimit = new FeatureLimit
                {
                    Max = Constants.UNLIMITED,
                    CurrentTotal = allowanceIntervalsCount,
                    CurrentActive = allowanceIntervalsActiveCount,
                    CanAdd = true
                },
                Bonuses = true,
                GradeConfiguration = true,
                Multiselect = true,
                PrivateTasks = true,
                ProposedTasks = true,
                TaskComments = true,
                ImageAvatars = true
            };
        }

        SubscriptionTier tier = teamSubscriptionInfo.SubscriptionTier;
        var trialOrGracePeriodActive = subscriptionStatus.IsTrialActive || subscriptionStatus.IsGracePeriodActive;
        var subscriptionActive = subscriptionStatus.IsActive;

        var limits = new SubscriptionLimitsResponse
        {
            SubscriptionTier = tier,
            TeamMembersLimit = tier switch
            {
                SubscriptionTier.Free => new FeatureLimit { 
                    Max = subscriptionSettings.MaxFreeUsersPerTeam, 
                    CurrentTotal = membersCount, 
                    CurrentActive = membersActiveCount,
                    // Grandfather: can't add if at/over limit, but keep existing
                    CanAdd = membersCount < subscriptionSettings.MaxFreeUsersPerTeam || trialOrGracePeriodActive
                },
                SubscriptionTier.Pro => new FeatureLimit { 
                    Max = subscriptionActive ? Constants.UNLIMITED : subscriptionSettings.MaxFreeUsersPerTeam, 
                    CurrentTotal = membersCount, 
                    CurrentActive = membersActiveCount,
                    CanAdd = subscriptionActive || membersCount < subscriptionSettings.MaxFreeUsersPerTeam
                },
                _ => new FeatureLimit()
            },
            TaskItemsLimit = tier switch
            {
                SubscriptionTier.Free => new FeatureLimit { 
                    Max = subscriptionSettings.MaxFreeTasksPerTeam, 
                    CurrentTotal = taskItemsCount, 
                    CurrentActive = taskItemsUnarchivedCount,
                    CanAdd = taskItemsCount < subscriptionSettings.MaxFreeTasksPerTeam || trialOrGracePeriodActive
                },
                SubscriptionTier.Pro => new FeatureLimit { 
                    Max = subscriptionActive ? Constants.UNLIMITED : subscriptionSettings.MaxFreeTasksPerTeam, 
                    CurrentTotal = taskItemsCount, 
                    CurrentActive = taskItemsUnarchivedCount,
                    CanAdd = subscriptionActive || taskItemsCount < subscriptionSettings.MaxFreeTasksPerTeam
                },
                _ => new FeatureLimit()
            },
            AllowanceIntervalsLimit = tier switch
            {
                SubscriptionTier.Free => new FeatureLimit { 
                    Max = subscriptionSettings.MaxFreeAllowanceIntervalsPerTeam, 
                    CurrentTotal = allowanceIntervalsCount, 
                    CurrentActive = allowanceIntervalsActiveCount,
                    CanAdd = allowanceIntervalsCount < subscriptionSettings.MaxFreeAllowanceIntervalsPerTeam || trialOrGracePeriodActive
                },
                SubscriptionTier.Pro => new FeatureLimit { 
                    Max = subscriptionActive ? Constants.UNLIMITED : subscriptionSettings.MaxFreeAllowanceIntervalsPerTeam, 
                    CurrentTotal = allowanceIntervalsCount, 
                    CanAdd = subscriptionActive || allowanceIntervalsCount < subscriptionSettings.MaxFreeAllowanceIntervalsPerTeam
                },
                _ => new FeatureLimit()
            },      
            Bonuses = tier switch
            {
                SubscriptionTier.Free => trialOrGracePeriodActive,
                SubscriptionTier.Pro => subscriptionActive,
                _ => false
            },
            GradeConfiguration = tier switch
            {
                SubscriptionTier.Free => trialOrGracePeriodActive,
                SubscriptionTier.Pro => subscriptionActive,
                _ => false
            },
            Multiselect = tier switch
            {
                SubscriptionTier.Free => trialOrGracePeriodActive,
                SubscriptionTier.Pro => subscriptionActive,
                _ => false
            },
            PrivateTasks = tier switch
            {
                SubscriptionTier.Free => trialOrGracePeriodActive,
                SubscriptionTier.Pro => subscriptionActive,
                _ => false
            },
            ProposedTasks = tier switch
            {
                SubscriptionTier.Free => trialOrGracePeriodActive,
                SubscriptionTier.Pro => subscriptionActive,
                _ => false
            },
            TaskComments = tier switch
            {
                SubscriptionTier.Free => trialOrGracePeriodActive,
                SubscriptionTier.Pro => subscriptionActive,
                _ => false
            },
            ImageAvatars = tier switch
            {
                SubscriptionTier.Free => trialOrGracePeriodActive,
                SubscriptionTier.Pro => subscriptionActive,
                _ => false
            }
        };

        return limits;
    }
}