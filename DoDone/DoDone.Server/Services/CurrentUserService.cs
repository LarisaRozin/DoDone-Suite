/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using System.Security.Claims;
using DoDone.Db.Repositories;

namespace DoDone.Server.Services;

public interface ICurrentUserService
{
    long UserId { get; }
    string UserName { get; }
    string FirstName { get; }
    string LastName { get; }
    long TeamId { get; }
    bool IsAdmin { get; }
    string Email { get; }
    bool IsAuthenticated { get; }
    Task<string> GetTimezoneAsync();
}

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IUserDevicesRepository _userDevicesRepository;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor, IUserDevicesRepository userDevicesRepository)
    {
        _httpContextAccessor = httpContextAccessor;
        _userDevicesRepository = userDevicesRepository;
    }

    public long UserId => GetUserId();
    public string UserName => GetUserName();
    public long TeamId => GetTeamId();
    public bool IsAdmin => GetIsAdmin();
    public string Email => GetEmail();
    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

    public string FirstName => _httpContextAccessor.HttpContext?.User?.FindFirst("FirstName")?.Value ?? string.Empty;

    public string LastName => _httpContextAccessor.HttpContext?.User?.FindFirst("LastName")?.Value ?? string.Empty;

    public async Task<string> GetTimezoneAsync() => await _userDevicesRepository.GetUserTimezoneAsync(UserId);

    private long GetUserId()
    {
        var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    private string GetUserName()
    {
        return _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value ?? string.Empty;
    }

    private long GetTeamId()
    {
        var teamIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("TeamId")?.Value;
        return long.TryParse(teamIdClaim, out var teamId) ? teamId : 0;
    }

    private bool GetIsAdmin()
    {
        var isAdminClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("IsAdmin")?.Value;
        return bool.TryParse(isAdminClaim, out var isAdmin) && isAdmin;
    }

    private string GetEmail()
    {
        return _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty;
    }
}
