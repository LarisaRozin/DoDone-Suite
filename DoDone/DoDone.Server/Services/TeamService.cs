/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Db.Repositories;
using DoDone.Server.Dtos;
using DoDone.Server.Dtos.Common;
using DoDone.Server.Extensions;
using DoDone.Server.Services.Common;
using DoDone.Shared;
using DoDone.Shared.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Server.Services;

public interface ITeamService
{
    Task<Team> GetTeamDetailsAsync(long? teamId = null);
    Task<bool> IsBusiness();
    Task<Team> UpdateAsync(TeamDetailsUpdateRequest request);
    Task<Team> CreateAsync(TeamDetailsCreateRequest request);

    Task<PagedListResponse<UserResponse>> GetTeamMembersAsync(PagedListRequest request);

    Task<TeamAllowanceInterval?> GetTeamAllowanceIntervalAsync(long intervalId);
    Task<List<TeamAllowanceInterval>> GetTeamAllowanceIntervalsAsync();
    Task<List<TeamAllowanceInterval>> GetTeamAllowanceIntervalsForEditAsync();

    // Task<TeamAllowanceInterval> CreateTeamAllowanceIntervalAsync(TeamAllowanceInterval interval);
    Task<TeamAllowanceInterval> CreateTeamAllowanceIntervalAsync(TeamAllowanceIntervalCreateRequest interval);
    Task<TeamAllowanceInterval> UpdateTeamAllowanceIntervalAsync(TeamAllowanceIntervalUpdateRequest interval);
    Task DeleteTeamAllowanceIntervalAsync(long intervalId);
}

public class TeamService : ITeamService
{
    private readonly ITeamRepository _teams;
    private readonly IUserRepository _users;
    private readonly IQueryableProcessorService _queryProcessor;
    private readonly IAllowanceCalculationService _allowanceCalculationService;
    private readonly ICurrentUserService _currentUser;
    private readonly ILexiconService _teamLexiconService;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<TeamService> _logger;
    private readonly IServiceScopeFactory _serviceScopeFactory;

    public TeamService(ITeamRepository teams
        , IUserRepository users
        , IQueryableProcessorService queryProcessor
        , IAllowanceCalculationService allowanceCalculationService
        , ICurrentUserService currentUser
        , ILexiconService teamLexiconService
        , IDateTimeProvider dateTimeProvider
        , ILogger<TeamService> logger
        , IServiceScopeFactory serviceScopeFactory)
    {
        _teams = teams;
        _users = users;
        _queryProcessor = queryProcessor;
        _allowanceCalculationService = allowanceCalculationService;
        _currentUser = currentUser;
        _teamLexiconService = teamLexiconService;
        _dateTimeProvider = dateTimeProvider;
        _logger = logger;
        _serviceScopeFactory = serviceScopeFactory;
    }

    public async Task<bool> IsBusiness()
    {
        return await _teams.IsBusiness(_currentUser.TeamId);
    }

    public async Task<Team> GetTeamDetailsAsync(long? teamId = null)
    {
        var team = await _teams.GetDetailsAsync(teamId ?? _currentUser.TeamId);
        if (team == null)
        {
            _logger.LogError("Team with id {TeamId} not found", teamId ?? _currentUser.TeamId);
            throw new KeyNotFoundException($"Team with id {teamId ?? _currentUser.TeamId} not found");
        }

        return team;
    }

    public async Task<Team> CreateAsync(TeamDetailsCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            _logger.LogError("Team name is required");
            throw new ArgumentException("Team name is required");
        }

        var team = new Team
        {
            Name = request.Name,
            Description = request.Description,
            IsBusiness = request.IsBusiness,
            CreatedAt = _dateTimeProvider.UtcNow,
        };

        await _teams.CreateAsync(team);

