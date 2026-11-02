/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Server.Dtos;
using DoDone.Server.Extensions;
using DoDone.Db.Repositories;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using DoDone.Shared.Enums;
using DoDone.Shared;
using DoDone.Server.Helpers;

namespace DoDone.Server.Services;

public interface IAuthService
{
    Task<ResponseBase> RegisterAsync(RegisterRequest request);
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<ResetPasswordResponse> ResetPasswordAsync(ResetPasswordRequest request);
    // Task<SendPasswordResetEmailResponse> SendPasswordResetEmailAsync(SendPasswordResetEmailRequest request);
    Task<SendPasswordResetEmailResponse> SendPasswordResetEmailForUserAsync(SendPasswordResetEmailRequestForUser request);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _users;
    private readonly ITeamRepository _teams;
    private readonly IJwtService _jwtService;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IEmailService _emailService;
    private readonly IUserDeviceRegistrationService _userDeviceRegistrationService;
    private readonly ILogger<AuthService> _logger;
    private readonly IConfiguration _configuration;

    private readonly IServiceScopeFactory _serviceScopeFactory;

    public AuthService(IUserRepository users
        , ITeamRepository teams
        , IJwtService jwtService, IPasswordHasher<User> passwordHasher
        , IEmailService emailService
        , IUserDeviceRegistrationService userDeviceRegistrationService
        , ILogger<AuthService> logger
        , IConfiguration configuration
        , IServiceScopeFactory serviceScopeFactory
        )
    {
        _teams = teams;
        _users = users;
        _jwtService = jwtService;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
        _userDeviceRegistrationService = userDeviceRegistrationService;
        _logger = logger;
        _configuration = configuration;
        _serviceScopeFactory = serviceScopeFactory;
    }

