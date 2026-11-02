/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db;
using DoDone.Db.Dtos;
using DoDone.Db.Models;
using DoDone.Db.Repositories;
using DoDone.Shared;
using DoDone.Shared.Abstractions;
using DoDone.Server.Services;
using DoDone.Server.Configuration;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Serilog;
using DoDone.Server.Services.Common;

Console.WriteLine("=== DoDone Periodic Tasks Worker ===");
Console.WriteLine($"Started at: {DateTimeOffset.UtcNow}");

// Helper methods for processing trial notifications
static async Task ProcessTrialNotificationBatch(
    int gracePeriodDays,
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
    List<UserForTrialNotifications> batch,
    Microsoft.Extensions.Logging.ILogger logger)
{
    logger.LogInformation($"Processing batch {batchNumber}/{totalBatches} with {batch.Count} items");

    foreach (var user in batch)
    {
        try
        {
            await sendNotificationAsync(notificationService, user.Id, user.IsBusiness, isGrandfathered, gracePeriodDays);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, $"Error sending {notificationType} notification to user ID {user.Id}");
        }

        try
        {
            await sendEmailAsync(emailService, user.Email, user.FirstName, user.IsBusiness, isGrandfathered, gracePeriodDays);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, $"Error sending {notificationType} email to user ID {user.Id}");
        }

        try
        {
            await markShownAsync(userRepository, user.Id);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, $"Error marking {notificationType} shown for user ID {user.Id}");
        }
    }

    logger.LogInformation($"Completed batch {batchNumber}/{totalBatches} for {notificationType} notifications");
}

static async Task ProcessGrandfatheredTrialWelcomeNotificationsAsync(
    IUserRepository userRepository,
    INotificationService notificationService,
    IEmailService emailService,
    DateTimeOffset iosMonetizationLaunchDate,
    DateTimeOffset androidMonetizationLaunchDate,
    int gracePeriodDays,
    string notificationType,
    Microsoft.Extensions.Logging.ILogger logger)
{
    var totalCount = await userRepository.GetGrandfatheredUsersForTrialWelcomeNotificationsCountAsync(iosMonetizationLaunchDate, androidMonetizationLaunchDate);
    logger.LogInformation($"Processing {totalCount} users for {notificationType} notifications in batches of {Defaults.DEFAULT_BATCH_SIZE}");

    if (totalCount == 0)
    {
        logger.LogInformation($"No users to process for {notificationType} notifications.");
        return;
    }

    var totalBatches = (int)Math.Ceiling((double)totalCount / Defaults.DEFAULT_BATCH_SIZE);

    for (int skip = 0; skip < totalCount; skip += Defaults.DEFAULT_BATCH_SIZE)
    {
        var batch = await userRepository.GetGrandfatheredUsersForTrialWelcomeNotificationsBatchAsync(iosMonetizationLaunchDate, androidMonetizationLaunchDate, skip, Defaults.DEFAULT_BATCH_SIZE);
        var batchNumber = (skip / Defaults.DEFAULT_BATCH_SIZE) + 1;

        await ProcessTrialNotificationBatch(
            gracePeriodDays,
            notificationType,
            true,
            (notifService, userId, isBusiness, isGrandfathered, graceDays) => notifService.SendTrialWelcomeNotificationAsync(userId, isBusiness, isGrandfathered, graceDays),
            (emailSvc, email, firstName, isBusiness, isGrandfathered, graceDays) => emailSvc.SendTrialWelcomeEmailAsync(email, firstName, isBusiness, isGrandfathered, graceDays),
            (repo, userId) => repo.MarkTrialWelcomeSentAsync(userId),
            userRepository,
            totalBatches,
            notificationService,
            emailService,
            batchNumber,
            batch,
            logger);

        if (skip + Defaults.DEFAULT_BATCH_SIZE < totalCount)
        {
            await Task.Delay(100);
        }
    }
}

