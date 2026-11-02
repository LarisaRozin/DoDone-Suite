/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Repositories;
using DoDone.Server.Dtos.Webhooks;
using Microsoft.Extensions.Configuration;
using System.Text.Json;

namespace DoDone.Server.Services.Webhooks;

/// <summary>
/// Configuration for webhook retry settings
/// </summary>
public class WebhookRetrySettings
{
    public bool Enabled { get; set; } = true;
    public int CheckIntervalSeconds { get; set; } = 30;
    public int MaxConcurrentRetries { get; set; } = 50;
}

/// <summary>
/// Background service that periodically retries failed webhook notifications
/// This handles race conditions where webhooks arrive before subscription verification
/// </summary>
public class WebhookRetryBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<WebhookRetryBackgroundService> _logger;
    private readonly WebhookRetrySettings _settings;

    public WebhookRetryBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<WebhookRetryBackgroundService> logger,
        IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _settings = new WebhookRetrySettings();
        configuration.GetSection("WebhookRetry").Bind(_settings);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_settings.Enabled)
        {
            _logger.LogInformation("Webhook Retry Background Service is disabled");
            return;
        }

        _logger.LogInformation("Webhook Retry Background Service started (CheckInterval: {Interval}s, MaxRetries: {Max})",
            _settings.CheckIntervalSeconds, _settings.MaxConcurrentRetries);

        var checkInterval = TimeSpan.FromSeconds(_settings.CheckIntervalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingWebhooksAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Service is shutting down, exit gracefully
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in webhook retry background service");
            }

            try
            {
                await Task.Delay(checkInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("Webhook Retry Background Service stopped");
    }

    private async Task ProcessPendingWebhooksAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var repository = scope.ServiceProvider.GetRequiredService<IFailedWebhookNotificationRepository>();
            var subscriptionService = scope.ServiceProvider.GetRequiredService<ISubscriptionWebhookService>();

            List<DoDone.Db.Models.FailedWebhookNotification>? pendingNotifications = null;
            
            try
            {
                pendingNotifications = await repository.GetPendingRetriesAsync(_settings.MaxConcurrentRetries);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to query pending webhooks from database. Will retry next cycle.");
                return;
            }

            if (pendingNotifications == null || pendingNotifications.Count == 0)
            {
                return;
            }

            _logger.LogInformation("Processing {Count} pending webhook notifications", pendingNotifications.Count);

            foreach (var notification in pendingNotifications)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    break;
                }

                await ProcessNotificationAsync(notification, repository, subscriptionService);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in ProcessPendingWebhooksAsync");
        }
    }

    private async Task ProcessNotificationAsync(
        DoDone.Db.Models.FailedWebhookNotification notification,
        IFailedWebhookNotificationRepository repository,
        ISubscriptionWebhookService subscriptionService)
    {
        try
        {
            _logger.LogInformation("Retrying webhook notification {Id} (attempt {RetryCount}/{MaxRetries})",
                notification.Id, notification.RetryCount + 1, notification.MaxRetries);

            notification.RetryCount++;
            notification.LastRetryAt = DateTimeOffset.UtcNow;

            bool success = false;

            try
            {
                if (notification.Platform == "google-play")
                {
                    var googleNotification = JsonSerializer.Deserialize<GooglePlayDeveloperNotification>(notification.Payload);
                    if (googleNotification != null)
                    {
                        success = await subscriptionService.ProcessGooglePlayNotificationAsync(googleNotification);
                    }
                    else
                    {
                        _logger.LogWarning("Failed to deserialize Google Play notification {Id}", notification.Id);
                    }
                }
                else if (notification.Platform == "apple")
                {
                    var appleNotification = JsonSerializer.Deserialize<AppleNotificationPayload>(notification.Payload);
                    if (appleNotification != null)
                    {
                        success = await subscriptionService.ProcessAppleNotificationAsync(appleNotification);
                    }
                    else
                    {
                        _logger.LogWarning("Failed to deserialize Apple notification {Id}", notification.Id);
                    }
                }
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize notification payload for {Id}", notification.Id);
                success = false;
            }

            // Update the notification with a fresh scope to avoid stale EF Core contexts
            using var updateScope = _serviceProvider.CreateScope();
            var updateRepository = updateScope.ServiceProvider.GetRequiredService<IFailedWebhookNotificationRepository>();

            // Re-fetch the notification to ensure we have current data
            var currentNotification = await updateRepository.GetByIdAsync(notification.Id);
            if (currentNotification == null)
            {
                _logger.LogWarning("Could not find notification {Id} for update", notification.Id);
                return;
            }

            currentNotification.RetryCount = notification.RetryCount;
            currentNotification.LastRetryAt = notification.LastRetryAt;

            if (success)
            {
                _logger.LogInformation("Successfully processed webhook notification {Id} on retry {RetryCount}",
                    currentNotification.Id, currentNotification.RetryCount);

                currentNotification.IsProcessed = true;
                currentNotification.ProcessedAt = DateTimeOffset.UtcNow;
            }
            else
            {
                _logger.LogWarning("Failed to process webhook notification {Id} on retry {RetryCount}",
                    currentNotification.Id, currentNotification.RetryCount);

                if (currentNotification.RetryCount >= currentNotification.MaxRetries)
                {
                    _logger.LogError("Abandoning webhook notification {Id} after {MaxRetries} failed attempts",
                        currentNotification.Id, currentNotification.MaxRetries);

                    currentNotification.IsAbandoned = true;
                    currentNotification.AbandonedAt = DateTimeOffset.UtcNow;
                }
                else
                {
                    // Exponential backoff: 1min, 2min, 4min, 8min, etc.
                    var delayMinutes = Math.Pow(2, currentNotification.RetryCount);
                    currentNotification.NextRetryAt = DateTimeOffset.UtcNow.AddMinutes(delayMinutes);
                    
                    _logger.LogInformation("Will retry webhook notification {Id} again at {NextRetry}",
                        currentNotification.Id, currentNotification.NextRetryAt);
                }
            }

            await updateRepository.UpdateAsync(currentNotification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing webhook notification {Id}: {ErrorMessage}",
                notification.Id, ex.Message);

            // Try to update next retry time, but don't fail if we can't
            try
            {
                using var updateScope = _serviceProvider.CreateScope();
                var updateRepository = updateScope.ServiceProvider.GetRequiredService<IFailedWebhookNotificationRepository>();
                var currentNotification = await updateRepository.GetByIdAsync(notification.Id);
                
                if (currentNotification != null && !currentNotification.IsProcessed && !currentNotification.IsAbandoned)
                {
                    currentNotification.NextRetryAt = DateTimeOffset.UtcNow.AddMinutes(Math.Pow(2, currentNotification.RetryCount + 1));
                    await updateRepository.UpdateAsync(currentNotification);
                }
            }
            catch (Exception updateEx)
            {
                _logger.LogWarning(updateEx, "Failed to update retry schedule for notification {Id}", notification.Id);
            }
        }
    }
}
