/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Db.Repositories;
using DoDone.Server.Dtos;
using DoDone.Server.Extensions;
using Microsoft.AspNetCore.Identity;

namespace DoDone.Server.Services;

public interface IUserService
{
    Task<DataResponse<UserResponse>> CreateAsync(UserCreateRequest request);
    Task<ResponseBase> DeleteAsync(long id);
    Task<DataResponse<UserResponse>> GetByIdAsync(long id);
    Task<DataResponse<UserResponse>> UpdateAsync(UserUpdateRequest request);
    Task<DataResponse<List<UserNotificationPreferenceResponse>>> GetNotificationPreferencesAsync();
    Task<DataResponse<List<UserNotificationPreferenceResponse>>> CreateNotificationPreferencesAsync(BulkNotificationPreferenceCreateRequest request);
    Task<ResponseBase> UpdateNotificationPreferenceAsync(long preferenceId, bool isEnabled);
    Task<ResponseBase> UpdateNotificationPreferencesAsync(BulkNotificationPreferenceUpdateRequest request);
    Task<DataResponse<long>> GetCurrentUserTeamIdAsync();
    Task<bool> IsLastTeamAdmin();
}

public class UserService : IUserService
{
    private readonly IUserRepository _users;
    private readonly ICurrentUserService _currentUser;
    private readonly UserManager<User> _userManager;
    private readonly IEmailService _emailService;
    private readonly IJwtService _jwtService;
    private readonly ISampleDataService _sampleDataService;
    private readonly ITeamRepository _teams;
    private readonly ITaskGroupRepository _taskGroups;
    private readonly IAllowanceCalculationService _allowanceCalculationService;
    private readonly ILogger<UserService> _logger;
    private readonly IServiceScopeFactory _serviceScopeFactory;

    public UserService(IUserRepository users,
                       ICurrentUserService currentUser,
                       UserManager<User> userManager,
                       IEmailService emailService,
                       IJwtService jwtService,
                       ISampleDataService sampleDataService,
                       ITeamRepository teams,
                       ITaskGroupRepository taskGroups,
                       IAllowanceCalculationService allowanceCalculationService,
                       ILogger<UserService> logger,
                       IServiceScopeFactory serviceScopeFactory)
    {
        _users = users;
        _currentUser = currentUser;
        _userManager = userManager;
        _emailService = emailService;
        _jwtService = jwtService;
        _sampleDataService = sampleDataService;
        _teams = teams;
        _taskGroups = taskGroups;
        _allowanceCalculationService = allowanceCalculationService;
        _logger = logger;
        _serviceScopeFactory = serviceScopeFactory;
    }

