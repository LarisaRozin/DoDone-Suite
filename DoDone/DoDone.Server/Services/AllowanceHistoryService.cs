/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Db.Repositories;
using DoDone.Shared.Abstractions;
using DoDone.Server.Dtos;
using DoDone.Server.Dtos.Common;
using DoDone.Server.Extensions;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Server.Services;

public interface IAllowanceHistoryService
{
    Task<AllowanceHistory?> GetCurrentAsync(User user, TeamAllowanceInterval interval, long currentUserId);
    Task UpdateCurrentAsync(TeamAllowanceInterval interval, long currentUserId);
    Task<List<CurrentInterval>> GetCurrentIntervalsAsync(List<TeamAllowanceInterval> intervals, long currentUserId);

    Task<AllowanceHistory> UpdateAsync(AllowanceHistory updatedAllowanceHistory, List<TaskItem>? updatedTaskItems = null);
    Task<PagedListResponse<Dtos.AllowanceHistoryResponse>> GetPagedAllowanceHistoriesAsync(PagedAllowanceHistoriesListRequest request);
    Task<PagedListResponse<Dtos.AllowanceHistoryTaskItemResponse>> GetPagedAllowanceHistoryTaskItemsAsync(PagedAllowanceHistoryTaskItemsListRequest request);

    Task<AllowanceHistoryResponse> ApproveUserAllowanceAsync(AllowanceHistoryApprovalRequest request);
    Task<AllowanceHistoryResponse> ClaimUserAllowanceAsync(AllowanceHistoryClaimRequest request);
    Task<List<long>> GetCurrentIntervalUsersAsync(long id);
    // Task<List<AllowanceHistory>> GetCurrentIntervalHistoriesAsync(long intervalId);
    Task<long> GetEndedIntervalsForGradeResetCountAsync();
    Task<List<long>> GetEndedIntervalsForGradeResetBatchAsync(int skip, int take);
    Task GradeResetCompletedAsync(List<long> batch);
}

public class AllowanceHistoryService : IAllowanceHistoryService
{
    private const int MaxRetries = 3; // Maximum retry attempts for concurrency conflicts
    private readonly IAllowanceHistoryRepository _allowanceHistoryRepository;
    private readonly IAllowanceHistoryTaskItemRepository _allowanceHistoryTaskItemRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUserDevicesRepository _userDevicesRepository;
    private readonly IRecurringDateService _recurringDateService;
    private readonly ISubscriptionService _subscriptionService;
    private readonly ITeamRepository _teamRepository;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<AllowanceHistoryService> _logger;
    private readonly IServiceScopeFactory _serviceScopeFactory;

    public AllowanceHistoryService(IAllowanceHistoryRepository allowanceHistoryRepository,
                                   IAllowanceHistoryTaskItemRepository allowanceHistoryTaskItemRepository,
                                   ICurrentUserService currentUserService,
                                   IUserDevicesRepository userDevicesRepository,
                                   IRecurringDateService recurringDateService,
                                   ISubscriptionService subscriptionService,
                                   ITeamRepository teamRepository,
                                   IDateTimeProvider dateTimeProvider,
                                   ILogger<AllowanceHistoryService> logger,
                                   IServiceScopeFactory serviceScopeFactory)
    {
        _allowanceHistoryRepository = allowanceHistoryRepository;
        _allowanceHistoryTaskItemRepository = allowanceHistoryTaskItemRepository;
        _currentUserService = currentUserService;
        _userDevicesRepository = userDevicesRepository;
        _recurringDateService = recurringDateService;
        _subscriptionService = subscriptionService;
        _teamRepository = teamRepository;
        _dateTimeProvider = dateTimeProvider;
        _logger = logger;
        _serviceScopeFactory = serviceScopeFactory;
    }

