/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Server.Services;

public interface IAuthorizationService
{
    Task<bool> CanCreateUserAsync();
    Task<bool> CanDeleteUserAsync();
    Task<bool> CanViewTeamAsync();
    Task<bool> CanUpdateUserAsync(long targetUserId);
    Task<bool> CanChangeAdminStatusAsync();
}

public class AuthorizationService : IAuthorizationService
{
    private readonly ICurrentUserService _currentUser;

    public AuthorizationService(ICurrentUserService currentUser)
    {
        _currentUser = currentUser;
    }

    public Task<bool> CanCreateUserAsync()
    {
        return Task.FromResult(_currentUser.IsAdmin);
    }

    public Task<bool> CanDeleteUserAsync()
    {
        return Task.FromResult(_currentUser.IsAdmin);
    }

    public Task<bool> CanViewTeamAsync()
    {
        return Task.FromResult(_currentUser.IsAdmin);
    }

    public Task<bool> CanUpdateUserAsync(long targetUserId)
    {
        // Can update own profile or admin can update anyone
        return Task.FromResult(_currentUser.UserId == targetUserId || _currentUser.IsAdmin);
    }

    public Task<bool> CanChangeAdminStatusAsync()
    {
        return Task.FromResult(_currentUser.IsAdmin);
    }
}