    public async Task<DataResponse<UserResponse>> CreateAsync(UserCreateRequest request)
    {
        if (!_currentUser.IsAdmin)
        {
            _logger.LogError("Access denied: Only admin users can create new users");
            throw new UnauthorizedAccessException("Only admin users can create new users");
        }

        var response = new DataResponse<UserResponse>
        {
            Message = await request.Validate(_users.UserExistsAsync)
        };

        if (!string.IsNullOrWhiteSpace(response.Message))
        {
            response.Success = false;
            return response;
        }

        var user = new User
        {
            TeamId = _currentUser.TeamId,
            UserName = request.UserName.Trim(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            MiddleName = request.MiddleName?.Trim(),
            Salutation = request.Salutation?.Trim(),
            Email = request.Email.Trim(),
            IsAdmin = request.IsAdmin,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            CreatedBy = _currentUser.UserId,
            // Ensure SecurityStamp is initialized
            SecurityStamp = Guid.NewGuid().ToString()
            // Let UserManager handle NormalizedEmail, and NormalizedUserName
        };

        // Create user without password - they'll set it via welcome email
        // Use a temporary strong password that user can't guess
        var tempPassword = $"TempPassword{Guid.NewGuid():N}!";
        var result = await _userManager.CreateAsync(user, tempPassword);

        if (!result.Succeeded)
        {
            response.Success = false;
            response.Message = string.Join(", ", result.Errors.Select(e => e.Description));
            return response;
        }

        // Get team information
        var team = await _teams.GetDetailsAsync(_currentUser.TeamId);
        if (team == null)
            throw new InvalidOperationException("Unable to retrieve team information for sample task creation");

        // Fire and forget background operations - don't await these
        var userId = user.Id;
        var teamId = team.Id;
        var userEmail = user.Email ?? string.Empty;
        var userFirstName = user.FirstName;
        var currentUserFirstName = _currentUser.FirstName;
        var currentUserLastName = _currentUser.LastName;
        var isBusiness = team.IsBusiness;
        var currentUserId = _currentUser.UserId;
        
        // Clone objects to avoid reference issues with disposed contexts
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
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            CreatedBy = user.CreatedBy
        };
        
        var teamForBackground = new Team
        {
            Id = team.Id,
            Name = team.Name,
            Description = team.Description,
            IsBusiness = team.IsBusiness
        };
        
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedSampleDataService = scope.ServiceProvider.GetRequiredService<ISampleDataService>();
                var scopedTaskGroups = scope.ServiceProvider.GetRequiredService<ITaskGroupRepository>();
                var scopedTeams = scope.ServiceProvider.GetRequiredService<ITeamRepository>();
                var scopedUserManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
                var scopedEmailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                var scopedJwtService = scope.ServiceProvider.GetRequiredService<IJwtService>();
                
                await CreateSampleTaskForNewUserWithScopedServices(userForBackground, teamForBackground, currentUserId, scopedSampleDataService, scopedTaskGroups, scopedTeams);
                await SendWelcomeEmailWithScopedServices(userEmail, userFirstName, currentUserFirstName, currentUserLastName, isBusiness, scopedUserManager, scopedEmailService, scopedJwtService);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background processing failed for user creation. UserId: {UserId}, TeamId: {TeamId}", userId, teamId);
            }
        });

        response.Data = user.ToDto();
        response.Success = true;
        if (string.IsNullOrEmpty(response.Message))
        {
            response.Message = "User created successfully and welcome email sent";
        }
        return response;
    }

    private async Task CreateSampleTaskForNewUserWithScopedServices(User user, Team team, long currentUserId, ISampleDataService sampleDataService, ITaskGroupRepository taskGroups, ITeamRepository teams)
    {
        TaskGroup? group = null;
        TaskKind? kind = null;
        TaskCategory? category = null;
        try
        {
            var taskGroupsList = await taskGroups.GetListAsync(currentUserId);
            group = taskGroupsList.Where(tg => tg.Name == "Miscellaneous Tasks").Any()
                ? taskGroupsList.First(tg => tg.Name == "Miscellaneous Tasks")
                : taskGroupsList.FirstOrDefault();
            kind = group != null && group.Kinds.Any()
                ? group.Kinds.First()
                : null;
            category = kind != null && kind.Categories.Any()
                ? kind.Categories.First()
                : null;
            _logger.LogInformation("Successfully retrieved default task group/kind/category for new user {UserId}", user.Id);
        }
        catch (Exception ex)
        {
            // Log error but don't fail user creation
            _logger.LogError(ex, "Error retrieving default task group/kind/category for new user {UserId}: {ErrorMessage}", user.Id, ex.Message);
        }

        var interval = default(TeamAllowanceInterval);
        try
        {
            var existingIntervals = await teams.GetTeamAllowanceIntervalsAsync(team.Id);
            var weeklyInterval = existingIntervals.FirstOrDefault(i => i.IntervalType == Shared.Enums.AllowanceIntervalType.Weekly);
            interval = weeklyInterval ?? existingIntervals.FirstOrDefault();
            _logger.LogInformation("Successfully retrieved allowance interval for new user {UserId}", user.Id);
        }
        catch (Exception ex)
        {
            // Log error but don't fail user creation
            _logger.LogError(ex, "Error retrieving allowance interval for new user {UserId}: {ErrorMessage}", user.Id, ex.Message);
        }

        try
        {
            await sampleDataService.CreateSampleTaskForNewUserAsync(user, team, interval?.Id ?? 0, group?.Id, kind?.Id, category?.Id);
            _logger.LogInformation("Successfully created sample task for new user {UserId}", user.Id);
        }
        catch (Exception ex)
        {
            // Log error but don't fail user creation
            _logger.LogError(ex, "Error creating sample task for new user {UserId}: {ErrorMessage}", user.Id, ex.Message);
        }
    }

    private async Task SendWelcomeEmailWithScopedServices(string userEmail, string userFirstName, string currentUserFirstName, string currentUserLastName, bool isBusiness, UserManager<User> userManager, IEmailService emailService, IJwtService jwtService)
    {
        try
        {
            // Retrieve the user from database to ensure we have the complete object with proper ID
            var createdUser = await userManager.FindByEmailAsync(userEmail);
            if (createdUser != null)
            {
                // Generate token with 24-hour expiration for welcome emails (1440 minutes)
                var token = jwtService.GenerateToken(createdUser, 1440);
                await emailService.SendWelcomeEmailWithPasswordResetInstructionsAsync(
                    createdUser.Email ?? string.Empty,
                    createdUser.FirstName,
                    token,
                    currentUserFirstName,
                    currentUserLastName,
                    isBusiness);
                _logger.LogInformation("Welcome email sent successfully to {Email} for user {UserName}", userEmail, userFirstName);
            }
            else
            {
                _logger.LogError("Unable to retrieve created user for welcome email: {Email}", userEmail);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send welcome email to {Email} for user {UserName}. Email delivery may be delayed.", userEmail, userFirstName);
        }
    }

    private async Task SendAccountDeletionEmailWithScopedServices(string userEmail, string userFirstName, bool isBusiness, bool isCurrentUser, bool isTeamDeleted, IEmailService emailService)
    {
        try
        {
            if (isCurrentUser)
            {
                await emailService.SendAccountDeletionByUserEmailAsync(userEmail, userFirstName, isBusiness, isTeamDeleted);
                _logger.LogInformation("Account deletion (by user) email sent successfully to {Email} for user {UserName}", userEmail, userFirstName);
            }
            else
            {
                await emailService.SendAccountDeletionByAdminEmailAsync(userEmail, userFirstName, isBusiness, isTeamDeleted);
                _logger.LogInformation("Account deletion (by admin) email sent successfully to {Email} for user {UserName}", userEmail, userFirstName);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send account deletion email to {Email} for user {UserName}. Email delivery may be delayed.", userEmail, userFirstName);
        }
    }

    public async Task<ResponseBase> DeleteAsync(long id)
    {
        var response = new ResponseBase();

        try
        {
            if (!_currentUser.IsAdmin)
            {
                _logger.LogError("Access denied: Only admin users can delete users");
                throw new UnauthorizedAccessException("Only admin users can delete users");
            }
            
            var (isTeamDeleted, deletedUserInfo) = await _users.DeleteAsync(id);
            if (deletedUserInfo.Any())
            {
                var deletedUsersWithEmail = deletedUserInfo.Where(u => !string.IsNullOrWhiteSpace(u.Email)).ToList();
                if (deletedUsersWithEmail.Any())
                {
                    var currentUserId = _currentUser.UserId;
                    
                    // Fire and forget background operations for sending deletion emails
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            using var scope = _serviceScopeFactory.CreateScope();
                            var scopedEmailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                            
                            foreach (var deletedUser in deletedUsersWithEmail)
                            {
                                await SendAccountDeletionEmailWithScopedServices(
                                    deletedUser.Email,
                                    deletedUser.DisplayName,
                                    deletedUser.IsBusiness,
                                    deletedUser.UserId == currentUserId,
                                    isTeamDeleted,
                                    scopedEmailService);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Background processing failed for sending deletion emails. Deleted users: {@DeletedUserInfo}", deletedUsersWithEmail);
                        }
                    });
                }
                _logger.LogInformation("Deleted user(s) information: {@DeletedUserInfo}", deletedUserInfo);
            }
            else
            {
                _logger.LogWarning("No user information found for deletion with id {UserId}", id);
            }
        }
        catch (Exception ex)
        {
            var message = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Failed to delete user with id {UserId}. Error: {ErrorMessage}", id, message);
            response.Success = false;
            response.Message = $"Failed to delete user: {message}";
            return response;
        }

        _logger.LogInformation("User with id {UserId} deleted successfully", id);
            
        response.Success = true;
        response.Message = "Account deleted successfully";
        return response;
    }

    public async Task<DataResponse<UserResponse>> GetByIdAsync(long id)
    {
        var response = new DataResponse<UserResponse>();
        
        var user = await _users.GetAsync(id);
        if (user == null)
        {
            response.Success = false;
            response.Message = $"User with id {id} not found";
            return response;
        }

        if (user.TeamId != _currentUser.TeamId)
        {
            response.Success = false;
            response.Message = "Access denied: You can only view users from your own team";
            return response;
        }

        response.Data = user.ToDto();
        response.Success = true;
        return response;
    }

    public async Task<DataResponse<UserResponse>> UpdateAsync(UserUpdateRequest request)
    {
        if (!_currentUser.IsAdmin && _currentUser.UserId != request.Id)
        {
            _logger.LogError("Access denied: Only admin users can update users");
            throw new UnauthorizedAccessException("Only admin users can update other users");
        }

        var response = new DataResponse<UserResponse>();

        var user = await _userManager.FindByIdAsync(request.Id.ToString());
        if (user == null)
        {
            response.Success = false;
            response.Message = $"User with id {request.Id} not found";
            return response;
        }

        if (user.TeamId != _currentUser.TeamId)
        {
            response.Success = false;
            response.Message = "Access denied: You can only update users from your own team";
            return response;
        }

        // TODO: temp for test users
        // Fix missing SecurityStamp for users created outside UserManager
        if (string.IsNullOrEmpty(user.SecurityStamp))
        {
            user.SecurityStamp = Guid.NewGuid().ToString();
            await _userManager.UpdateAsync(user);
        }

        // Track if security-sensitive changes are made
        bool securityChanged = false;

        // Update basic properties (non-security sensitive)
        if (!string.IsNullOrWhiteSpace(request.FirstName))
            user.FirstName = request.FirstName.Trim();
        if (!string.IsNullOrWhiteSpace(request.LastName))
            user.LastName = request.LastName.Trim();
        if (!string.IsNullOrWhiteSpace(request.MiddleName))
            user.MiddleName = request.MiddleName?.Trim();
        if (!string.IsNullOrWhiteSpace(request.Salutation))
            user.Salutation = request.Salutation?.Trim();

        // Handle AvatarUri update
        if (request.AvatarUri != null)
            user.AvatarUri = request.AvatarUri;
        
        user.IsAdmin = request.IsAdmin;
        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        user.UpdatedBy = _currentUser.UserId;

        // Handle username change (security-sensitive)
        if (!string.IsNullOrWhiteSpace(request.UserName) && request.UserName != user.UserName)
        {
            var setUserNameResult = await _userManager.SetUserNameAsync(user, request.UserName);
            if (!setUserNameResult.Succeeded)
            {
                response.Success = false;
                response.Message = string.Join(", ", setUserNameResult.Errors.Select(e => e.Description));
                return response;
            }
            securityChanged = true;
        }

        // Handle email change (security-sensitive)
        if (!string.IsNullOrWhiteSpace(request.Email) && request.Email.Trim() != user.Email)
        {
            var setEmailResult = await _userManager.SetEmailAsync(user, request.Email.Trim());
            if (!setEmailResult.Succeeded)
            {
                response.Success = false;
                response.Message = string.Join(", ", setEmailResult.Errors.Select(e => e.Description));
                return response;
            }
            securityChanged = true;
        }

        // Handle password change (security-sensitive)
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            // Ensure SecurityStamp is set before generating token
            if (string.IsNullOrEmpty(user.SecurityStamp))
            {
                await _userManager.UpdateSecurityStampAsync(user);
            }
            
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resetResult = await _userManager.ResetPasswordAsync(user, token, request.Password);
            if (!resetResult.Succeeded)
            {
                response.Success = false;
                response.Message = string.Join(", ", resetResult.Errors.Select(e => e.Description));
                return response;
            }
            securityChanged = true;
        }

        // Update the user (this will handle SecurityStamp automatically if needed)
        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            response.Success = false;
            response.Message = string.Join(", ", updateResult.Errors.Select(e => e.Description));
            return response;
        }

        // If security-sensitive changes were made, explicitly update SecurityStamp
        if (securityChanged)
        {
            await _userManager.UpdateSecurityStampAsync(user);
        }

        response.Data = user.ToDto();
        response.Success = true;
        response.Message = "User updated successfully";
        return response;
    }

    public async Task<DataResponse<List<UserNotificationPreferenceResponse>>> GetNotificationPreferencesAsync()
    {
        var response = new DataResponse<List<UserNotificationPreferenceResponse>>();

        try
        {
            var user = await _users.GetAsync(_currentUser.UserId);
            if (user == null)
            {
                response.Success = false;
                response.Message = "User not found";
                return response;
            }

            var preferences = await _users.GetNotificationPreferencesAsync(user.Id);
            response.Data = preferences.ToDto();
            response.Success = true;
            response.Message = "Notification preferences retrieved successfully";
            return response;
        }
        catch (Exception ex)
        {
            response.Success = false;
            response.Message = $"Error retrieving notification preferences: {ex.Message}";
            return response;
        }
    }

    public async Task<ResponseBase> UpdateNotificationPreferenceAsync(long preferenceId, bool isEnabled)
    {
        var response = new ResponseBase();

        try
        {
            var preference = await _users.GetNotificationPreferenceAsync(preferenceId);
            if (preference == null)
            {
                response.Success = false;
                response.Message = "Notification preference not found";
                return response;
            }

            if (preference.UserId != _currentUser.UserId)
            {
                response.Success = false;
                response.Message = "Access denied";
                return response;
            }

            preference.IsEnabled = isEnabled;
            await _users.UpdateNotificationPreferenceAsync(preference);

            response.Success = true;
            response.Message = "Notification preference updated successfully";
            return response;
        }
        catch (Exception ex)
        {
            response.Success = false;
            response.Message = $"Error updating notification preference: {ex.Message}";
            return response;
        }
    }

    public async Task<ResponseBase> UpdateNotificationPreferencesAsync(BulkNotificationPreferenceUpdateRequest request)
    {
        var response = new ResponseBase();

        try
        {
            if (request.Preferences == null || request.Preferences.Count == 0)
            {
                response.Success = false;
                response.Message = "No preferences provided to update";
                return response;
            }

            var preferencesToUpdate = new List<UserNotificationPreference>();
            
            foreach (var preferenceUpdate in request.Preferences)
            {
                var preference = await _users.GetNotificationPreferenceAsync(preferenceUpdate.Id);
                if (preference == null)
                {
                    response.Success = false;
                    response.Message = $"Notification preference with ID {preferenceUpdate.Id} not found";
                    return response;
                }

                if (preference.UserId != _currentUser.UserId)
                {
                    response.Success = false;
                    response.Message = "Access denied";
                    return response;
                }

                preference.IsEnabled = preferenceUpdate.IsEnabled;
                preferencesToUpdate.Add(preference);
            }

            await _users.UpdateNotificationPreferencesAsync(preferencesToUpdate);

            response.Success = true;
            response.Message = $"Updated {preferencesToUpdate.Count} notification preferences successfully";
            return response;
        }
        catch (Exception ex)
        {
            response.Success = false;
            response.Message = $"Error updating notification preferences: {ex.Message}";
            return response;
        }
    }

    public async Task<DataResponse<List<UserNotificationPreferenceResponse>>> CreateNotificationPreferencesAsync(BulkNotificationPreferenceCreateRequest request)
    {
        var response = new DataResponse<List<UserNotificationPreferenceResponse>>();

        try
        {
            if (request.Preferences == null || request.Preferences.Count == 0)
            {
                response.Success = false;
                response.Message = "No preferences provided to update";
                return response;
            }

            var newPreferences = new List<UserNotificationPreference>();
            foreach (var preference in request.Preferences)
            {
                newPreferences.Add(new UserNotificationPreference
                {
                    UserId = _currentUser.UserId,
                    NotificationType = preference.NotificationType,
                    Channel = preference.Channel,
                    IsEnabled = preference.IsEnabled,
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }

            await _users.AddNotificationPreferencesAsync(newPreferences);

            response.Success = true;
            response.Data = newPreferences.Select(p => new UserNotificationPreferenceResponse
            {
                Id = p.Id,
                UserId = p.UserId,
                NotificationType = p.NotificationType,
                Channel = p.Channel,
                IsEnabled = p.IsEnabled,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            }).ToList();
            return response;
        }
        catch (Exception ex)
        {
            response.Success = false;
            response.Message = $"Error creating notification preferences: {ex.Message}";
            return response;
        }
    }

    public Task<DataResponse<long>> GetCurrentUserTeamIdAsync()
    {
        var response = new DataResponse<long>();

        try
        {
            response.Data = _currentUser.TeamId;
            response.Success = true;
            response.Message = "Team ID retrieved successfully";
            return Task.FromResult(response);
        }
        catch (Exception ex)
        {
            response.Success = false;
            response.Message = $"Error retrieving team ID: {ex.Message}";
            return Task.FromResult(response);
        }
    }

    public async Task<bool> IsLastTeamAdmin()
    {
        var adminCount = await _users.AdminCount(_currentUser.TeamId);
        return adminCount == 1 && _currentUser.IsAdmin;
    }
}
