/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Server.Dtos.Webhooks;
using Google.Apis.AndroidPublisher.v3;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using System.Text;
using System.Text.Json;

namespace DoDone.Server.Services.Webhooks;

public interface IGooglePlayWebhookService
{
    GooglePlayDeveloperNotification? VerifyAndDecodeNotificationAsync(GooglePlayPubSubMessage pubSubMessage);
    Task<GooglePlaySubscriptionResponse?> VerifyPurchaseTokenAsync(string packageName, string subscriptionId, string purchaseToken);
    Task<bool> AcknowledgePurchaseAsync(string packageName, string subscriptionId, string purchaseToken);
}

public class GooglePlayWebhookService : IGooglePlayWebhookService
{
    private readonly ILogger<GooglePlayWebhookService> _logger;
    private readonly IConfiguration _configuration;
    private readonly AndroidPublisherService? _androidPublisherService;

    public GooglePlayWebhookService(
        ILogger<GooglePlayWebhookService> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;

        // Initialize Google Play Developer API service
        var serviceAccountJson = _configuration["Subscription:GooglePlay:ServiceAccountJson"];
        
        if (!string.IsNullOrEmpty(serviceAccountJson))
        {
            try
            {
                GoogleCredential credential;
                
                // Check if it's a file path or JSON content
                if (File.Exists(serviceAccountJson))
                {
                    using var stream = new FileStream(serviceAccountJson, FileMode.Open, FileAccess.Read);
                    credential = ServiceAccountCredential.FromServiceAccountData(stream)
                        .ToGoogleCredential()
                        .CreateScoped(AndroidPublisherService.Scope.Androidpublisher);
                }
                else
                {
                    // Assume it's JSON content (from environment variable)
                    var credentialBytes = Encoding.UTF8.GetBytes(serviceAccountJson);
                    using var stream = new MemoryStream(credentialBytes);
                    credential = ServiceAccountCredential.FromServiceAccountData(stream)
                        .ToGoogleCredential()
                        .CreateScoped(AndroidPublisherService.Scope.Androidpublisher);
                }

                _androidPublisherService = new AndroidPublisherService(new BaseClientService.Initializer
                {
                    HttpClientInitializer = credential,
                    ApplicationName = "DoDone"
                });

                _logger.LogInformation("Google Play Developer API service initialized successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize Google Play Developer API service");
            }
        }
        else
        {
            _logger.LogWarning("Google Play service account JSON not configured");
        }
    }

    public GooglePlayDeveloperNotification? VerifyAndDecodeNotificationAsync(GooglePlayPubSubMessage pubSubMessage)
    {
        try
        {
            if (pubSubMessage?.Message == null || string.IsNullOrEmpty(pubSubMessage.Message.Data))
            {
                _logger.LogWarning("Invalid Pub/Sub message received");
                return null;
            }

            // Decode base64 data
            var decodedBytes = Convert.FromBase64String(pubSubMessage.Message.Data);
            var decodedJson = Encoding.UTF8.GetString(decodedBytes);

            // Deserialize to notification object
            var notification = JsonSerializer.Deserialize<GooglePlayDeveloperNotification>(decodedJson);

            if (notification == null)
            {
                _logger.LogWarning("Failed to deserialize Google Play notification");
                return null;
            }

            _logger.LogInformation("Successfully decoded Google Play notification: {NotificationType}", 
                notification.SubscriptionNotification?.NotificationType);

            return notification;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying and decoding Google Play notification");
            return null;
        }
    }

    public async Task<GooglePlaySubscriptionResponse?> VerifyPurchaseTokenAsync(
        string packageName, 
        string subscriptionId, 
        string purchaseToken)
    {
        try
        {
            if (_androidPublisherService == null)
            {
                _logger.LogError("Android Publisher Service not initialized");
                return null;
            }

            var request = _androidPublisherService.Purchases.Subscriptions.Get(
                packageName, 
                subscriptionId, 
                purchaseToken);

            var response = await request.ExecuteAsync();

            if (response == null)
            {
                _logger.LogWarning("No response from Google Play API for purchase token verification");
                return null;
            }

            // Map Google API response to our DTO
            var subscriptionResponse = new GooglePlaySubscriptionResponse
            {
                Kind = response.Kind ?? "",
                StartTimeMillis = response.StartTimeMillis ?? 0,
                ExpiryTimeMillis = response.ExpiryTimeMillis ?? 0,
                AutoRenewing = response.AutoRenewing ?? false,
                PriceCurrencyCode = response.PriceCurrencyCode ?? "",
                PriceAmountMicros = response.PriceAmountMicros ?? 0,
                CountryCode = response.CountryCode ?? "",
                DeveloperPayload = response.DeveloperPayload ?? "",
                PaymentState = response.PaymentState,
                CancelReason = response.CancelReason,
                UserCancellationTimeMillis = response.UserCancellationTimeMillis,
                OrderId = response.OrderId ?? "",
                LinkedPurchaseToken = response.LinkedPurchaseToken,
                PurchaseType = response.PurchaseType,
                AcknowledgementState = response.AcknowledgementState ?? 0,
                ObfuscatedExternalAccountId = response.ObfuscatedExternalAccountId
            };

            _logger.LogInformation("Successfully verified purchase token. Expires at: {ExpiryTime}", 
                DateTimeOffset.FromUnixTimeMilliseconds(subscriptionResponse.ExpiryTimeMillis));

            return subscriptionResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying purchase token with Google Play API");
            return null;
        }
    }

    public async Task<bool> AcknowledgePurchaseAsync(
        string packageName, 
        string subscriptionId, 
        string purchaseToken)
    {
        try
        {
            if (_androidPublisherService == null)
            {
                _logger.LogError("Android Publisher Service not initialized");
                return false;
            }

            var request = _androidPublisherService.Purchases.Subscriptions.Acknowledge(
                new Google.Apis.AndroidPublisher.v3.Data.SubscriptionPurchasesAcknowledgeRequest(),
                packageName,
                subscriptionId,
                purchaseToken);

            await request.ExecuteAsync();

            _logger.LogInformation("Successfully acknowledged purchase token");
            return true;
        }
        catch (Google.GoogleApiException ex) when (ex.HttpStatusCode == System.Net.HttpStatusCode.Conflict)
        {
            // Conflict means the purchase is already acknowledged or being acknowledged
            // This can happen due to race conditions between /api/subscription/verify and webhook processing
            _logger.LogInformation("Purchase token already acknowledged (Conflict error). This is expected when /api/subscription/verify runs concurrently with webhook processing.");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error acknowledging purchase with Google Play API");
            return false;
        }
    }
}
