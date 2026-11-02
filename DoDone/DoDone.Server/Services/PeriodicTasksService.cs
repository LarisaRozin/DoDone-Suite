/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Dtos;
using DoDone.Db.Repositories;
using DoDone.Shared;
using DoDone.Shared.Abstractions;
using Microsoft.Extensions.Options;

namespace DoDone.Server.Services;

public class PeriodicTasksService : BackgroundService
{
    private readonly ILogger<PeriodicTasksService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly PeriodicTasksConfiguration _periodicTaskConfig;
    private readonly SubscriptionSettings _subscriptionsConfig;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1); // Check every minute
    private readonly SemaphoreSlim _executionLock = new SemaphoreSlim(1, 1); // Prevent concurrent execution

    private readonly DateTimeOffset _serviceStartTime;
    private DateTimeOffset _lastResetTaskGradesOnIntervalChange;
    private DateTimeOffset _lastTaskDueSoonNotification;
    private DateTimeOffset _lastTaskDueTodayNotification;
    private DateTimeOffset _lastTaskStartingSoonNotification;
    private DateTimeOffset _lastTaskStartingTodayNotification;
    private DateTimeOffset _lastTaskEndingSoonNotification;
    private DateTimeOffset _lastTaskEndingTodayNotification;
    private DateTimeOffset _lastAllowanceDaySoonNotification;
    private DateTimeOffset _lastAllowanceDayTodayNotification;

    private DateTimeOffset _lastWelcomeNotificationsToGrandfatheredUsers;
    private DateTimeOffset _lastTrial3DayWarningNotifications;
    private DateTimeOffset _lastTrial1DayWarningNotifications;
    private DateTimeOffset _lastTrialEndedWarningNotifications;
    private DateTimeOffset _lastGrandfatheredTrial3DayWarningNotifications;
    private DateTimeOffset _lastGrandfatheredTrial1DayWarningNotifications;
    private DateTimeOffset _lastGrandfatheredTrialEndedWarningNotifications;

    private DateTimeOffset _lastHeartbeatLog;


    public PeriodicTasksService(
        ILogger<PeriodicTasksService> logger, 
        IServiceProvider serviceProvider,
        IOptions<PeriodicTasksConfiguration> periodicTaskConfig,
        IOptions<SubscriptionSettings> subscriptionsConfig)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _periodicTaskConfig = periodicTaskConfig.Value;
        _subscriptionsConfig = subscriptionsConfig.Value;
        
        // Initialize service start time
        _serviceStartTime = DateTimeOffset.UtcNow;
        
        // Initialize last run times with staggered delays
        _lastResetTaskGradesOnIntervalChange = _serviceStartTime.AddMinutes(-_periodicTaskConfig.ResetTaskGradesOnIntervalChangeInitialDelayMinutes);
        _lastTaskDueSoonNotification = _serviceStartTime.AddMinutes(-_periodicTaskConfig.TaskDueSoonNotificationsInitialDelayMinutes);
        _lastTaskDueTodayNotification = _serviceStartTime.AddMinutes(-_periodicTaskConfig.TaskDueTodayNotificationsInitialDelayMinutes);
        _lastTaskStartingSoonNotification = _serviceStartTime.AddMinutes(-_periodicTaskConfig.TaskStartingSoonNotificationsInitialDelayMinutes);
        _lastTaskStartingTodayNotification = _serviceStartTime.AddMinutes(-_periodicTaskConfig.TaskStartingTodayNotificationsInitialDelayMinutes);
        _lastTaskEndingSoonNotification = _serviceStartTime.AddMinutes(-_periodicTaskConfig.TaskEndingSoonNotificationsInitialDelayMinutes);
        _lastTaskEndingTodayNotification = _serviceStartTime.AddMinutes(-_periodicTaskConfig.TaskEndingTodayNotificationsInitialDelayMinutes);
        _lastAllowanceDaySoonNotification = _serviceStartTime.AddMinutes(-_periodicTaskConfig.AllowanceDaySoonNotificationsInitialDelayMinutes);
        _lastAllowanceDayTodayNotification = _serviceStartTime.AddMinutes(-_periodicTaskConfig.AllowanceDayTodayNotificationsInitialDelayMinutes);

        _lastWelcomeNotificationsToGrandfatheredUsers = _serviceStartTime.AddMinutes(-_periodicTaskConfig.WelcomeNotificationsToGrandfatheredUsersInitialDelayMinutes);
        _lastTrial3DayWarningNotifications = _serviceStartTime.AddMinutes(-_periodicTaskConfig.Trial3DayWarningNotificationsInitialDelayMinutes);
        _lastTrial1DayWarningNotifications = _serviceStartTime.AddMinutes(-_periodicTaskConfig.Trial1DayWarningNotificationsInitialDelayMinutes);
        _lastTrialEndedWarningNotifications = _serviceStartTime.AddMinutes(-_periodicTaskConfig.TrialEndedWarningNotificationsInitialDelayMinutes);
        _lastGrandfatheredTrial3DayWarningNotifications = _serviceStartTime.AddMinutes(-_periodicTaskConfig.GrandfatheredTrial3DayWarningNotificationsInitialDelayMinutes);
        _lastGrandfatheredTrial1DayWarningNotifications = _serviceStartTime.AddMinutes(-_periodicTaskConfig.GrandfatheredTrial1DayWarningNotificationsInitialDelayMinutes);
        _lastGrandfatheredTrialEndedWarningNotifications = _serviceStartTime.AddMinutes(-_periodicTaskConfig.GrandfatheredTrialEndedWarningNotificationsInitialDelayMinutes);

        _lastHeartbeatLog = _serviceStartTime;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Check if the service is enabled
        if (!_periodicTaskConfig.EnablePeriodicTasksService)
        {
            _logger.LogInformation("Periodic Tasks Service is disabled via configuration");
            return;
        }

        _logger.LogInformation("Periodic Tasks Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Try to acquire lock, skip if previous execution still running
                if (await _executionLock.WaitAsync(0, stoppingToken))
                {
                    try
                    {
                        await RunPeriodicTasks();
                    }
                    finally
                    {
                        _executionLock.Release();
                    }
                }
                else
                {
                    _logger.LogWarning("Periodic tasks still running from previous cycle, skipping this check");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing periodic tasks");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("Periodic Tasks Service stopped");
    }

    private async Task RunPeriodicTasks()
    {
        var now = DateTimeOffset.UtcNow;
        var tasksRun = new List<string>();

        _logger.LogDebug("Periodic tasks check at {Time}", now);

        // Log heartbeat every 10 minutes to show service is alive
        if (now - _lastHeartbeatLog >= TimeSpan.FromMinutes(10))
        {
            _logger.LogInformation("Periodic Tasks Service heartbeat - running normally at {Time}", now);
            _lastHeartbeatLog = now;
        }

        try
        {
            if (_periodicTaskConfig.EnableResetTaskGradesOnIntervalChange &&
                now - _lastResetTaskGradesOnIntervalChange >= TimeSpan.FromHours(_periodicTaskConfig.ResetTaskGradesOnIntervalChangeIntervalHours))
            {
                _logger.LogInformation("Resetting task grades on interval change...");
                using var scope = _serviceProvider.CreateScope();
                var taskService = scope.ServiceProvider.GetRequiredService<ITaskItemService>();
                await taskService.ResetTaskGradesOnIntervalChangeAsync();
                _lastResetTaskGradesOnIntervalChange = now;
                tasksRun.Add("ResetTaskGradesOnIntervalChange");
                _logger.LogInformation("Task grades reset on interval change completed");
            }

            if (_periodicTaskConfig.EnableTaskDueSoonNotifications && 
                now - _lastTaskDueSoonNotification >= TimeSpan.FromHours(_periodicTaskConfig.TaskDueSoonNotificationsIntervalHours))
            {
                _logger.LogInformation("Sending task due soon notifications...");
                using var scope = _serviceProvider.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                await notificationService.SendTasksDueSoonNotificationsAsync();
                _lastTaskDueSoonNotification = now;
                tasksRun.Add("TaskDueSoonNotifications");
                _logger.LogInformation("Task due soon notifications sent");
            }

            if (_periodicTaskConfig.EnableTaskDueTodayNotifications && 
                now - _lastTaskDueTodayNotification >= TimeSpan.FromHours(_periodicTaskConfig.TaskDueTodayNotificationsIntervalHours))
            {
                _logger.LogInformation("Sending task due today notifications...");
                using var scope = _serviceProvider.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                await notificationService.SendTasksDueTodayNotificationsAsync();
                _lastTaskDueTodayNotification = now;
                tasksRun.Add("TaskDueTodayNotifications");
                _logger.LogInformation("Task due today notifications sent");
            }

            if (_periodicTaskConfig.EnableTaskStartingSoonNotifications && 
                now - _lastTaskStartingSoonNotification >= TimeSpan.FromHours(_periodicTaskConfig.TaskStartingSoonNotificationsIntervalHours))
            {
                _logger.LogInformation("Sending task starting soon notifications...");
                using var scope = _serviceProvider.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                await notificationService.SendTasksStartingSoonNotificationsAsync();
                _lastTaskStartingSoonNotification = now;
                tasksRun.Add("TaskStartingSoonNotifications");
                _logger.LogInformation("Task starting soon notifications sent");
            }

            if (_periodicTaskConfig.EnableTaskStartingTodayNotifications && 
                now - _lastTaskStartingTodayNotification >= TimeSpan.FromHours(_periodicTaskConfig.TaskStartingTodayNotificationsIntervalHours))
            {
                _logger.LogInformation("Sending task starting today notifications...");
                using var scope = _serviceProvider.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                await notificationService.SendTasksStartedNotificationsAsync();
                _lastTaskStartingTodayNotification = now;
                tasksRun.Add("TaskStartingTodayNotifications");
                _logger.LogInformation("Task starting today notifications sent");
            }

            if (_periodicTaskConfig.EnableTaskEndingSoonNotifications && 
                now - _lastTaskEndingSoonNotification >= TimeSpan.FromHours(_periodicTaskConfig.TaskEndingSoonNotificationsIntervalHours))
            {
                _logger.LogInformation("Sending task ending soon notifications...");
                using var scope = _serviceProvider.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                await notificationService.SendTasksEndingSoonNotificationsAsync();
                _lastTaskEndingSoonNotification = now;
                tasksRun.Add("TaskEndingSoonNotifications");
                _logger.LogInformation("Task ending soon notifications sent");
            }

            if (_periodicTaskConfig.EnableTaskEndingTodayNotifications && 
                now - _lastTaskEndingTodayNotification >= TimeSpan.FromHours(_periodicTaskConfig.TaskEndingTodayNotificationsIntervalHours))
            {
                _logger.LogInformation("Sending task ending today notifications...");
                using var scope = _serviceProvider.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                await notificationService.SendTasksEndedNotificationsAsync();
                _lastTaskEndingTodayNotification = now;
                tasksRun.Add("TaskEndingTodayNotifications");
                _logger.LogInformation("Task ending today notifications sent");
            }

            if (_periodicTaskConfig.EnableAllowanceDaySoonNotifications && 
                now - _lastAllowanceDaySoonNotification >= TimeSpan.FromHours(_periodicTaskConfig.AllowanceDaySoonNotificationsIntervalHours))
            {
                _logger.LogInformation("Sending allowance day soon notifications...");
                using var scope = _serviceProvider.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                await notificationService.SendAllowanceDaySoonNotificationsAsync();
                _lastAllowanceDaySoonNotification = now;
                tasksRun.Add("AllowanceDaySoonNotifications");
                _logger.LogInformation("Allowance day soon notifications sent");
            }

            if (_periodicTaskConfig.EnableAllowanceDayTodayNotifications && 
                now - _lastAllowanceDayTodayNotification >= TimeSpan.FromHours(_periodicTaskConfig.AllowanceDayTodayNotificationsIntervalHours))
            {
                _logger.LogInformation("Sending allowance day today notifications...");
                using var scope = _serviceProvider.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                await notificationService.SendAllowanceDayTodayNotificationsAsync();
                _lastAllowanceDayTodayNotification = now;
                tasksRun.Add("AllowanceDayTodayNotifications");
                _logger.LogInformation("Allowance day today notifications sent");
            }

            var iosMonetizationLaunchDate = _subscriptionsConfig.Apple.LaunchDate;
            var androidMonetizationLaunchDate = _subscriptionsConfig.GooglePlay.LaunchDate;
            var gracePeriodDays = _subscriptionsConfig.GrandfatheredGracePeriodDays;
            var trialPeriodDays = _subscriptionsConfig.TrialPeriodDays;

            if (DateTime.UtcNow < iosMonetizationLaunchDate && DateTime.UtcNow < androidMonetizationLaunchDate)
            {
                _logger.LogInformation($"Monetization launch date has not been reached yet. Skipping trial notifications.");
            }
            else
            {
                _logger.LogInformation($"Monetization launch date reached. Processing trial notifications.");

                if (_periodicTaskConfig.EnableWelcomeNotificationsToGrandfatheredUsers && 
                    now - _lastWelcomeNotificationsToGrandfatheredUsers >= TimeSpan.FromHours(_periodicTaskConfig.WelcomeNotificationsToGrandfatheredUsersIntervalHours))
                //    now - _lastWelcomeNotificationsToGrandfatheredUsers >= TimeSpan.FromMinutes(1)) // For testing 
                {
                    _logger.LogInformation("Sending welcome notifications to grandfathered users...");

                    await ProcessGrandfatheredTrialWelcomeNotificationsAsync(
                        iosMonetizationLaunchDate,
                        androidMonetizationLaunchDate,
                        gracePeriodDays,
                        "grandfathered trial welcome",
                        (repo, iosDate, androidDate) => repo.GetGrandfatheredUsersForTrialWelcomeNotificationsCountAsync(iosDate, androidDate),
                        (repo, iosDate, androidDate, skip, take) => repo.GetGrandfatheredUsersForTrialWelcomeNotificationsBatchAsync(iosDate, androidDate, skip, take),
                        (notifService, userId, isBusiness, isGrandfathered, graceDays) => notifService.SendTrialWelcomeNotificationAsync(userId, isBusiness, isGrandfathered, graceDays),
                        (emailSvc, email, firstName, isBusiness, isGrandfathered, graceDays) => emailSvc.SendTrialWelcomeEmailAsync(email, firstName, isBusiness, isGrandfathered, graceDays),
                        (repo, userId) => repo.MarkTrialWelcomeSentAsync(userId)
                    );

                    _lastWelcomeNotificationsToGrandfatheredUsers = now;
                    tasksRun.Add("WelcomeNotificationsToGrandfatheredUsers");
                    _logger.LogInformation("Welcome notifications to grandfathered users sent");
                }

                if (_periodicTaskConfig.EnableGrandfatheredTrial3DayWarningNotifications && 
                    now - _lastGrandfatheredTrial3DayWarningNotifications >= TimeSpan.FromHours(_periodicTaskConfig.GrandfatheredTrial3DayWarningNotificationsIntervalHours))
                    // now - _lastGrandfatheredTrial3DayWarningNotifications >= TimeSpan.FromMinutes(1)) // For testing 
                {
                    _logger.LogInformation("Sending trial 3-day warning notifications to grandfathered users...");

                    await ProcessGrandfatheredTrialWarningNotificationsAsync(
                        iosMonetizationLaunchDate,
                        androidMonetizationLaunchDate,
                        gracePeriodDays,
                        "grandfathered trial 3-day warning",
                        (repo, iosDate, androidDate, graceDays) => repo.GetGrandfatheredUsersForTrial3DayWarningNotificationsCountAsync(iosDate, androidDate, graceDays),
                        (repo, iosDate, androidDate, graceDays, skip, take) => repo.GetGrandfatheredUsersForTrial3DayWarningNotificationsBatchAsync(iosDate, androidDate, graceDays, skip, take),
                        (notifService, userId, isBusiness, isGrandfathered, graceDays) => notifService.SendTrial3DayWarningNotificationAsync(userId, isBusiness, isGrandfathered, graceDays),
                        (emailSvc, email, firstName, isBusiness, isGrandfathered, graceDays) => emailSvc.SendTrial3DayWarningEmailAsync(email, firstName, isBusiness, isGrandfathered, graceDays),
                        (repo, userId) => repo.Mark3DayWarningSentAsync(userId)
                    );

                    _lastGrandfatheredTrial3DayWarningNotifications = now;
                    tasksRun.Add("GrandfatheredTrial3DayWarningNotifications");
                    _logger.LogInformation("3-day warning notifications to grandfathered users sent");
                }

                if (_periodicTaskConfig.EnableGrandfatheredTrial1DayWarningNotifications && 
                    now - _lastGrandfatheredTrial1DayWarningNotifications >= TimeSpan.FromHours(_periodicTaskConfig.GrandfatheredTrial1DayWarningNotificationsIntervalHours))
                    // now - _lastGrandfatheredTrial1DayWarningNotifications >= TimeSpan.FromMinutes(1)) // For testing 
                {
                    _logger.LogInformation("Sending trial 1-day warning notifications to grandfathered users...");

                    await ProcessGrandfatheredTrialWarningNotificationsAsync(
                        iosMonetizationLaunchDate,
                        androidMonetizationLaunchDate,
                        gracePeriodDays,
                        "grandfathered trial 1-day warning",
                        (repo, iosDate, androidDate, graceDays) => repo.GetGrandfatheredUsersForTrial1DayWarningNotificationsCountAsync(iosDate, androidDate, graceDays),
                        (repo, iosDate, androidDate, graceDays, skip, take) => repo.GetGrandfatheredUsersForTrial1DayWarningNotificationsBatchAsync(iosDate, androidDate, graceDays, skip, take),
                        (notifService, userId, isBusiness, isGrandfathered, graceDays) => notifService.SendTrial1DayWarningNotificationAsync(userId, isBusiness, isGrandfathered, graceDays),
                        (emailSvc, email, firstName, isBusiness, isGrandfathered, graceDays) => emailSvc.SendTrial1DayWarningEmailAsync(email, firstName, isBusiness, isGrandfathered, graceDays),
                        (repo, userId) => repo.Mark1DayWarningSentAsync(userId)
                    );

                    _lastGrandfatheredTrial1DayWarningNotifications = now;
                    tasksRun.Add("GrandfatheredTrial1DayWarningNotifications");
                    _logger.LogInformation("1-day warning notifications to grandfathered users sent");
                }

                if (_periodicTaskConfig.EnableGrandfatheredTrialEndedWarningNotifications && 
                    now - _lastGrandfatheredTrialEndedWarningNotifications >= TimeSpan.FromHours(_periodicTaskConfig.GrandfatheredTrialEndedWarningNotificationsIntervalHours))
                    // now - _lastGrandfatheredTrialEndedWarningNotifications >= TimeSpan.FromMinutes(1)) // For testing 
                {
                    _logger.LogInformation("Sending trial ended notifications to grandfathered users...");

                    await ProcessGrandfatheredTrialWarningNotificationsAsync(
                        iosMonetizationLaunchDate,
                        androidMonetizationLaunchDate,
                        gracePeriodDays,
                        "grandfathered trial ended",
                        (repo, iosDate, androidDate, graceDays) => repo.GetGrandfatheredUsersForTrialEndedWarningNotificationsCountAsync(iosDate, androidDate, graceDays),
                        (repo, iosDate, androidDate, graceDays, skip, take) => repo.GetGrandfatheredUsersForTrialEndedWarningNotificationsBatchAsync(iosDate, androidDate, graceDays, skip, take),
                        (notifService, userId, isBusiness, isGrandfathered, graceDays) => notifService.SendTrialExpiredNotificationAsync(userId, isBusiness, isGrandfathered, graceDays),
                        (emailSvc, email, firstName, isBusiness, isGrandfathered, graceDays) => emailSvc.SendTrialEndedWarningEmailAsync(email, firstName, isBusiness, isGrandfathered, graceDays),
                        (repo, userId) => repo.MarkTrialEndedWarningSentAsync(userId)
                    );

                    _lastGrandfatheredTrialEndedWarningNotifications = now;
                    tasksRun.Add("GrandfatheredTrialEndedWarningNotifications");
                    _logger.LogInformation("Trial ended notifications to grandfathered users sent");
                }

                if (_periodicTaskConfig.EnableTrial3DayWarningNotifications && 
                    now - _lastTrial3DayWarningNotifications >= TimeSpan.FromHours(_periodicTaskConfig.Trial3DayWarningNotificationsIntervalHours))
                    //  now - _lastTrial3DayWarningNotifications >= TimeSpan.FromMinutes(1)) // For testing 
                {
                    _logger.LogInformation("Sending trial 3-day warning notifications to new users...");

                    await ProcessTrialWarningNotificationsAsync(
                        trialPeriodDays,
                        "new users trial 3-day warning",
                        (repo) => repo.GetUsersForTrial3DayWarningNotificationsCountAsync(),
                        (repo, skip, take) => repo.GetUsersForTrial3DayWarningNotificationsBatchAsync(skip, take),
                        (notifService, userId, isBusiness, isGrandfathered, graceDays) => notifService.SendTrial3DayWarningNotificationAsync(userId, isBusiness, isGrandfathered, graceDays),
                        (emailSvc, email, firstName, isBusiness, isGrandfathered, graceDays) => emailSvc.SendTrial3DayWarningEmailAsync(email, firstName, isBusiness, isGrandfathered, graceDays),
                        (repo, userId) => repo.Mark3DayWarningSentAsync(userId)
                    );

                    _lastTrial3DayWarningNotifications = now;
                    tasksRun.Add("Trial3DayWarningNotifications");
                    _logger.LogInformation("3-day warning notifications to new users sent");
                }

                if (_periodicTaskConfig.EnableTrial1DayWarningNotifications && 
                    now - _lastTrial1DayWarningNotifications >= TimeSpan.FromHours(_periodicTaskConfig.Trial1DayWarningNotificationsIntervalHours))
                    //  now - _lastTrial1DayWarningNotifications >= TimeSpan.FromMinutes(1)) // For testing 
                {
                    _logger.LogInformation("Sending trial 1-day warning notifications to new users...");

                    await ProcessTrialWarningNotificationsAsync(
                        trialPeriodDays,
                        "new users trial 1-day warning",
                        (repo) => repo.GetUsersForTrial1DayWarningNotificationsCountAsync(),
                        (repo, skip, take) => repo.GetUsersForTrial1DayWarningNotificationsBatchAsync(skip, take),
                        (notifService, userId, isBusiness, isGrandfathered, graceDays) => notifService.SendTrial1DayWarningNotificationAsync(userId, isBusiness, isGrandfathered, graceDays),
                        (emailSvc, email, firstName, isBusiness, isGrandfathered, graceDays) => emailSvc.SendTrial1DayWarningEmailAsync(email, firstName, isBusiness, isGrandfathered, graceDays),
                        (repo, userId) => repo.Mark1DayWarningSentAsync(userId)
                    );

                    _lastTrial1DayWarningNotifications = now;
                    tasksRun.Add("Trial1DayWarningNotifications");
                    _logger.LogInformation("1-day warning notifications to new users sent");
                }

                if (_periodicTaskConfig.EnableTrialEndedWarningNotifications && 
                    now - _lastTrialEndedWarningNotifications >= TimeSpan.FromHours(_periodicTaskConfig.TrialEndedWarningNotificationsIntervalHours))
                    //  now - _lastTrialEndedWarningNotifications >= TimeSpan.FromMinutes(1)) // For testing 
                {
                    _logger.LogInformation("Sending trial ended warning notifications to new users...");

                    await ProcessTrialWarningNotificationsAsync(
                        trialPeriodDays,
                        "new users trial ended warning",
                        (repo) => repo.GetUsersForTrialEndedWarningNotificationsCountAsync(),
                        (repo, skip, take) => repo.GetUsersForTrialEndedWarningNotificationsBatchAsync(skip, take),
                        (notifService, userId, isBusiness, isGrandfathered, graceDays) => notifService.SendTrialExpiredNotificationAsync(userId, isBusiness, isGrandfathered, graceDays),
                        (emailSvc, email, firstName, isBusiness, isGrandfathered, graceDays) => emailSvc.SendTrialEndedWarningEmailAsync(email, firstName, isBusiness, isGrandfathered, graceDays),
                        (repo, userId) => repo.MarkTrialEndedWarningSentAsync(userId)
                    );

                    _lastTrialEndedWarningNotifications = now;
                    tasksRun.Add("TrialEndedWarningNotifications");
                    _logger.LogInformation("Ended warning notifications to new users sent");
                }
            }
    
            if (tasksRun.Any())
            {
                _logger.LogInformation("Completed tasks: {Tasks} at {Time}", string.Join(", ", tasksRun), now);
            }
            else
            {
                _logger.LogDebug("No periodic tasks were due to run at {Time}", now);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in periodic tasks execution");
        }
    }

    private async Task ProcessTrialNotificationBatch(int gracePeriodDays, 
                                                     string notificationType, 
                                                     bool isGrandfathered,
                                                     Func<INotificationService, long, bool, bool, int, Task> sendNotificationAsync, 
                                                     Func<IEmailService, string, string, bool, bool, int, Task> sendEmailAsync, 
                                                     Func<IUserRepository, long, Task> markShownAsync, 
                                                     IUserRepository userRepository, 
                                                     int totalBatches, 
                                                     INotificationService notificationService, 
                                                     IEmailService emailService, 
                                                     int batchNumber, 
                                                     List<UserForTrialNotifications> batch)
    {
        _logger.LogInformation($"Processing batch {batchNumber}/{totalBatches} with {batch.Count} items");

        foreach (var user in batch)
        {
            try
            {
                await sendNotificationAsync(notificationService, user.Id, user.IsBusiness, isGrandfathered, gracePeriodDays);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending {notificationType} notification to user ID {user.Id}");
            }

            try
            {
                await sendEmailAsync(emailService, user.Email, user.FirstName, user.IsBusiness, isGrandfathered, gracePeriodDays);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending {notificationType} email to user ID {user.Id}");
            }

            try
            {
                await markShownAsync(userRepository, user.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error marking {notificationType} shown for user ID {user.Id}");
            }
        }

        _logger.LogInformation($"Completed batch {batchNumber}/{totalBatches} for {notificationType} notifications");
    }

    private async Task ProcessGrandfatheredTrialWelcomeNotificationsAsync(
        DateTimeOffset iosMonetizationLaunchDate,
        DateTimeOffset androidMonetizationLaunchDate,
        int gracePeriodDays,
        string notificationType,
        Func<IUserRepository, DateTimeOffset, DateTimeOffset, Task<int>> getCountAsync,
        Func<IUserRepository, DateTimeOffset, DateTimeOffset, int, int, Task<List<UserForTrialNotifications>>> getBatchAsync,
        Func<INotificationService, long, bool, bool, int, Task> sendNotificationAsync,
        Func<IEmailService, string, string, bool, bool, int, Task> sendEmailAsync,
        Func<IUserRepository, long, Task> markShownAsync)
    {
        using var scope = _serviceProvider.CreateScope();
        var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();

        var totalCount = await getCountAsync(userRepository, iosMonetizationLaunchDate, androidMonetizationLaunchDate);
        _logger.LogInformation($"Processing {totalCount} users for {notificationType} notifications in batches of {Defaults.DEFAULT_BATCH_SIZE}");
        
        if (totalCount == 0)
        {
            _logger.LogInformation($"No users to process for {notificationType} notifications.");
            return;
        }

        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var totalBatches = (int)Math.Ceiling((double)totalCount / Defaults.DEFAULT_BATCH_SIZE);

        for (int skip = 0; skip < totalCount; skip += Defaults.DEFAULT_BATCH_SIZE)
        {
            var batch = await getBatchAsync(userRepository, iosMonetizationLaunchDate, androidMonetizationLaunchDate, skip, Defaults.DEFAULT_BATCH_SIZE);
            var batchNumber = (skip / Defaults.DEFAULT_BATCH_SIZE) + 1;

            await ProcessTrialNotificationBatch(gracePeriodDays, 
                                                notificationType, 
                                                true,
                                                sendNotificationAsync, 
                                                sendEmailAsync, 
                                                markShownAsync, 
                                                userRepository, 
                                                totalBatches, 
                                                notificationService, 
                                                emailService, 
                                                batchNumber, 
                                                batch);

            if (skip + Defaults.DEFAULT_BATCH_SIZE < totalCount)
            {
                await Task.Delay(100);
            }
        }
    }

    private async Task ProcessGrandfatheredTrialWarningNotificationsAsync(
        DateTimeOffset iosMonetizationLaunchDate,
        DateTimeOffset androidMonetizationLaunchDate,
        int gracePeriodDays,
        string notificationType,
        Func<IUserRepository, DateTimeOffset, DateTimeOffset, int, Task<int>> getCountAsync,
        Func<IUserRepository, DateTimeOffset, DateTimeOffset, int, int, int, Task<List<UserForTrialNotifications>>> getBatchAsync,
        Func<INotificationService, long, bool, bool, int, Task> sendNotificationAsync,
        Func<IEmailService, string, string, bool, bool, int, Task> sendEmailAsync,
        Func<IUserRepository, long, Task> markShownAsync)
    {
        using var scope = _serviceProvider.CreateScope();
        var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();

        var totalCount = await getCountAsync(userRepository, iosMonetizationLaunchDate, androidMonetizationLaunchDate, gracePeriodDays);
        _logger.LogInformation($"Processing {totalCount} users for {notificationType} notifications in batches of {Defaults.DEFAULT_BATCH_SIZE}");
        
        if (totalCount == 0)
        {
            _logger.LogInformation($"No users to process for {notificationType} notifications.");
            return;
        }

        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var totalBatches = (int)Math.Ceiling((double)totalCount / Defaults.DEFAULT_BATCH_SIZE);
        
        for (int skip = 0; skip < totalCount; skip += Defaults.DEFAULT_BATCH_SIZE)
        {
            var batch = await getBatchAsync(userRepository, iosMonetizationLaunchDate, androidMonetizationLaunchDate, gracePeriodDays, skip, Defaults.DEFAULT_BATCH_SIZE);
            var batchNumber = (skip / Defaults.DEFAULT_BATCH_SIZE) + 1;

            _logger.LogInformation($"Processing batch {batchNumber}/{totalBatches} with {batch.Count} items");

            await ProcessTrialNotificationBatch(gracePeriodDays, 
                                                notificationType, 
                                                true,
                                                sendNotificationAsync, 
                                                sendEmailAsync, 
                                                markShownAsync, 
                                                userRepository, 
                                                totalBatches, 
                                                notificationService, 
                                                emailService, 
                                                batchNumber, 
                                                batch);

            if (skip + Defaults.DEFAULT_BATCH_SIZE < totalCount)
            {
                await Task.Delay(100);
            }
        }
    }

    private async Task ProcessTrialWarningNotificationsAsync(
        int gracePeriodDays,
        string notificationType,
        Func<IUserRepository, Task<int>> getCountAsync,
        Func<IUserRepository, int, int, Task<List<UserForTrialNotifications>>> getBatchAsync,
        Func<INotificationService, long, bool, bool, int, Task> sendNotificationAsync,
        Func<IEmailService, string, string, bool, bool, int, Task> sendEmailAsync,
        Func<IUserRepository, long, Task> markShownAsync)
    {
        using var scope = _serviceProvider.CreateScope();
        var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();

        var totalCount = await getCountAsync(userRepository);
        _logger.LogInformation($"Processing {totalCount} users for {notificationType} notifications in batches of {Defaults.DEFAULT_BATCH_SIZE}");
        
        if (totalCount == 0)
        {
            _logger.LogInformation($"No users to process for {notificationType} notifications.");
            return;
        }

        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var totalBatches = (int)Math.Ceiling((double)totalCount / Defaults.DEFAULT_BATCH_SIZE);

        for (int skip = 0; skip < totalCount; skip += Defaults.DEFAULT_BATCH_SIZE)
        {
            var batch = await getBatchAsync(userRepository, skip, Defaults.DEFAULT_BATCH_SIZE);
            var batchNumber = (skip / Defaults.DEFAULT_BATCH_SIZE) + 1;

            await ProcessTrialNotificationBatch(gracePeriodDays, 
                                                notificationType, 
                                                false,
                                                sendNotificationAsync, 
                                                sendEmailAsync, 
                                                markShownAsync, 
                                                userRepository, 
                                                totalBatches, 
                                                notificationService, 
                                                emailService, 
                                                batchNumber, 
                                                batch);

            if (skip + Defaults.DEFAULT_BATCH_SIZE < totalCount)
            {
                await Task.Delay(100);
            }
        }
    }
}