static async Task ProcessGrandfatheredTrialWarningNotificationsAsync(
    IUserRepository userRepository,
    INotificationService notificationService,
    IEmailService emailService,
    DateTimeOffset iosMonetizationLaunchDate,
    DateTimeOffset androidMonetizationLaunchDate,
    int gracePeriodDays,
    string notificationType,
    Microsoft.Extensions.Logging.ILogger logger,
    Func<IUserRepository, DateTimeOffset, DateTimeOffset, int, Task<int>> getCountAsync,
    Func<IUserRepository, DateTimeOffset, DateTimeOffset, int, int, int, Task<List<UserForTrialNotifications>>> getBatchAsync,
    Func<INotificationService, long, bool, bool, int, Task> sendNotificationAsync,
    Func<IEmailService, string, string, bool, bool, int, Task> sendEmailAsync,
    Func<IUserRepository, long, Task> markShownAsync)
{
    var totalCount = await getCountAsync(userRepository, iosMonetizationLaunchDate, androidMonetizationLaunchDate, gracePeriodDays);
    logger.LogInformation($"Processing {totalCount} users for {notificationType} notifications in batches of {Defaults.DEFAULT_BATCH_SIZE}");

    if (totalCount == 0)
    {
        logger.LogInformation($"No users to process for {notificationType} notifications.");
        return;
    }

    var totalBatches = (int)Math.Ceiling((double)totalCount / Defaults.DEFAULT_BATCH_SIZE);

    for (int skip = 0; skip < totalCount; skip += Defaults.DEFAULT_BATCH_SIZE)
    {
        var batch = await getBatchAsync(userRepository, iosMonetizationLaunchDate, androidMonetizationLaunchDate, gracePeriodDays, skip, Defaults.DEFAULT_BATCH_SIZE);
        var batchNumber = (skip / Defaults.DEFAULT_BATCH_SIZE) + 1;

        await ProcessTrialNotificationBatch(
            gracePeriodDays,
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
            batch,
            logger);

        if (skip + Defaults.DEFAULT_BATCH_SIZE < totalCount)
        {
            await Task.Delay(100);
        }
    }
}

static async Task ProcessTrialWarningNotificationsAsync(
    IUserRepository userRepository,
    INotificationService notificationService,
    IEmailService emailService,
    int gracePeriodDays,
    string notificationType,
    Microsoft.Extensions.Logging.ILogger logger,
    Func<IUserRepository, Task<int>> getCountAsync,
    Func<IUserRepository, int, int, Task<List<UserForTrialNotifications>>> getBatchAsync,
    Func<INotificationService, long, bool, bool, int, Task> sendNotificationAsync,
    Func<IEmailService, string, string, bool, bool, int, Task> sendEmailAsync,
    Func<IUserRepository, long, Task> markShownAsync)
{
    var totalCount = await getCountAsync(userRepository);
    logger.LogInformation($"Processing {totalCount} users for {notificationType} notifications in batches of {Defaults.DEFAULT_BATCH_SIZE}");

    if (totalCount == 0)
    {
        logger.LogInformation($"No users to process for {notificationType} notifications.");
        return;
    }

    var totalBatches = (int)Math.Ceiling((double)totalCount / Defaults.DEFAULT_BATCH_SIZE);

    for (int skip = 0; skip < totalCount; skip += Defaults.DEFAULT_BATCH_SIZE)
    {
        var batch = await getBatchAsync(userRepository, skip, Defaults.DEFAULT_BATCH_SIZE);
        var batchNumber = (skip / Defaults.DEFAULT_BATCH_SIZE) + 1;

        await ProcessTrialNotificationBatch(
            gracePeriodDays,
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
            batch,
            logger);

        if (skip + Defaults.DEFAULT_BATCH_SIZE < totalCount)
        {
            await Task.Delay(100);
        }
    }
}

// Create builder without auto-loading appsettings to control configuration priority
var builder = WebApplication.CreateBuilder(new WebApplicationOptions 
{ 
    Args = args,
    // Disable automatic appsettings loading - we'll add them manually in the right order
});

// Clear default configuration sources to rebuild in correct priority order
builder.Configuration.Sources.Clear();

// Rebuild configuration sources in explicit priority order (lowest to highest):
// 1. appsettings.json (base configuration)
builder.Configuration.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);