    /// <summary>
    /// Attempts to create an allowance history, handling race conditions where multiple
    /// concurrent operations try to create histories for the same user/interval.
    /// </summary>
    private async Task<AllowanceHistory> GetOrCreateAllowanceHistoryAsync(User user, TeamAllowanceInterval interval, DateTimeOffset startAt, DateTimeOffset endAt)
    {
        try
        {
            // Try to create the allowance history
            var allowanceHistory = await _allowanceHistoryRepository.CreateIntervalHistory(user, interval, startAt, endAt);
            return allowanceHistory;
        }
        catch (Exception ex) when (ex.Message.Contains("duplicate") || ex.Message.Contains("unique") || ex.Message.Contains("constraint"))
        {
            // Race condition occurred - another thread created the history
            _logger.LogWarning("Race condition detected while creating allowance history for user {UserId} and interval {IntervalId}. Retrieving existing history.", user.Id, interval.Id);
            
            // Re-query to get the existing history that was created by the concurrent operation
            var allCurrent = await _allowanceHistoryRepository.GetCurrent(user, interval);
            if (allCurrent != null && allCurrent.Count > 0)
            {
                var unapprovedCurrent = allCurrent.Where(x => x.ApprovedAt == null).ToList();
                if (unapprovedCurrent.Count > 0)
                {
                    return unapprovedCurrent.OrderBy(h => h.CreatedAt).First();
                }
            }
            
            // If we still can't find the history, rethrow the original exception
            _logger.LogError(ex, "Failed to create or retrieve allowance history for user {UserId} and interval {IntervalId} after race condition.", user.Id, interval.Id);
            throw;
        }
    }

    private async Task<string> GetTimezone(long userId, long curentUserId)
    {
        var timezone = await _userDevicesRepository.GetUserTimezoneAsync(userId);
        if (string.IsNullOrWhiteSpace(timezone))
            timezone = await _userDevicesRepository.GetUserTimezoneAsync(curentUserId);
        if (string.IsNullOrWhiteSpace(timezone))
            timezone = "UTC";
        return timezone;
    }

    public async Task<AllowanceHistory?> GetCurrentAsync(User user, TeamAllowanceInterval interval, long currentUserId)
    {
        if (interval.MaxAllowanceAmount <= 0)
        {
            _logger.LogInformation("Allowance calculation is disabled for user {UserId} interval {IntervalId}", user.Id, interval.Id);
            return null;
        }

        var allCurrent = await _allowanceHistoryRepository.GetCurrent(user, interval);
        if (allCurrent == null || allCurrent.Count == 0)
        {
            string timezone = await GetTimezone(user.Id, currentUserId);

            (DateTimeOffset calculatedStartAt, DateTimeOffset calculatedEndAt) = _recurringDateService.GetCurrentIntervalDates(interval, timezone);

            var allowanceHistory = await GetOrCreateAllowanceHistoryAsync(user, interval, calculatedStartAt, calculatedEndAt);
            return allowanceHistory;
        }
        else
        {
            var unapprovedCurrent = allCurrent.Where(x => x.ApprovedAt == null).ToList();
            var approvedCurrent = allCurrent.Where(x => x.ApprovedAt != null).ToList();

            if (unapprovedCurrent.Count > 1)
            {
                _logger.LogWarning("Multiple unapproved allowance histories found for user {UserId} and interval {IntervalId}. This may be due to race conditions during high load. Using the earliest one.", user.Id, interval.Id);
                // Under high load, race conditions can create multiple unapproved histories
                // Return the earliest one to continue processing
                return unapprovedCurrent.OrderBy(h => h.CreatedAt).First();
            }
            else if (unapprovedCurrent.Count == 1)
            {
                return unapprovedCurrent[0];
            }
            else  // (unapprovedCurrent.Count <= 0)  // current allowance history exists, but it's allready been approved
            {
                // if unapproved count is 0 and allCurrent.Count > 0, then approved count must be at least 1
                if (approvedCurrent.Count == 1)
                {
                    var lastApproved = approvedCurrent[0];
                    (DateTimeOffset calculatedStartAt, DateTimeOffset calculatedEndAt) = _recurringDateService.GetNextIntervalDates(interval, lastApproved.CalculatedEndAt);

                    // approved allowance should no longer be recalculated, create a new one
                    var allowanceHistory = await GetOrCreateAllowanceHistoryAsync(user, interval, calculatedStartAt, calculatedEndAt);
                    return allowanceHistory;
                }
                else  // approvedCurrent.Count > 1     
                {
                    _logger.LogError("Multiple approved allowance histories found for user {UserId} and interval {IntervalId}.", user.Id, interval.Id);
                    throw new InvalidOperationException($"Multiple approved allowance histories found for user {user.Id} and interval {interval.Id}.");
                }
            }
        }        
    }

