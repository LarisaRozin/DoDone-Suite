/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Db.Repositories;
using DoDone.Shared.Abstractions;
using DoDone.Server.Services;
using DoDone.Server.Attributes;
using DoDone.Server.Configuration;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Caching.Memory;
using System.Text;
using DoDone.Server.Services.Common;
using Serilog;
using Serilog.Sinks.GoogleCloudLogging;
using DoDone.Server.Middleware;

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
// Maps environment names: Production/Sandbox -> production/sandbox in Firestore
// Configuration is cached in memory with 30-second TTL and reloaded automatically
var firestoreEnvironment = environmentName.ToLowerInvariant() switch
{
    "production" => "production",
    "sandbox" => "sandbox",
    _ => "production" // Default to production config for unknown environments
};

try
{
    builder.Configuration.AddFirestoreConfiguration(
        environment: firestoreEnvironment,
        projectId: "dodone-mobile", 
        databaseId: "dodone-config",
        reloadOnChange: true,
        cacheTtlSeconds: 30);
    
    Console.WriteLine($"[Startup] Firestore configuration provider added for environment: {firestoreEnvironment} (HIGHEST PRIORITY)");
}
catch (Exception ex)
{
    Console.WriteLine($"[Startup] Warning: Could not add Firestore configuration: {ex.Message}. Using static configuration files only.");
}

// // Debug: Log all configuration sources in order
// Console.WriteLine("[Startup] Configuration sources (in priority order, last wins):");
// for (int i = 0; i < builder.Configuration.Sources.Count; i++)
// {
//     var source = builder.Configuration.Sources[i];
//     Console.WriteLine($"  {i + 1}. {source.GetType().Name}");
// }

// Configure Serilog based on environment
var loggerConfig = new LoggerConfiguration();

if (builder.Environment.IsDevelopment())
{
    loggerConfig
        .ReadFrom.Configuration(builder.Configuration)
       // .Enrich.With<DoDone.Server.Middleware.SingleLineHttpLoggingEnricher>()
        .WriteTo.Console()
        .WriteTo.File("logs/dodone-.txt", 
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 30,
            fileSizeLimitBytes: 100_000_000,
            rollOnFileSizeLimit: true,
            shared: true,
            flushToDiskInterval: TimeSpan.FromSeconds(1));
}
else
{
    // Production: Use appsettings.Production.json Serilog configuration
    // which includes Console sink with CompactJsonFormatter for Cloud Logging auto-detection
    // Async writes are handled by Serilog config's WriteTo pipeline
    loggerConfig.ReadFrom.Configuration(builder.Configuration);
        // .Enrich.With<DoDone.Server.Middleware.SingleLineHttpLoggingEnricher>();
}

Log.Logger = loggerConfig.CreateLogger();
// Serilog.Debugging.SelfLog.Enable(Console.Error.WriteLine);

builder.Host.UseSerilog();

// Add response compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
});

// Add memory caching for expensive operations
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 200; // Limit cache entries
    options.CompactionPercentage = 0.25; // Remove 25% when limit reached
});

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddDbContext<DoDoneDbContext>(options =>
     options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"), 
         npgsqlOptions =>
         {
             npgsqlOptions.CommandTimeout(30); // 30 second timeout
             npgsqlOptions.EnableRetryOnFailure(
                 maxRetryCount: 3, 
                 maxRetryDelay: TimeSpan.FromSeconds(2), 
                 errorCodesToAdd: null);
         })
         .EnableDetailedErrors(true)
         .EnableSensitiveDataLogging(builder.Environment.IsDevelopment()));
        //  .ConfigureWarnings(warnings => 
        //  {
        //      if (!builder.Environment.IsDevelopment())
        //      {
        //          warnings.Log(Microsoft.EntityFrameworkCore.Diagnostics.CoreEventId.FirstWithoutOrderByAndFilterWarning);
        //      }
        //  }));

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

builder.Services.Configure<HttpLoggingOptions>(
    builder.Configuration.GetSection("HttpLogging"));

// Register Authorization handlers
builder.Services.AddScoped<IAuthorizationHandler, AdminRequirementHandler>();

// Configure Authorization
builder.Services.AddAuthorization();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
// Get JWT key with environment variable fallback (same logic as JwtService)
var jwtKey = jwtSettings["Key"];
if (string.IsNullOrEmpty(jwtKey))
{
    jwtKey = Environment.GetEnvironmentVariable("JWT_KEY");
}
var key = Encoding.UTF8.GetBytes(jwtKey!);

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

// Configure Data Protection to persist keys in PostgreSQL
// This ensures password reset and email confirmation tokens survive container restarts
builder.Services.AddDataProtection()
    .SetApplicationName("DoDone")
    .PersistKeysToDbContext<DoDoneDbContext>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero
    };
    
    // Add logging for debugging
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError("Authentication failed: {Error}", context.Exception.Message);
            return Task.CompletedTask;
        },
        // OnTokenValidated = context =>
        // {
        //     var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
        //     // logger.LogInformation("Token validated for user: {User}", context.Principal?.Identity?.Name);
        //     return Task.CompletedTask;
        // },
        OnChallenge = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogWarning("Authentication challenge: {Error}", context.Error);
            return Task.CompletedTask;
        }
    };
});

// Register repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ITeamRepository, TeamRepository>();
// builder.Services.AddScoped<ITeamGradeConfigRepository, TeamGradeConfigRepository>();
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
builder.Services.AddScoped<IFailedWebhookNotificationRepository, FailedWebhookNotificationRepository>();

// Register circuit breaker factory
builder.Services.AddSingleton<ICircuitBreakerFactory, CircuitBreakerFactory>();