// 2. appsettings.{Environment}.json (environment-specific)
var environmentName = builder.Environment.EnvironmentName;
builder.Configuration.AddJsonFile($"appsettings.{environmentName}.json", optional: true, reloadOnChange: true);

// 3. User secrets (Development only)
if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddUserSecrets<Program>(optional: true, reloadOnChange: true);
}

// 4. Environment variables (from Cloud Run .env.prod.deploy)
builder.Configuration.AddEnvironmentVariables();

// 5. Command line arguments
if (args != null && args.Length > 0)
{
    builder.Configuration.AddCommandLine(args);
}

// 6. Firestore (HIGHEST PRIORITY - overrides everything including env vars)
var firestoreEnvironment = environmentName.ToLowerInvariant() switch
{
    "production" => "production",
    "sandbox" => "sandbox",
    _ => "production"
};

try
{
    builder.Configuration.AddFirestoreConfiguration(
        environment: firestoreEnvironment,
        projectId: "dodone-mobile", 
        databaseId: "dodone-config",
        reloadOnChange: true,
        cacheTtlSeconds: 30);
    
    Console.WriteLine($"[Worker] Firestore configuration provider added for environment: {firestoreEnvironment} (HIGHEST PRIORITY)");
}
catch (Exception ex)
{
    Console.WriteLine($"[Worker] Warning: Could not add Firestore configuration: {ex.Message}. Using static configuration files only.");
}

// Configure Serilog early with explicit console sink
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .WriteTo.Console(outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz}] [{Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}")
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

Console.WriteLine($"[Worker] Serilog configured at {DateTimeOffset.UtcNow}");
Log.Information("DoDone Worker starting - Serilog is configured");

// Add memory caching for expensive operations
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 200;
    options.CompactionPercentage = 0.25;
});

// Configure database context
builder.Services.AddDbContext<DoDoneDbContext>(options =>
     options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"), 
         npgsqlOptions =>
         {
             npgsqlOptions.CommandTimeout(30);
             npgsqlOptions.EnableRetryOnFailure(
                 maxRetryCount: 3, 
                 maxRetryDelay: TimeSpan.FromSeconds(2), 
                 errorCodesToAdd: null);
         })
         .EnableDetailedErrors(builder.Environment.IsDevelopment())
         .EnableSensitiveDataLogging(builder.Environment.IsDevelopment()));

// Register JWT Service
builder.Services.AddScoped<IJwtService, JwtService>();

// Register CurrentUser Service
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// Configure periodic tasks
builder.Services.Configure<PeriodicTasksConfiguration>(
    builder.Configuration.GetSection(PeriodicTasksConfiguration.SectionName));

// Configure email settings
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection(EmailSettings.SectionName));

// Configure subscription settings
builder.Services.Configure<SubscriptionSettings>(
    builder.Configuration.GetSection(SubscriptionSettings.SectionName));

// Configure avatar storage
builder.Services.Configure<AvatarStorageConfiguration>(
    builder.Configuration.GetSection("AvatarStorage"));

// Configure Identity
builder.Services.AddIdentity<User, IdentityRole<long>>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<DoDoneDbContext>()
.AddDefaultTokenProviders();

// Register repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ITeamRepository, TeamRepository>();
builder.Services.AddScoped<ITaskGroupRepository, TaskGroupRepository>();
builder.Services.AddScoped<ITaskKindRepository, TaskKindRepository>();
builder.Services.AddScoped<ITaskCategoryRepository, TaskCategoryRepository>();
builder.Services.AddScoped<IGradeRepository, GradeRepository>();
builder.Services.AddScoped<ITaskItemRepository, TaskItemRepository>();
builder.Services.AddScoped<ITaskCommentRepository, TaskCommentRepository>();
builder.Services.AddScoped<IUserDevicesRepository, UserDevicesRepository>();
builder.Services.AddScoped<IAllowanceHistoryRepository, AllowanceHistoryRepository>();
builder.Services.AddScoped<IAllowanceHistoryTaskItemRepository, AllowanceHistoryTaskItemRepository>();
builder.Services.AddScoped<IUserNotificationRepository, UserNotificationRepository>();
builder.Services.AddScoped<IPurchaseHistoryRepository, PurchaseHistoryRepository>();