    public async Task UpdateCurrentAsync(TeamAllowanceInterval interval, long currentUserId)
    {
        var allUnapprovedCurrent = await _allowanceHistoryRepository.GetAllUnapprovedCurrent(interval);
        if (allUnapprovedCurrent == null || allUnapprovedCurrent.Count == 0)
        {
            return;
        }

        foreach (var unapprovedCurrent in allUnapprovedCurrent)
        {
            var timezone = await GetTimezone(unapprovedCurrent.UserId, currentUserId);
            (DateTimeOffset calculatedStartAt, DateTimeOffset calculatedEndAt) = _recurringDateService.GetCurrentIntervalDates(interval, timezone);

            unapprovedCurrent.AllowanceIntervalType = interval.IntervalType;
            unapprovedCurrent.AllowanceIntervalValue = interval.IntervalValue;
            unapprovedCurrent.StartDayOfWeek = interval.StartDayOfWeek;
            unapprovedCurrent.CalculatedStartAt = calculatedStartAt;
            unapprovedCurrent.CalculatedEndAt = calculatedEndAt;
            unapprovedCurrent.UpdatedBy = currentUserId;
            unapprovedCurrent.UpdatedAt = _dateTimeProvider.UtcNow;
            await _allowanceHistoryRepository.UpdateAsync(unapprovedCurrent);
        }
    }

    public async Task<List<CurrentInterval>> GetCurrentIntervalsAsync(List<TeamAllowanceInterval> intervals, long currentUserId)
    {
        var result = new List<CurrentInterval>();

        if (intervals == null || intervals.Count == 0)
        {
            return result;
        }

        var timezone = await _userDevicesRepository.GetUserTimezoneAsync(currentUserId);
        if (string.IsNullOrWhiteSpace(timezone))
            timezone = "UTC";

        foreach (var interval in intervals.Where(i => i.IsActive))
        {
            (DateTimeOffset calculatedStartAt, DateTimeOffset calculatedEndAt) = _recurringDateService.GetCurrentIntervalDates(interval, timezone);

            string DisplayName = GetIntervalDisplayName(timezone, interval);

            result.Add(new CurrentInterval
            {
                CalculatedStartAt = calculatedStartAt,
                CalculatedEndAt = calculatedEndAt,
                IntervalType = interval.IntervalType,
                IntervalValue = interval.IntervalValue,
                StartDayOfWeek = interval.StartDayOfWeek,
                DisplayName = DisplayName,
                // StartMonthOfYear = interval.StartMonthOfYear,
                TeamAllowanceInterval = interval
            });
        }

        return result;
    }