// Register services
builder.Services.AddScoped<IConnectionPoolMonitorService, ConnectionPoolMonitorService>();
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
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();

// Register webhook services
builder.Services.AddHttpClient(); // Required for Apple webhook service
builder.Services.AddSingleton<DoDone.Server.Services.Webhooks.IGooglePlayWebhookService, DoDone.Server.Services.Webhooks.GooglePlayWebhookService>();
builder.Services.AddSingleton<DoDone.Server.Services.Webhooks.IAppleWebhookService, DoDone.Server.Services.Webhooks.AppleWebhookService>();
builder.Services.AddScoped<DoDone.Server.Services.Webhooks.ISubscriptionWebhookService, DoDone.Server.Services.Webhooks.SubscriptionWebhookService>();

// Register background services
builder.Services.AddHostedService<PeriodicTasksService>();
builder.Services.AddHostedService<DoDone.Server.Services.Webhooks.WebhookRetryBackgroundService>();

// Add health checks - simple self-check only to avoid blocking on DB connection during probes
// Cloud Run health probes just need HTTP 200, not full DB verification
builder.Services.AddHealthChecks()
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy());

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactAndReactNative", policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .WithOrigins(
                // Production domains
                "https://dodoneapp.com",
                "https://www.dodoneapp.com",
                "https://dodone-mobile.web.app",
                "https://dodone-mobile.firebaseapp.com",
                
                // Development - localhost
                "http://localhost:5214",
                "https://localhost:5215",
                "http://localhost:5173",
                "https://localhost:5173",
                "http://localhost:8081",
                "https://localhost:8081",
                
                // Development - local network IPs for mobile testing
                "http://172.27.16.1:5214",
                "https://172.27.16.1:5214",
                "http://172.20.16.1:5214",
                "https://172.20.16.1:5215",
                "http://172.20.16.1:8081",
                "https://172.20.16.1:8081",
                "http://172.21.144.1:5214",
                "https://172.21.144.1:5215",
                "http://172.21.144.1:8081",
                "https://172.21.144.1:8081",
                "http://35.145.150.17:5214",
                "https://35.145.150.17:5215",
                "http://35.145.150.17:8081",
                "https://35.145.150.17:8081",
                "http://192.168.1.126:8081",
                "https://192.168.1.126:8081",
                "http://192.168.1.126:5173",
                "https://192.168.1.126:5173",
                "http://192.168.1.126:5214",
                "https://192.168.1.126:5215"
            );
    });
});

// builder.Services.AddHttpLogging(logging =>
// {
//     // Emit a single combined log entry per request/response
//     logging.CombineLogs = true;

//     // Log core request/response properties and bodies (avoid noisy headers by default)
//     logging.LoggingFields = Microsoft.AspNetCore.HttpLogging.HttpLoggingFields.RequestProtocol
//                            | Microsoft.AspNetCore.HttpLogging.HttpLoggingFields.RequestPath
//                            | Microsoft.AspNetCore.HttpLogging.HttpLoggingFields.RequestQuery
//                            | Microsoft.AspNetCore.HttpLogging.HttpLoggingFields.ResponseStatusCode
//                            | Microsoft.AspNetCore.HttpLogging.HttpLoggingFields.RequestBody
//                            | Microsoft.AspNetCore.HttpLogging.HttpLoggingFields.ResponseBody;

//     // Reduce header noise (no default headers logged)
//     logging.RequestHeaders.Clear();
//     logging.ResponseHeaders.Clear();
    
//     // Configure limits for body size to log
//     logging.RequestBodyLogLimit = 8192; 
//     logging.ResponseBodyLogLimit = 8192;
    
//     // Critical: Configure media types for body logging
//     logging.MediaTypeOptions.Clear();
//     logging.MediaTypeOptions.AddText("application/json");
//     logging.MediaTypeOptions.AddText("application/json; charset=utf-8");
//     logging.MediaTypeOptions.AddText("application/xml");
//     logging.MediaTypeOptions.AddText("text/plain");
//     logging.MediaTypeOptions.AddText("text/html");
    
//     // Note: Request headers to redact (for security)
//     // logging.RequestHeaders.Add("Authorization");
//     // logging.RequestHeaders.Add("Cookie");
// });

var app = builder.Build();

// Console.WriteLine("========================================");
// Console.WriteLine("DIRECT CONSOLE TEST - DoDone Server Starting");
// Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");
// Console.WriteLine($"Time: {DateTime.UtcNow}");
// Console.WriteLine("========================================");

// Log.Warning("About to register HttpLoggingMiddleware - Environment: {Environment}", app.Environment.EnvironmentName);

// Custom middleware logs request and response together (better for webhooks)
// MUST be early in pipeline to capture all requests and BEFORE compression
app.UseMiddleware<DoDone.Server.Middleware.HttpLoggingMiddleware>();

// Log.Warning("HttpLoggingMiddleware registered successfully");

// Enable response compression
app.UseResponseCompression();

// Built-in HTTP logging (logs separate entries for request/response)
// MUST be AFTER ResponseCompression so it captures uncompressed response bodies
// app.UseHttpLogging();
// app.UseSerilogRequestLogging(); 

app.UseCors("AllowReactAndReactNative");

// Enable static file serving from wwwroot
app.UseStaticFiles();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseAuthentication();
app.UseAuthorization();

// Map health check endpoints
app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready");

app.MapControllers();

try
{
    Log.Information("Starting DoDone Server - Environment: {Environment}", builder.Environment.EnvironmentName);
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.Information("Shutting down DoDone Server");
    Log.CloseAndFlush();
    // Give Serilog time to flush
    System.Threading.Thread.Sleep(500);
}