// Register circuit breaker factory
builder.Services.AddSingleton<ICircuitBreakerFactory, CircuitBreakerFactory>();

// Register services
builder.Services.AddScoped<ISampleDataService, SampleDataService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<ITaskGroupService, TaskGroupService>();
builder.Services.AddScoped<ITaskKindService, TaskKindService>();
builder.Services.AddScoped<ITaskCategoryService, TaskCategoryService>();
builder.Services.AddScoped<ITaskItemService, TaskItemService>();
builder.Services.AddScoped<IGradesService, GradesService>();
builder.Services.AddScoped<ITaskCommentService, TaskCommentService>();
builder.Services.AddScoped<IRecurringDateService, RecurringDateService>();
builder.Services.AddScoped<IQueryableProcessorService, QueryableProcessorService>();
builder.Services.AddScoped<QueryableTaskItemProcessorService>();
builder.Services.AddScoped<ICachedQueryProcessorService, CachedQueryProcessorService>(provider =>
    new CachedQueryProcessorService(
        provider.GetRequiredService<QueryableTaskItemProcessorService>(),
        provider.GetRequiredService<IMemoryCache>(),
        provider.GetRequiredService<ILogger<CachedQueryProcessorService>>()));
builder.Services.AddScoped<IQueryableTaskItemProcessorService>(provider => provider.GetRequiredService<ICachedQueryProcessorService>());
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddSingleton<IFirebaseService, FirebaseService>();
builder.Services.AddScoped<IUserDeviceRegistrationService, UserDeviceRegistrationService>();
builder.Services.AddScoped<IAllowanceCalculationService, AllowanceCalculationService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAvatarService, AvatarService>();
builder.Services.AddScoped<IAllowanceHistoryService, AllowanceHistoryService>();
builder.Services.AddScoped<IDateTimeProvider, DateTimeProvider>();
builder.Services.AddScoped<ILexiconService, LexiconService>();

// Register webhook services (required by SubscriptionService)
builder.Services.AddHttpClient(); // Required for Apple webhook service
builder.Services.AddScoped<DoDone.Server.Services.Webhooks.IGooglePlayWebhookService, DoDone.Server.Services.Webhooks.GooglePlayWebhookService>();
builder.Services.AddScoped<DoDone.Server.Services.Webhooks.IAppleWebhookService, DoDone.Server.Services.Webhooks.AppleWebhookService>();
builder.Services.AddScoped<DoDone.Server.Services.Webhooks.ISubscriptionWebhookService, DoDone.Server.Services.Webhooks.SubscriptionWebhookService>();

builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();

var app = builder.Build();