        return team;
    }

    public async Task<Team> UpdateAsync(TeamDetailsUpdateRequest request)
    {
        if (!_currentUser.IsAdmin)
        {
            _logger.LogError("Access denied: Only admin users can update team details");
            throw new UnauthorizedAccessException("Only admin users can update team details");
        }

        request.Id = _currentUser.TeamId;  // Admin user can only update their own team

        var team = await _teams.GetDetailsAsync(request.Id);
        if (team == null)
        {
            _logger.LogError("Team with id {TeamId} not found", request.Id);
            throw new KeyNotFoundException($"Team with id {request.Id} not found");
        }

        // Update team properties
        team.Name = request.Name;
        team.Description = request.Description;
        team.IsBusiness = request.IsBusiness;

        await _teams.UpdateAsync(team);

        return team;
    }

    public async Task<PagedListResponse<UserResponse>> GetTeamMembersAsync(PagedListRequest request)
    {
        try
        {
            // Get base query from repository for the current user's team
            var query = _users.GetTeamQueryable(_currentUser.TeamId);
            
            // Apply search term filter using QueryableProcessorService
            if (!string.IsNullOrWhiteSpace(request.Filtering.SearchTerm))
            {
                var searchTerm = request.Filtering.SearchTerm.ToLower();
                query = query.Where(u => (u.UserName != null && u.UserName.ToLower().Contains(searchTerm)) ||
                                        (u.FirstName != null && u.FirstName.ToLower().Contains(searchTerm)) ||
                                        (u.LastName != null && u.LastName.ToLower().Contains(searchTerm)) ||
                                        (u.Email != null && u.Email.ToLower().Contains(searchTerm)));
            }
            
            // Apply default sorting - by UserName
            query = query.OrderBy(u => u.UserName);
            
            // Get total count before paging
            var totalCount = await _queryProcessor.GetTotalCountAsync(query);
            
            // Apply paging using QueryableProcessorService
            query = _queryProcessor.ApplyPaging(query, request.Paging);
            
            // Execute query and map to DTOs
            var users = await query.ToListAsync();
            var userResponses = users.Select(u => u.ToDto()).ToList();

            var pagingInfo = new PagingInfo
            {
                CurrentPage = request.Paging.Page,
                PageSize = request.Paging.ValidatedPageSize,
                TotalItems = totalCount
            };

            return PagedListResponse<UserResponse>.CreateSuccess(userResponses, pagingInfo);
        }
        catch (Exception ex)
        {
            return PagedListResponse<UserResponse>.CreateFailure($"Error retrieving team users: {ex.Message}");
        }
    }

    public async Task<List<TeamAllowanceInterval>> GetTeamAllowanceIntervalsAsync()
    {
        return await _teams.GetTeamAllowanceIntervalsAsync(_currentUser.TeamId);
    }

    public async Task<List<TeamAllowanceInterval>> GetTeamAllowanceIntervalsForEditAsync()
    {
        return await _teams.GetTeamAllowanceIntervalsForEditAsync(_currentUser.TeamId);
    }

    public async Task<TeamAllowanceInterval?> GetTeamAllowanceIntervalAsync(long intervalId)
    {
        if (intervalId <= 0)
        {
            _logger.LogError("Invalid interval ID: {IntervalId}", intervalId);
            throw new ArgumentException("Invalid interval ID");
        }

        var allowanceInterval = await _teams.GetTeamAllowanceIntervalAsync(_currentUser.TeamId, intervalId);
        if (allowanceInterval == null)
        {
            _logger.LogError("Allowance interval with id {IntervalId} not found for team {TeamId}", intervalId, _currentUser.TeamId);
            throw new KeyNotFoundException($"Allowance interval with id {intervalId} not found for team {_currentUser.TeamId}");
        }

        return allowanceInterval;
    }

    private List<TeamAllowanceIntervalGradingPeriod> AddSchoolBreakIntervals(List<TeamAllowanceIntervalGradingPeriod>? gradingPeriods)
    {
        if (gradingPeriods == null || !gradingPeriods.Any())
            return gradingPeriods ?? new List<TeamAllowanceIntervalGradingPeriod>();

        // Sort grading periods by start date to process them in chronological order
        var sortedGradingPeriods = gradingPeriods.OrderBy(s => s.StartMonth).ThenBy(s => s.StartDay).ToList();
        var result = new List<TeamAllowanceIntervalGradingPeriod>();

        for (int i = 0; i < sortedGradingPeriods.Count; i++)
        {
            var currentGradingPeriod = sortedGradingPeriods[i];
            result.Add(currentGradingPeriod);

            // Calculate the next grading period (wrapping around to next year)
            var nextGradingPeriod = i + 1 < sortedGradingPeriods.Count ? sortedGradingPeriods[i + 1] : sortedGradingPeriods[0];

            // Calculate break period dates
            MonthOfYear breakStartMonth;
            int breakStartDay;
            MonthOfYear breakEndMonth;
            int breakEndDay;

            // Break starts the day after current grading period ends
            if (currentGradingPeriod.EndDay == DateTime.DaysInMonth(DateTime.Now.Year, (int)currentGradingPeriod.EndMonth))
            {
                // If grading period ends on last day of month, break starts on first day of next month
                if (currentGradingPeriod.EndMonth == MonthOfYear.December)
                {
                    breakStartMonth = MonthOfYear.January;
                }
                else
                {
                    breakStartMonth = (MonthOfYear)((int)currentGradingPeriod.EndMonth + 1);
                }
                breakStartDay = 1;
            }
            else
            {
                // Break starts the next day in the same month
                breakStartMonth = currentGradingPeriod.EndMonth;
                breakStartDay = currentGradingPeriod.EndDay + 1;
            }

            // Break ends the day before next grading period starts
            if (nextGradingPeriod.StartDay == 1)
            {
                // If next grading period starts on first day of month, break ends on last day of previous month
                if (nextGradingPeriod.StartMonth == MonthOfYear.January)
                {
                    breakEndMonth = MonthOfYear.December;
                }
                else
                {
                    breakEndMonth = (MonthOfYear)((int)nextGradingPeriod.StartMonth - 1);
                }
                breakEndDay = DateTime.DaysInMonth(DateTime.Now.Year, (int)breakEndMonth);
            }
            else
            {
                // Break ends the previous day in the same month
                breakEndMonth = nextGradingPeriod.StartMonth;
                breakEndDay = nextGradingPeriod.StartDay - 1;
            }

            // Only add school break if there's actually a gap between grading periods
            if (!(breakStartMonth == nextGradingPeriod.StartMonth && breakStartDay == nextGradingPeriod.StartDay))
            {
                var schoolBreak = new TeamAllowanceIntervalGradingPeriod
                {
                    Name = "School Break",
                    StartMonth = breakStartMonth,
                    StartDay = breakStartDay,
                    EndMonth = breakEndMonth,
                    EndDay = breakEndDay,
                    IsSchoolBreak = true
                };
                result.Add(schoolBreak);
            }
        }

        return result;
    }

    private string ValidateAllowanceIntervalRequest(TeamAllowanceInterval request)
    {
        if (request.TeamId != _currentUser.TeamId)
        {
            return $"Access denied: You can only create {_teamLexiconService.AllowanceLowercase(_currentUser.TeamId)} intervals for your own {_teamLexiconService.TeamLowercase(_currentUser.TeamId)}";
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return $"{_teamLexiconService.AllowanceUppercase(_currentUser.TeamId)} interval name is required";
        }

        if (request.MaxAllowanceAmount <= 0)
        {
            return $"Max {_teamLexiconService.AllowanceLowercase(_currentUser.TeamId)} amount must be greater than 0";
        }

        if (request.MinCreditsForAllowance <= 0)
        {
            return $"Min credits for {_teamLexiconService.AllowanceLowercase(_currentUser.TeamId)} must be greater than 0";
        }

        if (request.IntervalValue <= 0)
        {
            return $"{_teamLexiconService.AllowanceUppercase(_currentUser.TeamId)} interval value must be greater than 0";
        }

        if (request.IntervalType == Shared.Enums.AllowanceIntervalType.SchoolYear)
        {
            // For School Year, ensure that grading periods are defined
            if (request.GradingPeriods == null || !request.GradingPeriods.Any())
            {
                return $"At least one grading period must be defined for School Year {_teamLexiconService.AllowanceLowercase(_currentUser.TeamId)} intervals";
            }
        }

        return string.Empty;
    }

    public async Task<TeamAllowanceInterval> CreateTeamAllowanceIntervalAsync(TeamAllowanceIntervalCreateRequest request)
    {
        if (!_currentUser.IsAdmin)
        {
            _logger.LogError("Access denied: Only admin users can create intervals");
            throw new UnauthorizedAccessException("Only admin users can create intervals");
        }
 
       var interval = new TeamAllowanceInterval
        {
            TeamId = request.TeamId,
            Name = request.Name.Trim(),
            Description = request.Description,
            MaxAllowanceAmount = request.MaxAllowanceAmount,
            MinCreditsForAllowance = request.MinCreditsForAllowance,
            IntervalType = request.IntervalType,
            IntervalValue = request.IntervalValue,
            StartDayOfWeek = request.StartDayOfWeek,
            StartMonthOfYear = request.StartMonthOfYear,
            IsActive = request.IsActive,
            ResetGradesOnIntervalEnd = request.ResetGradesOnIntervalEnd,
            CreatedBy = _currentUser.UserId,
            CreatedAt = _dateTimeProvider.UtcNow
        };

        // Add grade configs if provided
        if (request.GradeConfigs != null && request.GradeConfigs.Any())
        {
            interval.GradeConfigs = request.GradeConfigs.Select(gc => new AllowanceIntervalGradeConfig
            {
                GradeId = gc.GradeId,
                AllowanceReducePercent = gc.AllowanceReducePercent,
                CreatedBy = gc.CreatedBy,
                CreatedAt = _dateTimeProvider.UtcNow
            }).ToList();
        }

        if (request.GradingPeriods != null && request.GradingPeriods.Any())
        {
            var userGradingPeriods = request.GradingPeriods.Select(s => new TeamAllowanceIntervalGradingPeriod
            {
                Name = s.Name,
                StartMonth = s.StartMonth,
                StartDay = s.StartDay,
                EndMonth = s.EndMonth,
                EndDay = s.EndDay,
                IsSchoolBreak = false,
            }).ToList();

            // Add school break intervals between grading periods
            interval.GradingPeriods = AddSchoolBreakIntervals(userGradingPeriods);
        }

        var validationError = ValidateAllowanceIntervalRequest(interval);
        if (!string.IsNullOrEmpty(validationError))
        {
            _logger.LogError("Validation error creating allowance interval: {Error}", validationError);
            throw new ArgumentException(validationError);
        }

        await _teams.CreateAllowanceIntervalAsync(interval);

        return interval;
    }

    public async Task<TeamAllowanceInterval> UpdateTeamAllowanceIntervalAsync(TeamAllowanceIntervalUpdateRequest request)
    {
        if (!_currentUser.IsAdmin)
        {
            _logger.LogError("Access denied: Only admin users can update allowance intervals");
            throw new UnauthorizedAccessException("Only admin users can update allowance intervals");
        }

        var interval = await _teams.GetTeamAllowanceIntervalAsync(request.TeamId, request.Id);
        if (interval == null)
        {
            _logger.LogError("Allowance interval with id {IntervalId} not found for team {TeamId}", request.Id, request.TeamId);
            throw new KeyNotFoundException($"Allowance interval with id {request.Id} not found for team {request.TeamId}");
        }

        interval.Name = request.Name;
        interval.Description = request.Description;
        interval.MaxAllowanceAmount = request.MaxAllowanceAmount;
        interval.MinCreditsForAllowance = request.MinCreditsForAllowance;
        interval.IntervalType = request.IntervalType;
        interval.IntervalValue = request.IntervalValue;
        interval.StartDayOfWeek = request.StartDayOfWeek;
        interval.StartMonthOfYear = request.StartMonthOfYear;
        interval.IsActive = request.IsActive;
        interval.ResetGradesOnIntervalEnd = request.ResetGradesOnIntervalEnd;
        interval.UpdatedBy = _currentUser.UserId;
        interval.UpdatedAt = _dateTimeProvider.UtcNow;

        var validationError = ValidateAllowanceIntervalRequest(interval);
        if (!string.IsNullOrEmpty(validationError))
        {
            _logger.LogError("Validation error updating allowance interval: {Error}", validationError);
            throw new ArgumentException(validationError);
        }

        if (request.GradeConfigs != null && request.GradeConfigs.Any())
        {
            foreach (var gc in request.GradeConfigs)
            {
                var existingConfig = interval.GradeConfigs.FirstOrDefault(c => c.GradeId == gc.GradeId);
                if (existingConfig != null)
                {
                    existingConfig.AllowanceReducePercent = gc.AllowanceReducePercent;
                    existingConfig.UpdatedBy = _currentUser.UserId;
                    existingConfig.UpdatedAt = _dateTimeProvider.UtcNow;
                }
                else
                {
                    var newConfig = new AllowanceIntervalGradeConfig
                    {
                        TeamAllowanceIntervalId = interval.Id,
                        GradeId = gc.GradeId,
                        AllowanceReducePercent = gc.AllowanceReducePercent,
                        CreatedBy = _currentUser.UserId,
                        CreatedAt = _dateTimeProvider.UtcNow
                    };
                    interval.GradeConfigs.Add(newConfig);
                }
            }

            // Remove configs that are no longer present
            var gradeIdsInRequest = request.GradeConfigs.Select(gc => gc.GradeId).ToHashSet();
            var configsToRemove = interval.GradeConfigs.Where(c => !gradeIdsInRequest.Contains(c.GradeId)).ToList();
            foreach (var configToRemove in configsToRemove)
            {
                interval.GradeConfigs.Remove(configToRemove);
            }
        }

        if (request.GradingPeriods != null && request.GradingPeriods.Any())
        {
            interval.GradingPeriods.Clear();

            var userGradingPeriods = request.GradingPeriods.Select(s => new TeamAllowanceIntervalGradingPeriod
            {
                TeamAllowanceIntervalId = interval.Id,
                Name = s.Name,
                StartMonth = s.StartMonth,
                StartDay = s.StartDay,
                EndMonth = s.EndMonth,
                EndDay = s.EndDay,
                IsSchoolBreak = false
            }).ToList();

            // Add school break intervals between grading periods and add all to the interval
            var allGradingPeriods = AddSchoolBreakIntervals(userGradingPeriods);
            foreach (var gradingPeriod in allGradingPeriods)
            {
                gradingPeriod.TeamAllowanceIntervalId = interval.Id;
                interval.GradingPeriods.Add(gradingPeriod);
            }
        }

        await _teams.UpdateAllowanceIntervalAsync(interval);

        // Fire and forget background operations - don't await these
        var teamId = _currentUser.TeamId;
        var intervalId = interval.Id;
        var intervalName = interval.Name;
        
        // Clone the interval object to avoid reference issues with disposed contexts
        var gradeConfigsForBackground = interval.GradeConfigs.Select(gc => new AllowanceIntervalGradeConfig
        {
            Id = gc.Id,
            TeamAllowanceIntervalId = gc.TeamAllowanceIntervalId,
            GradeId = gc.GradeId,
            AllowanceReducePercent = gc.AllowanceReducePercent,
            CreatedBy = gc.CreatedBy,
            CreatedAt = gc.CreatedAt,
            UpdatedBy = gc.UpdatedBy,
            UpdatedAt = gc.UpdatedAt
        }).ToList();

        var gradingPeriodsForBackground = interval.GradingPeriods.Select(gp => new TeamAllowanceIntervalGradingPeriod
        {
            Id = gp.Id,
            TeamAllowanceIntervalId = gp.TeamAllowanceIntervalId,
            Name = gp.Name,
            StartMonth = gp.StartMonth,
            StartDay = gp.StartDay,
            EndMonth = gp.EndMonth,
            EndDay = gp.EndDay,
            IsSchoolBreak = gp.IsSchoolBreak
        }).ToList();

        var intervalForBackground = new TeamAllowanceInterval
        {
            Id = interval.Id,
            TeamId = interval.TeamId,
            Name = interval.Name,
            Description = interval.Description,
            MaxAllowanceAmount = interval.MaxAllowanceAmount,
            MinCreditsForAllowance = interval.MinCreditsForAllowance,
            IntervalType = interval.IntervalType,
            IntervalValue = interval.IntervalValue,
            StartDayOfWeek = interval.StartDayOfWeek,
            StartMonthOfYear = interval.StartMonthOfYear,
            IsActive = interval.IsActive,
            ResetGradesOnIntervalEnd = interval.ResetGradesOnIntervalEnd,
            CreatedBy = interval.CreatedBy,
            CreatedAt = interval.CreatedAt,
            UpdatedBy = interval.UpdatedBy,
            UpdatedAt = interval.UpdatedAt,
            GradeConfigs = gradeConfigsForBackground,
            GradingPeriods = gradingPeriodsForBackground
        };

        long currentUserId = _currentUser.UserId;
        
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedAllowanceCalculationService = scope.ServiceProvider.GetRequiredService<IAllowanceCalculationService>();
                
                await scopedAllowanceCalculationService.RecalculateAllowancesForIntervalChangeAsync(intervalForBackground, currentUserId);
                _logger.LogInformation("Successfully recalculated allowances for interval change. IntervalId: {IntervalId}, IntervalName: {IntervalName}", intervalId, intervalName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background allowance recalculation failed for interval change. IntervalId: {IntervalId}, IntervalName: {IntervalName}, TeamId: {TeamId}", intervalId, intervalName, teamId);
            }
        });

        return interval;
    }

    public async Task DeleteTeamAllowanceIntervalAsync(long intervalId)
    {
        if (!_currentUser.IsAdmin)
        {
            _logger.LogError("Access denied: Only admin users can delete allowance intervals");
            throw new UnauthorizedAccessException("Only admin users can delete allowance intervals");
        }

        var allowanceInterval = await _teams.GetTeamAllowanceIntervalAsync(_currentUser.TeamId, intervalId);
        if (allowanceInterval == null)
        {
            _logger.LogError("Allowance interval with id {IntervalId} not found for team {TeamId}", intervalId, _currentUser.TeamId);
            throw new KeyNotFoundException($"Allowance interval with id {intervalId} not found for team {_currentUser.TeamId}");
        }

        await _teams.DeleteAllowanceIntervalAsync(intervalId);
    }
}