    public async Task<ResponseBase> RegisterAsync(RegisterRequest request)
    {
        var response = new ResponseBase { Message = request.Validate() };

        if (!string.IsNullOrWhiteSpace(response.Message))
        {
            response.Success = false;
            return response;
        }

        var existingUser = await _users.GetByUsernameAsync(request.UserName);
        if (existingUser != null)
        {
            response.Success = false;
            response.Message = $"User with username {request.UserName} already exists. Please choose a different username.";
            return response;
        }

        existingUser = await _users.GetByEmailAsync(request.Email);
        if (existingUser != null)
        {
            response.Success = false;
            response.Message = $"User with email {request.Email} already exists. Please login to your existing account or choose a different email to create a new account.";
            return response;
        }

        response.Message = $"{request.UserName} registered successfully.";



        var teamOrFamily = request.IsBusiness ? "'s Team" : "'s Family";
        var team = new Team
        {
            Name = string.IsNullOrWhiteSpace(request.TeamName) ? request.UserName.Trim() + teamOrFamily : request.TeamName.Trim(),
            Description = request.TeamDescription,
            IsBusiness = request.IsBusiness,
            CreatedAt = DateTime.UtcNow,
            // TrialEndsAt = trialEndsAt,
        };

        await _teams.CreateAsync(team);

        var user = new User
        {
            UserName = request.UserName.Trim(),
            TeamId = team.Id,
            Email = request.Email.Trim(),
            NormalizedEmail = request.Email.Trim().ToUpperInvariant(),
            NormalizedUserName = request.UserName.Trim().ToUpperInvariant(),
            SecurityStamp = Guid.NewGuid().ToString(),
            IsAdmin = true,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            MiddleName = request.MiddleName?.Trim(),
            Salutation = request.Salutation?.Trim(),
            CreatedAt = DateTime.UtcNow,
            IsFirstTeamAdmin = true,
        };

        // Hash the password after creating the user instance
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        await _users.CreateAsync(user);
        await _users.SaveChangesAsync();

        // var deviceRegistrationRequest = new DeviceRegistrationRequest
        // {
        //     DeviceId = request.DeviceId,
        //     FcmToken = string.Empty, // No FCM token at registration time
        //     Platform = request.Platform,
        //     Timezone = request.Timezone
        // };

        // await _userDeviceRegistrationService.RegisterDeviceAsync(deviceRegistrationRequest, user.Id);

        // Fire and forget background operations - don't await these
        var userId = user.Id;
        var teamId = team.Id;
        var userEmail = user.Email;
        var userName = user.UserName;
        var isBusiness = team.IsBusiness;
        
        // Clone objects to avoid reference issues with disposed contexts
        var requestForBackground = new RegisterRequest
        {
            UserName = request.UserName,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            MiddleName = request.MiddleName,
            Salutation = request.Salutation,
            TeamName = request.TeamName,
            TeamDescription = request.TeamDescription,
            IsBusiness = request.IsBusiness,
            Password = request.Password, // Will not be used in background
            DeviceId = request.DeviceId,
            Platform = request.Platform,
            Timezone = request.Timezone
        };
        
        var teamForBackground = new Team
        {
            Id = team.Id,
            Name = team.Name,
            Description = team.Description,
            IsBusiness = team.IsBusiness
        };
        
        var userForBackground = new User
        {
            Id = user.Id,
            UserName = user.UserName,
            TeamId = user.TeamId,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            MiddleName = user.MiddleName,
            Salutation = user.Salutation,
            IsAdmin = user.IsAdmin,
            CreatedAt = user.CreatedAt,
            IsFirstTeamAdmin = user.IsFirstTeamAdmin
        };
        
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedSampleDataService = scope.ServiceProvider.GetRequiredService<ISampleDataService>();
                var scopedAllowanceCalculationService = scope.ServiceProvider.GetRequiredService<IAllowanceCalculationService>();
                var scopedEmailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                
                await CreateSampleDataWithScopedServices(requestForBackground, teamForBackground, userForBackground, scopedSampleDataService, scopedAllowanceCalculationService, Defaults.SystemUserId);
                await SendWelcomeEmailWithScopedServices(userEmail, userName, isBusiness, scopedEmailService);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background processing failed for user registration. UserId: {UserId}, TeamId: {TeamId}", userId, teamId);
            }
        });

        response.Success = true;
        return response;
    }

    private async Task SendWelcomeEmailWithScopedServices(string userEmail, string userName, bool isBusiness, IEmailService emailService)
    {
        try
        {
            await emailService.SendWelcomeEmailAsync(userEmail, userName, isBusiness);
            _logger.LogInformation("Welcome email sent successfully to {Email} for user {UserName}", userEmail, userName);
        }
        catch (Exception ex)
        {
            // Log but don't fail registration if email fails
            // The user registration should succeed even if email fails
            // (email service might be temporarily unavailable)
            _logger.LogError(ex, "Failed to send welcome email to {Email} for user {UserName}. Email delivery may be delayed.", userEmail, userName);
        }
    }

    private async Task CreateSampleDataWithScopedServices(RegisterRequest request, Team team, User user, ISampleDataService sampleDataService, IAllowanceCalculationService allowanceCalculationService, long currentUserId)
    {
        List<TeamAllowanceInterval> intervals = new List<TeamAllowanceInterval>();
        TeamAllowanceInterval? weeklyInterval = null;
        List<TaskGroup> taskGroups = new List<TaskGroup>();
        TaskGroup? group = null;
        TaskKind? kind = null;
        TaskCategory? category = null;
        
        try
        {
            intervals = await sampleDataService.CreateDefaultAllowanceIntervalsAsync(team.Id, team.IsBusiness);
            weeklyInterval = intervals.First(i => i.IntervalType == AllowanceIntervalType.Weekly);
            _logger.LogInformation("Successfully created default allowance intervals for user {UserName}, team {TeamId}", request.UserName, team.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "User {UserName} registered, but encountered an error while creating allowance intervals for team {TeamId}", request.UserName, team.Id);
        }

        try
        {
            // Create sample data for the new user
            taskGroups = await sampleDataService.CreateDefaultTaskGroupsAsync(user, team.IsBusiness);
            group = taskGroups.Where(tg => tg.Name == "Miscellaneous Tasks").Any()
                ? taskGroups.First(tg => tg.Name == "Miscellaneous Tasks")
                : taskGroups.FirstOrDefault();
            kind = group != null && group.Kinds.Any()
                ? group.Kinds.First()
                : null;
            category = kind != null && kind.Categories.Any()
                ? kind.Categories.First()
                : null;
            _logger.LogInformation("Successfully created default task groups for user {UserName}, userId {UserId}", request.UserName, user.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "User {UserName} registered, but encountered an error while creating sample task groups for userId {UserId}", request.UserName, user.Id);
        }

        try
        {
            await sampleDataService.CreateSampleTaskForNewUserAsync(user, team, weeklyInterval?.Id, group?.Id, kind?.Id, category?.Id);
            _logger.LogInformation("Successfully created sample tasks for user {UserName}, userId {UserId}", request.UserName, user.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "User {UserName} registered, but encountered an error while creating sample tasks for userId {UserId}", request.UserName, user.Id);
        }

        try
        {
            if (weeklyInterval != null)
            {
                await allowanceCalculationService.RecalculateUserAllowanceAsync(user, weeklyInterval, Defaults.SystemUserId);
                _logger.LogInformation("Successfully recalculated allowance for user {UserName}, userId {UserId}", request.UserName, user.Id);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "User {UserName} registered, but encountered an error while recalculating allowance for userId {UserId}", request.UserName, user.Id);
        }
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var response = new LoginResponse { Message = request.Validate() };
        if (!string.IsNullOrWhiteSpace(response.Message))
        {
            response.Success = false;
            return response;
        }

        var username = request.UserName.Trim();
        
        var user = await _users.GetByUsernameAsync(username);
        if (user == null)
        {
            response.Success = false;
            response.Message = $"User {username} not found";
            Console.WriteLine($"DEBUG: User {username} not found");
            return response;
        }

        if (user.IsActive == false)
        {
            response.Success = false;
            response.Message = $"User {username} is inactive";
            return response;
        }

        if (string.IsNullOrEmpty(user.PasswordHash))
        {
            response.Success = false;
            response.Message = "Invalid Password";
            Console.WriteLine($"DEBUG: PasswordHash is null or empty for user {username}");
            return response;
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            response.Success = false;
            response.Message = "Invalid Password";
            Console.WriteLine($"DEBUG: Invalid password for user {username}");
            return response;
        }

        var token = _jwtService.GenerateToken(user);

        if (user.IsFirstTeamAdmin && !user.TrialWelcomeSentAt.HasValue)
        {
            var userId = user.Id;
            var userEmail = user.Email!;
            var userName = user.UserName!;
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var scopedEmailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                    var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                    var scopedTeamRepository = scope.ServiceProvider.GetRequiredService<ITeamRepository>();
                    var team = await scopedTeamRepository.GetDetailsAsync(user.TeamId);
                    if (team == null)
                    {
                        _logger.LogError("Failed to send first-time admin login welcome email: Team not found for user {UserName}", user.UserName);
                        return;
                    }

                    int defaultTrialPeriodDays = 30;
                    var trialDays = _configuration.GetIntValueOrDefault("SubscriptionSettings:TrialPeriodDays", defaultTrialPeriodDays);

                    team.TrialEndsAt = DateTime.UtcNow.AddDays(trialDays); // Start trial period on first login
                    await scopedTeamRepository.UpdateAsync(team);

                    var isBusiness = team.IsBusiness;  
                    await scopedNotificationService.SendTrialWelcomeNotificationAsync(userId, isBusiness, false, trialDays);
                    await scopedEmailService.SendTrialWelcomeEmailAsync(userEmail, userName, team.IsBusiness, false, trialDays);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send first-time admin login welcome email to {Email} for user {UserName}. Email delivery may be delayed.", user.Email, user.UserName);
                }
            });

            user.TrialWelcomeSentAt = DateTimeOffset.UtcNow;
        }

        await _users.UpdateAsync(user);
        await _users.SaveChangesAsync();

        // TODO: Update user's timezone on login 

        response.Success = true;
        response.Message = $"User {request.UserName} logged in successfully.";
        response.User = user.ToDto();
        response.Token = token;

        return response;
    }


    public async Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var response = new ForgotPasswordResponse { Message = request.Validate() };
        if (!string.IsNullOrWhiteSpace(response.Message))
        {
            response.Success = false;
            return response;
        }

        var user = await _users.GetByEmailAsync(request.Email);
        if (user == null)
        {
            response.Success = false;
            response.Message = $"User with email {request.Email} not found";
            return response;
        }

        if (string.IsNullOrWhiteSpace(user.Email))
        {
            response.Success = false;
            response.Message = $"User {user.UserName} does not have a valid email address";
            return response;
        }

        // Get team information
        var team = await _teams.GetDetailsAsync(user.TeamId);
        if (team == null)
            throw new InvalidOperationException("Unable to retrieve team information for {user.UserName}");

        // Generate password reset token and send email
        var token = _jwtService.GenerateToken(user);

        await _emailService.SendPasswordResetEmailAsync(user.Email, token, team.IsBusiness);

        response.Success = true;
        response.Message = $"Password reset email sent to {request.Email}";
        return response;
    }

    public async Task<ResetPasswordResponse> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var response = new ResetPasswordResponse { Message = request.Validate() };
        if (!string.IsNullOrWhiteSpace(response.Message))
        {
            response.Success = false;
            return response;
        }

        // Verify token and extract user information from it
        var principal = _jwtService.GetPrincipalFromToken(request.Token);
        if (principal == null)
        {
            response.Success = false;
            response.Message = "Invalid token";
            return response;
        }

        // Extract user ID from token claims
        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !long.TryParse(userIdClaim, out var userId))
        {
            response.Success = false;
            response.Message = "Invalid token - user information not found";
            return response;
        }

        var user = await _users.GetAsync(userId);
        if (user == null)
        {
            response.Success = false;
            response.Message = "User not found";
            return response;
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        await _users.UpdateAsync(user);
        await _users.SaveChangesAsync();

        response.Success = true;
        response.Message = $"Password reset successful for user {user.UserName}";
        return response;
    }

    public async Task<SendPasswordResetEmailResponse> SendPasswordResetEmailForUserAsync(SendPasswordResetEmailRequestForUser request)
    {
        var response = new SendPasswordResetEmailResponse();
        var user = await _users.GetAsync(request.UserId);
        if (user == null)
        {
            response.Success = false;
            response.Message = $"User with ID {request.UserId} not found";
            return response;
        }

        if (string.IsNullOrWhiteSpace(user.Email))
        {
            response.Success = false;
            response.Message = $"User {user.UserName} does not have a valid email address";
            return response;
        }

        // Get team information
        var team = await _teams.GetDetailsAsync(user.TeamId);
        if (team == null)
            throw new InvalidOperationException("Unable to retrieve team information for {user.UserName}");

        // Generate password reset token and send email

        // Generate token with 24-hour expiration for admin-requested user password reset emails (1440 minutes)
        var token = _jwtService.GenerateToken(user, 1440);
        await _emailService.SendPasswordResetEmailAsync(user.Email, token, team.IsBusiness, "24 hours");

        response.Success = true;
        response.Message = $"Password reset email sent to user with ID {request.UserId}";
        return response;
    }
}