    private string GetIntervalDisplayName(string timezone, TeamAllowanceInterval interval)
    {
        var DisplayName = interval.Name.Trim();
        if (interval.IntervalType == Shared.Enums.AllowanceIntervalType.SchoolYear)
        {
            // Find current grading period using the same logic as RecurringDateService
            // but in the user's timezone before UTC conversion
            var tzi = timezone == "UTC" ? null : TimeZoneInfo.FindSystemTimeZoneById(timezone);
            DateTime localNow = timezone == "UTC" ? _dateTimeProvider.UtcNow.DateTime : TimeZoneInfo.ConvertTimeFromUtc(_dateTimeProvider.UtcNow.DateTime, tzi!);
            var currentDate = new DateTime(localNow.Year, localNow.Month, localNow.Day);

            var currentGradingPeriod = interval.GradingPeriods.Where(x =>
            {
                var gradingPeriodStart = new DateTime(localNow.Year, (int)x.StartMonth, x.StartDay);
                var gradingPeriodEnd = new DateTime(localNow.Year, (int)x.EndMonth, x.EndDay);

                // Handle year wraparound cases (e.g., Dec 20 - Jan 5)
                if (gradingPeriodEnd < gradingPeriodStart)
                {
                    // Grading Period wraps around the year
                    return currentDate >= gradingPeriodStart || currentDate <= gradingPeriodEnd;
                }
                else
                {
                    // Normal case within the same year
                    return currentDate >= gradingPeriodStart && currentDate <= gradingPeriodEnd;
                }
            }).FirstOrDefault();

            if (currentGradingPeriod != null && !string.IsNullOrWhiteSpace(currentGradingPeriod.Name))
            {
                DisplayName = DisplayName + ": " + currentGradingPeriod.Name.Trim();
            }
        }

        return DisplayName;
    }

    public async Task<PagedListResponse<Dtos.AllowanceHistoryResponse>> GetPagedAllowanceHistoriesAsync(PagedAllowanceHistoriesListRequest request)
    {
        try
        {
            var query = _allowanceHistoryRepository.GetBaseQuery(request.TeamId, request.UserId);

            var subscriptionLimits = await _subscriptionService.GetSubscriptionLimits();
            if (!subscriptionLimits.AllowanceIntervalsLimit.CanAdd && subscriptionLimits.AllowanceIntervalsLimit.Max > 0)
            {
                var teamAllowanceIntervals = await _teamRepository.GetTeamAllowanceIntervalsAsync(request.TeamId);
                var teamIntervalIds = teamAllowanceIntervals.Select(ti => ti.Id).Take(subscriptionLimits.AllowanceIntervalsLimit.Max).ToList();
                query = query.Where(ah => teamIntervalIds.Contains(ah.TeamAllowanceIntervalId));

                var teamMembers = await _teamRepository.GetTeamMembersAsync(request.TeamId);
                var allowedUserIds = teamMembers
                    .OrderBy(tm => tm.Id == _currentUserService.UserId ? 0 : 1) // ensure current user is included
                    .ThenBy(tm => tm.IsActive ? 0 : 1)
                    .ThenBy(tm => tm.FirstName)
                    .ThenBy(tm => tm.LastName)
                    .Take(subscriptionLimits.TeamMembersLimit.Max)
                    .Select(tm => tm.Id)
                    .ToList();
                query = query.Where(ah => allowedUserIds.Contains(ah.UserId));
            }

            var histories = await query
                .OrderByDescending(h => h.CalculatedEndAt)
                .Skip(request.Paging.Skip)
                .Take(request.Paging.Take)
                .ToListAsync();

            var timezone = await _userDevicesRepository.GetUserTimezoneAsync(_currentUserService.UserId);
            if (string.IsNullOrWhiteSpace(timezone))
                timezone = "UTC";

            var allowanceHistories = histories.ToDtoList();
            foreach (var history in allowanceHistories)
            {
                if (history.AllowanceIntervalType == Shared.Enums.AllowanceIntervalType.SchoolYear)
                {
                    var interval = histories.FirstOrDefault(h => h.Id == history.Id)?.AllowanceInterval;
                    if (interval != null)
                    {
                        history.TeamAllowanceIntervalName = GetIntervalDisplayName(timezone, interval);
                    }
                }
            }

            var pagingInfo = new PagingInfo
            {
                CurrentPage = request.Paging.Page,
                PageSize = request.Paging.ValidatedPageSize,
                TotalItems = await query.CountAsync()
            };

            return PagedListResponse<Dtos.AllowanceHistoryResponse>.CreateSuccess(allowanceHistories, pagingInfo);
        }
        catch (Exception ex)
        {
            var message = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Error occurred while getting paged allowance histories: {request}");
            return PagedListResponse<Dtos.AllowanceHistoryResponse>.CreateFailure($"Failed to get paged allowance histories: {message}");
        }
    }