try
{
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var periodicTaskConfig = builder.Configuration.GetSection(PeriodicTasksConfiguration.SectionName).Get<PeriodicTasksConfiguration>();
    var subscriptionSettings = builder.Configuration.GetSection(SubscriptionSettings.SectionName).Get<SubscriptionSettings>();
    
    if (periodicTaskConfig == null)
    {
        logger.LogError("Periodic tasks configuration not found!");
        Environment.Exit(1);
    }

    logger.LogInformation("Starting periodic tasks execution...");
    var tasksRun = new List<string>();

    // Get services
    var taskItemService = scope.ServiceProvider.GetRequiredService<ITaskItemService>();
    var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
    var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
    var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

    var iosMonetizationLaunchDate = subscriptionSettings?.Apple?.LaunchDate ?? DateTimeOffset.MinValue;
    var androidMonetizationLaunchDate = subscriptionSettings?.GooglePlay?.LaunchDate ?? DateTimeOffset.MinValue;
    var gracePeriodDays = subscriptionSettings?.GrandfatheredGracePeriodDays ?? 60;

    // Reset task grades on interval change
    if (periodicTaskConfig.EnableResetTaskGradesOnIntervalChange)
    {
        logger.LogInformation("Resetting task grades on interval change...");
        await taskItemService.ResetTaskGradesOnIntervalChangeAsync();
        tasksRun.Add("ResetTaskGradesOnIntervalChange");
        logger.LogInformation("Task grades reset completed");
    }

    // Task due soon notifications
    if (periodicTaskConfig.EnableTaskDueSoonNotifications)
    {
        logger.LogInformation("Sending task due soon notifications...");
        await notificationService.SendTasksDueSoonNotificationsAsync();
        tasksRun.Add("TaskDueSoonNotifications");
        logger.LogInformation("Task due soon notifications sent");
    }

    // Task due today notifications
    if (periodicTaskConfig.EnableTaskDueTodayNotifications)
    {
        logger.LogInformation("Sending task due today notifications...");
        await notificationService.SendTasksDueTodayNotificationsAsync();
        tasksRun.Add("TaskDueTodayNotifications");
        logger.LogInformation("Task due today notifications sent");
    }

    // Task starting soon notifications
    if (periodicTaskConfig.EnableTaskStartingSoonNotifications)
    {
        logger.LogInformation("Sending task starting soon notifications...");
        await notificationService.SendTasksStartingSoonNotificationsAsync();
        tasksRun.Add("TaskStartingSoonNotifications");
        logger.LogInformation("Task starting soon notifications sent");
    }

    // Task starting today notifications
    if (periodicTaskConfig.EnableTaskStartingTodayNotifications)
    {
        logger.LogInformation("Sending task starting today notifications...");
        await notificationService.SendTasksStartedNotificationsAsync();
        tasksRun.Add("TaskStartingTodayNotifications");
        logger.LogInformation("Task starting today notifications sent");
    }

    // Task ending soon notifications
    if (periodicTaskConfig.EnableTaskEndingSoonNotifications)
    {
        logger.LogInformation("Sending task ending soon notifications...");
        await notificationService.SendTasksEndingSoonNotificationsAsync();
        tasksRun.Add("TaskEndingSoonNotifications");
        logger.LogInformation("Task ending soon notifications sent");
    }

    // Task ending today notifications
    if (periodicTaskConfig.EnableTaskEndingTodayNotifications)
    {
        logger.LogInformation("Sending task ending today notifications...");
        await notificationService.SendTasksEndedNotificationsAsync();
        tasksRun.Add("TaskEndingTodayNotifications");
        logger.LogInformation("Task ending today notifications sent");
    }

    // Allowance day soon notifications
    if (periodicTaskConfig.EnableAllowanceDaySoonNotifications)
    {
        logger.LogInformation("Sending allowance day soon notifications...");
        await notificationService.SendAllowanceDaySoonNotificationsAsync();
        tasksRun.Add("AllowanceDaySoonNotifications");
        logger.LogInformation("Allowance day soon notifications sent");
    }

    // Allowance day today notifications
    if (periodicTaskConfig.EnableAllowanceDayTodayNotifications)
    {
        logger.LogInformation("Sending allowance day today notifications...");
        await notificationService.SendAllowanceDayTodayNotificationsAsync();
        tasksRun.Add("AllowanceDayTodayNotifications");
        logger.LogInformation("Allowance day today notifications sent");
    }

    // Trial and subscription notifications
    if (periodicTaskConfig.EnableWelcomeNotificationsToGrandfatheredUsers)
    {
        logger.LogInformation("Sending welcome notifications to grandfathered users...");
        await ProcessGrandfatheredTrialWelcomeNotificationsAsync(
            userRepository, notificationService, emailService, 
            iosMonetizationLaunchDate, androidMonetizationLaunchDate, gracePeriodDays, 
            "grandfathered trial welcome", logger);
        tasksRun.Add("WelcomeNotificationsToGrandfatheredUsers");
        logger.LogInformation("Welcome notifications to grandfathered users sent");
    }

    if (periodicTaskConfig.EnableTrial3DayWarningNotifications)
    {
        logger.LogInformation("Sending 3-day warning notifications to new users...");
        await ProcessTrialWarningNotificationsAsync(
            userRepository, notificationService, emailService,
            gracePeriodDays, "3-day warning", logger,
            (repo) => repo.GetUsersForTrial3DayWarningNotificationsCountAsync(),
            (repo, skip, take) => repo.GetUsersForTrial3DayWarningNotificationsBatchAsync(skip, take),
            (notifService, userId, isBusiness, isGrandfathered, graceDays) => notifService.SendTrial3DayWarningNotificationAsync(userId, isBusiness, isGrandfathered, graceDays),
            (emailSvc, email, firstName, isBusiness, isGrandfathered, graceDays) => emailSvc.SendTrial3DayWarningEmailAsync(email, firstName, isBusiness, isGrandfathered, graceDays),
            (repo, userId) => repo.Mark3DayWarningSentAsync(userId));
        tasksRun.Add("Trial3DayWarningNotifications");
        logger.LogInformation("3-day warning notifications to new users sent");
    }

    if (periodicTaskConfig.EnableTrial1DayWarningNotifications)
    {
        logger.LogInformation("Sending 1-day warning notifications to new users...");
        await ProcessTrialWarningNotificationsAsync(
            userRepository, notificationService, emailService,
            gracePeriodDays, "1-day warning", logger,
            (repo) => repo.GetUsersForTrial1DayWarningNotificationsCountAsync(),
            (repo, skip, take) => repo.GetUsersForTrial1DayWarningNotificationsBatchAsync(skip, take),
            (notifService, userId, isBusiness, isGrandfathered, graceDays) => notifService.SendTrial1DayWarningNotificationAsync(userId, isBusiness, isGrandfathered, graceDays),
            (emailSvc, email, firstName, isBusiness, isGrandfathered, graceDays) => emailSvc.SendTrial1DayWarningEmailAsync(email, firstName, isBusiness, isGrandfathered, graceDays),
            (repo, userId) => repo.Mark1DayWarningSentAsync(userId));
        tasksRun.Add("Trial1DayWarningNotifications");
        logger.LogInformation("1-day warning notifications to new users sent");
    }

    if (periodicTaskConfig.EnableTrialEndedWarningNotifications)
    {
        logger.LogInformation("Sending ended warning notifications to new users...");
        await ProcessTrialWarningNotificationsAsync(
            userRepository, notificationService, emailService,
            gracePeriodDays, "trial ended", logger,
            (repo) => repo.GetUsersForTrialEndedWarningNotificationsCountAsync(),
            (repo, skip, take) => repo.GetUsersForTrialEndedWarningNotificationsBatchAsync(skip, take),
            (notifService, userId, isBusiness, isGrandfathered, graceDays) => notifService.SendTrialExpiredNotificationAsync(userId, isBusiness, isGrandfathered, graceDays),
            (emailSvc, email, firstName, isBusiness, isGrandfathered, graceDays) => emailSvc.SendTrialEndedWarningEmailAsync(email, firstName, isBusiness, isGrandfathered, graceDays),
            (repo, userId) => repo.MarkTrialEndedWarningSentAsync(userId));
        tasksRun.Add("TrialEndedWarningNotifications");
        logger.LogInformation("Ended warning notifications to new users sent");
    }

    if (periodicTaskConfig.EnableGrandfatheredTrial3DayWarningNotifications)
    {
        logger.LogInformation("Sending 3-day warning notifications to grandfathered users...");
        await ProcessGrandfatheredTrialWarningNotificationsAsync(
            userRepository, notificationService, emailService,
            iosMonetizationLaunchDate, androidMonetizationLaunchDate, gracePeriodDays,
            "grandfathered 3-day warning", logger,
            (repo, iosDate, androidDate, graceDays) => repo.GetGrandfatheredUsersForTrial3DayWarningNotificationsCountAsync(iosDate, androidDate, graceDays),
            (repo, iosDate, androidDate, graceDays, skip, take) => repo.GetGrandfatheredUsersForTrial3DayWarningNotificationsBatchAsync(iosDate, androidDate, graceDays, skip, take),
            (notifService, userId, isBusiness, isGrandfathered, graceDays) => notifService.SendTrial3DayWarningNotificationAsync(userId, isBusiness, isGrandfathered, graceDays),
            (emailSvc, email, firstName, isBusiness, isGrandfathered, graceDays) => emailSvc.SendTrial3DayWarningEmailAsync(email, firstName, isBusiness, isGrandfathered, graceDays),
            (repo, userId) => repo.Mark3DayWarningSentAsync(userId));
        tasksRun.Add("GrandfatheredTrial3DayWarningNotifications");
        logger.LogInformation("3-day warning notifications to grandfathered users sent");
    }

    if (periodicTaskConfig.EnableGrandfatheredTrial1DayWarningNotifications)
    {
        logger.LogInformation("Sending 1-day warning notifications to grandfathered users...");
        await ProcessGrandfatheredTrialWarningNotificationsAsync(
            userRepository, notificationService, emailService,
            iosMonetizationLaunchDate, androidMonetizationLaunchDate, gracePeriodDays,
            "grandfathered 1-day warning", logger,
            (repo, iosDate, androidDate, graceDays) => repo.GetGrandfatheredUsersForTrial1DayWarningNotificationsCountAsync(iosDate, androidDate, graceDays),
            (repo, iosDate, androidDate, graceDays, skip, take) => repo.GetGrandfatheredUsersForTrial1DayWarningNotificationsBatchAsync(iosDate, androidDate, graceDays, skip, take),
            (notifService, userId, isBusiness, isGrandfathered, graceDays) => notifService.SendTrial1DayWarningNotificationAsync(userId, isBusiness, isGrandfathered, graceDays),
            (emailSvc, email, firstName, isBusiness, isGrandfathered, graceDays) => emailSvc.SendTrial1DayWarningEmailAsync(email, firstName, isBusiness, isGrandfathered, graceDays),
            (repo, userId) => repo.Mark1DayWarningSentAsync(userId));
        tasksRun.Add("GrandfatheredTrial1DayWarningNotifications");
        logger.LogInformation("1-day warning notifications to grandfathered users sent");
    }

    if (periodicTaskConfig.EnableGrandfatheredTrialEndedWarningNotifications)
    {
        logger.LogInformation("Sending ended warning notifications to grandfathered users...");
        await ProcessGrandfatheredTrialWarningNotificationsAsync(
            userRepository, notificationService, emailService,
            iosMonetizationLaunchDate, androidMonetizationLaunchDate, gracePeriodDays,
            "grandfathered trial ended", logger,
            (repo, iosDate, androidDate, graceDays) => repo.GetGrandfatheredUsersForTrialEndedWarningNotificationsCountAsync(iosDate, androidDate, graceDays),
            (repo, iosDate, androidDate, graceDays, skip, take) => repo.GetGrandfatheredUsersForTrialEndedWarningNotificationsBatchAsync(iosDate, androidDate, graceDays, skip, take),
            (notifService, userId, isBusiness, isGrandfathered, graceDays) => notifService.SendTrialExpiredNotificationAsync(userId, isBusiness, isGrandfathered, graceDays),
            (emailSvc, email, firstName, isBusiness, isGrandfathered, graceDays) => emailSvc.SendTrialEndedWarningEmailAsync(email, firstName, isBusiness, isGrandfathered, graceDays),
            (repo, userId) => repo.MarkTrialEndedWarningSentAsync(userId));
        tasksRun.Add("GrandfatheredTrialEndedWarningNotifications");
        logger.LogInformation("Ended warning notifications to grandfathered users sent");
    }

    logger.LogInformation("=== Periodic Tasks Completed ===");
    logger.LogInformation("Tasks executed: {Tasks}", string.Join(", ", tasksRun));
    logger.LogInformation("Finished at: {Time}", DateTimeOffset.UtcNow);
    
    Console.WriteLine($"\nCompleted {tasksRun.Count} tasks successfully");
    
    // Ensure all logs are flushed before exit
    Log.CloseAndFlush();
    await Task.Delay(1000); // Give GCP time to collect logs
    
    Environment.Exit(0);
}
catch (Exception ex)
{
    Log.Fatal(ex, "Worker failed with fatal error");
    Console.Error.WriteLine($"FATAL ERROR: {ex.Message}");
    Console.Error.WriteLine($"Stack Trace: {ex.StackTrace}");
    
    // Ensure all logs are flushed before exit
    Log.CloseAndFlush();
    await Task.Delay(1000); // Give GCP time to collect logs
    
    Environment.Exit(1);
}   
