/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Microsoft.AspNetCore.Mvc;
using DoDone.Server.Services.Webhooks;
using DoDone.Server.Dtos.Webhooks;
using System.Text.Json;

namespace DoDone.Server.Controllers;

/// <summary>
/// Webhook endpoints for subscription notifications from Google Play and Apple App Store
/// These endpoints do NOT require authentication as they are called by external services
/// </summary>
[Route("api/webhooks")]
[ApiController]
public class WebhookController : ControllerBase
{
    private readonly IGooglePlayWebhookService _googlePlayService;
    private readonly IAppleWebhookService _appleService;
    private readonly ISubscriptionWebhookService _subscriptionService;
    private readonly ILogger<WebhookController> _logger;

    public WebhookController(
        IGooglePlayWebhookService googlePlayService,
        IAppleWebhookService appleService,
        ISubscriptionWebhookService subscriptionService,
        ILogger<WebhookController> logger)
    {
        _googlePlayService = googlePlayService;
        _appleService = appleService;
        _subscriptionService = subscriptionService;
        _logger = logger;
    }

    /// <summary>
    /// Webhook endpoint for Google Play subscription notifications via Cloud Pub/Sub
    /// https://developer.android.com/google/play/billing/rtdn-reference
    /// </summary>
    /// <param name="pubSubMessage">The Pub/Sub message from Google Cloud</param>
    /// <returns>200 OK to acknowledge receipt, or error status</returns>
    [HttpPost("google-play-subscription")]
    public async Task<IActionResult> GooglePlaySubscription([FromBody] GooglePlayPubSubMessage pubSubMessage)
    {
        try
        {
            _logger.LogInformation("Received Google Play webhook notification");

            if (pubSubMessage == null)
            {
                _logger.LogWarning("Received null Pub/Sub message");
                return BadRequest("Invalid Pub/Sub message");
            }

            // Log the raw message for debugging
            _logger.LogDebug("Pub/Sub message: {Message}", JsonSerializer.Serialize(pubSubMessage));

            // Verify and decode the notification
            var notification = _googlePlayService.VerifyAndDecodeNotificationAsync(pubSubMessage);
            
            if (notification == null)
            {
                _logger.LogError("Failed to verify and decode Google Play notification");
                return BadRequest("Failed to decode notification");
            }

            // Process the notification
            var success = await _subscriptionService.ProcessGooglePlayNotificationAsync(notification);

            if (!success)
            {
                _logger.LogError("Failed to process Google Play notification. Check logs for purchase token lookup and database errors.");
                // Return 200 anyway to prevent Pub/Sub from retrying
                // The error has been logged for investigation
                return Ok(new { 
                    processed = false, 
                    message = "Notification logged but processing failed - check server logs for team lookup or database errors"
                });
            }

            _logger.LogInformation("Successfully processed Google Play notification");
            return Ok(new { processed = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Google Play webhook: {ErrorMessage}", ex.Message);
            // Return 200 to prevent retry spam, but log the error
            return Ok(new { 
                processed = false, 
                error = "Internal error - check server logs for database or API errors" 
            });
        }
    }

    /// <summary>
    /// Webhook endpoint for Apple App Store Server Notifications (V2)
    /// https://developer.apple.com/documentation/appstoreservernotifications
    /// </summary>
    /// <param name="notification">The signed notification from Apple</param>
    /// <returns>200 OK to acknowledge receipt, or error status</returns>
    [HttpPost("apple-subscription")]
    public async Task<IActionResult> AppleSubscription([FromBody] AppleServerNotification notification)
    {
        try
        {
            _logger.LogInformation("Received Apple App Store webhook notification");

            if (notification == null || string.IsNullOrEmpty(notification.SignedPayload))
            {
                _logger.LogWarning("Received null or invalid Apple notification");
                return BadRequest("Invalid notification");
            }

            _logger.LogInformation("Apple notification received with signed payload length: {Length}", 
                notification.SignedPayload.Length);

            // Verify JWS signature and decode the payload
            var payload = await _appleService.VerifyAndDecodeJwsAsync(notification.SignedPayload);

            if (payload == null)
            {
                _logger.LogError("Failed to verify and decode Apple JWS");
                return Ok(new { processed = false, message = "Failed to verify and decode Apple JWS" });
            }

            _logger.LogInformation("Apple notification type: {Type}, UUID: {UUID}", 
                payload.NotificationType, payload.NotificationUUID);

            // Process the notification
            var success = await _subscriptionService.ProcessAppleNotificationAsync(payload);

            if (!success)
            {
                _logger.LogError("Failed to process Apple notification");
                // Return 200 anyway to prevent Apple from retrying excessively
                return Ok(new { processed = false, message = "Notification logged but processing failed" });
            }

            _logger.LogInformation("Successfully processed Apple notification");
            return Ok(new { processed = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Apple webhook");
            // Return 200 to prevent retry spam, but log the error
            return Ok(new { processed = false, error = "Internal error - logged for investigation" });
        }
    }

    /// <summary>
    /// Test endpoint to verify webhook connectivity
    /// </summary>
    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new 
        { 
            status = "healthy", 
            timestamp = DateTimeOffset.UtcNow,
            endpoints = new[]
            {
                "/api/webhooks/google-play-subscription",
                "/api/webhooks/apple-subscription"
            }
        });
    }
}