    public async Task<PagedListResponse<Dtos.AllowanceHistoryTaskItemResponse>> GetPagedAllowanceHistoryTaskItemsAsync(PagedAllowanceHistoryTaskItemsListRequest request)
    {
        try
        {
            var query = _allowanceHistoryTaskItemRepository.GetBaseQuery(request.AllowanceHistoryId);

            var taskItems = await query
                .OrderByDescending(ti => ti.CreatedAt)
                .Skip(request.Paging.Skip)
                .Take(request.Paging.Take)
                .ToListAsync();

            var pagingInfo = new PagingInfo
            {
                CurrentPage = request.Paging.Page,
                PageSize = request.Paging.ValidatedPageSize,
                TotalItems = await query.CountAsync()
            };

            return PagedListResponse<Dtos.AllowanceHistoryTaskItemResponse>.CreateSuccess(taskItems.ToDtoList(), pagingInfo);
        }
        catch (Exception ex)
        {
            var message = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Error occurred while getting paged allowance history task items: {request}");
            return PagedListResponse<Dtos.AllowanceHistoryTaskItemResponse>.CreateFailure($"Failed to get paged allowance history task items: {message}");
        }
    }

    public async Task<AllowanceHistoryResponse> ApproveUserAllowanceAsync(AllowanceHistoryApprovalRequest request)
    {
        var approverId = _currentUserService.UserId;

        if (!_currentUserService.IsAdmin)
        {
            throw new UnauthorizedAccessException("You don't have permission to approve allowances");
        }

        // Use optimistic concurrency with retry - EF handles RowVersion automatically
        for (int attempt = 0; attempt < MaxRetries; attempt++)
        {
            try
            {
                var allowanceHistory = await _allowanceHistoryRepository.GetByIdAsync(request.Id);
                if (allowanceHistory == null)
                {
                    throw new ArgumentException($"AllowanceHistory with ID {request.Id} not found");
                }

                allowanceHistory.ApprovedAmount = request.ApprovedAmount;
                allowanceHistory.Comment = request.Comment;
                allowanceHistory.ApprovedAt = _dateTimeProvider.UtcNow;
                allowanceHistory.ApprovedBy = approverId;
                allowanceHistory.UpdatedAt = _dateTimeProvider.UtcNow;
                allowanceHistory.UpdatedBy = approverId;

                await _allowanceHistoryRepository.UpdateAsync(allowanceHistory); // refetch with includes
                allowanceHistory = await _allowanceHistoryRepository.GetByIdAsync(request.Id);
                if (allowanceHistory == null)
                {
                    throw new ArgumentException($"AllowanceHistory with ID {request.Id} not found");
                }

                // Fire and forget background operations - don't await these
                var teamId = allowanceHistory.TeamId;
                var allowanceHistoryId = allowanceHistory.Id;
                var approvedAmount = allowanceHistory.ApprovedAmount;
                
                // Clone allowance history object to avoid reference issues with disposed contexts
                var allowanceHistoryForBackground = new AllowanceHistory
                {
                    Id = allowanceHistory.Id,
                    UserId = allowanceHistory.UserId,
                    TeamId = allowanceHistory.TeamId,
                    TeamAllowanceIntervalId = allowanceHistory.TeamAllowanceIntervalId,
                    ApprovedAmount = allowanceHistory.ApprovedAmount,
                    Comment = allowanceHistory.Comment,
                    ApprovedAt = allowanceHistory.ApprovedAt,
                    ApprovedBy = allowanceHistory.ApprovedBy,
                    ClaimedAt = allowanceHistory.ClaimedAt,
                    CreatedAt = allowanceHistory.CreatedAt,
                    CreatedBy = allowanceHistory.CreatedBy,
                    UpdatedAt = allowanceHistory.UpdatedAt,
                    UpdatedBy = allowanceHistory.UpdatedBy,
                    CalculatedStartAt = allowanceHistory.CalculatedStartAt,
                    CalculatedEndAt = allowanceHistory.CalculatedEndAt,
                    ApprovedByUser = new User
                    {
                        FirstName = allowanceHistory.ApprovedByUser?.FirstName ?? string.Empty,
                        LastName = allowanceHistory.ApprovedByUser?.LastName ?? string.Empty,
                    },
                    User = new User
                    {
                        FirstName = allowanceHistory.User?.FirstName ?? string.Empty,
                        LastName = allowanceHistory.User?.LastName ?? string.Empty,
                    },
                    AllowanceInterval = new TeamAllowanceInterval
                    {
                        Name = allowanceHistory.AllowanceInterval?.Name ?? string.Empty,
                    }
                };
                
                _ = Task.Run(async () =>
                {
                    try
                    {
                        using var scope = _serviceScopeFactory.CreateScope();
                        var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                        var scopedTeamRepository = scope.ServiceProvider.GetRequiredService<ITeamRepository>();
                        
                        bool isBusiness = await scopedTeamRepository.IsBusiness(teamId);
                        if (approvedAmount > 0)
                        {
                            await scopedNotificationService.SendAllowanceApprovedNotificationAsync(allowanceHistoryForBackground, isBusiness, approverId);
                        }
                        else
                        {
                            await scopedNotificationService.SendAllowanceRejectedNotificationAsync(allowanceHistoryForBackground, isBusiness, approverId);
                        }
                        _logger.LogInformation("Successfully sent allowance approval notification for allowance history {AllowanceHistoryId}", allowanceHistoryId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Background notification processing failed for ApproveUserAllowanceAsync, allowance history ID {AllowanceHistoryId}", allowanceHistoryId);
                    }
                });

                return allowanceHistory.ToDto();
            }
            catch (DbUpdateConcurrencyException ex) when (attempt < MaxRetries - 1)
            {
                _logger.LogWarning("Concurrency conflict approving allowance history {Id}, attempt {Attempt}/{MaxRetries}: {Error}",
                    request.Id, attempt + 1, MaxRetries, ex.Message);

                // Brief delay before retry
                await Task.Delay(TimeSpan.FromMilliseconds(100 * (attempt + 1)));
            }
        }

        throw new InvalidOperationException("Failed to approve allowance history after multiple attempts due to concurrency conflicts");
    }

    public async Task<AllowanceHistoryResponse> ClaimUserAllowanceAsync(AllowanceHistoryClaimRequest request)
    {
        for (int attempt = 0; attempt < MaxRetries; attempt++)
        {
            try
            {
                var allowanceHistory = await _allowanceHistoryRepository.GetByIdAsync(request.Id);
                if (allowanceHistory == null)
                {
                    throw new ArgumentException($"AllowanceHistory with ID {request.Id} not found");
                }
                allowanceHistory.ClaimedAt = _dateTimeProvider.UtcNow;
                allowanceHistory.UpdatedAt = _dateTimeProvider.UtcNow;
                allowanceHistory.UpdatedBy = _currentUserService.UserId;

                await _allowanceHistoryRepository.UpdateAsync(allowanceHistory);

                // Fire and forget background operations - don't await these
                var teamId = allowanceHistory.TeamId;
                var allowanceHistoryId = allowanceHistory.Id;
                var currentUserId = _currentUserService.UserId;
                
                // Clone allowance history object to avoid reference issues with disposed contexts
                var allowanceHistoryForBackground = new AllowanceHistory
                {
                    Id = allowanceHistory.Id,
                    UserId = allowanceHistory.UserId,
                    TeamId = allowanceHistory.TeamId,
                    TeamAllowanceIntervalId = allowanceHistory.TeamAllowanceIntervalId,
                    ApprovedAmount = allowanceHistory.ApprovedAmount,
                    Comment = allowanceHistory.Comment,
                    ApprovedAt = allowanceHistory.ApprovedAt,
                    ApprovedBy = allowanceHistory.ApprovedBy,
                    ClaimedAt = allowanceHistory.ClaimedAt,
                    CreatedAt = allowanceHistory.CreatedAt,
                    CreatedBy = allowanceHistory.CreatedBy,
                    UpdatedAt = allowanceHistory.UpdatedAt,
                    UpdatedBy = allowanceHistory.UpdatedBy,
                    CalculatedStartAt = allowanceHistory.CalculatedStartAt,
                    CalculatedEndAt = allowanceHistory.CalculatedEndAt,
                    User = new User
                    {
                        FirstName = allowanceHistory.User?.FirstName ?? string.Empty,
                        LastName = allowanceHistory.User?.LastName ?? string.Empty,
                    },
                };
                
                _ = Task.Run(async () =>
                {
                    try
                    {
                        using var scope = _serviceScopeFactory.CreateScope();
                        var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                        var scopedTeamRepository = scope.ServiceProvider.GetRequiredService<ITeamRepository>();
                        
                        bool isBusiness = await scopedTeamRepository.IsBusiness(teamId);
                        await scopedNotificationService.SendAllowanceClaimedNotificationAsync(allowanceHistoryForBackground, isBusiness, currentUserId);
                        _logger.LogInformation("Successfully sent allowance claimed notification for allowance history {AllowanceHistoryId}", allowanceHistoryId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Background notification processing failed for ClaimUserAllowanceAsync, allowance history ID {AllowanceHistoryId}", allowanceHistoryId);
                    }
                });

                return allowanceHistory.ToDto();
            }
            catch (DbUpdateConcurrencyException ex) when (attempt < MaxRetries - 1)
            {
                _logger.LogWarning("Concurrency conflict claiming allowance history {Id}, attempt {Attempt}/{MaxRetries}: {Error}",
                    request.Id, attempt + 1, MaxRetries, ex.Message);

                // Brief delay before retry
                await Task.Delay(TimeSpan.FromMilliseconds(100 * (attempt + 1)));
            }
        }

        throw new InvalidOperationException("Failed to claim allowance history after multiple attempts due to concurrency conflicts");
    }

    // public Task DeleteAsync(long id)
    // {
    //     return _allowanceHistoryRepository.DeleteAsync(id);
    // }

    // public async Task<AllowanceHistory> GetAsync(long id)
    // {
    //     var allowanceHistory = await _allowanceHistoryRepository.GetByIdAsync(id);
    //     if (allowanceHistory == null)
    //     {
    //         throw new ArgumentException($"AllowanceHistory with ID {id} not found");
    //     }
    //     return allowanceHistory;
    // }
    //     public async Task<AllowanceHistory> AddAsync(AllowanceHistory allowanceHistory)
    // {
    //     return await _allowanceHistoryRepository.AddAsync(allowanceHistory);
    // }

    public Task<AllowanceHistory> UpdateAsync(AllowanceHistory updatedAllowanceHistory, List<TaskItem>? updatedTaskItems = null)
    {
        return _allowanceHistoryRepository.UpdateAsync(updatedAllowanceHistory, updatedTaskItems);
    }

    public Task<List<long>> GetCurrentIntervalUsersAsync(long id)
    {
        return _allowanceHistoryRepository.GetCurrentIntervalUsersAsync(id);
    }


    // public Task<List<AllowanceHistory>> GetCurrentIntervalHistoriesAsync(long intervalId)
    // {
    //     return _allowanceHistoryRepository.GetCurrentIntervalHistoriesAsync(intervalId);
    // }

    public Task<long> GetEndedIntervalsForGradeResetCountAsync()
    {
        return _allowanceHistoryRepository.GetEndedIntervalsForGradeResetCountAsync();
    }

    public Task<List<long>> GetEndedIntervalsForGradeResetBatchAsync(int skip, int take)
    {
        return _allowanceHistoryRepository.GetEndedIntervalsForGradeResetBatchAsync(skip, take);
    }

    public Task GradeResetCompletedAsync(List<long> batch)
    {
        return _allowanceHistoryRepository.GradeResetCompletedAsync(batch);
    }
}
