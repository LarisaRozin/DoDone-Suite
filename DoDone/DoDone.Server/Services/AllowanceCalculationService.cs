/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Db.Repositories;
using DoDone.Server.Dtos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using DoDone.Shared.Enums;
using DoDone.Shared.Extensions;
using DoDone.Shared.Abstractions;
using System.Diagnostics;
using NetTopologySuite.Index.HPRtree;

namespace DoDone.Server.Services;

public class AllowanceHistoryCalculation
{
    public long TotalCredits { get; set; }
    public decimal Gpa { get; set; }
    public decimal Allowance { get; set; }
}

public interface IAllowanceCalculationService
{
    Task<AllowanceHistory?> RecalculateUserAllowanceAsync(User user, TeamAllowanceInterval interval, long currentUserId);
    Task<AllowanceHistory> RecalculateFromAccreditedItemsAsync(TeamAllowanceInterval interval, IQueryable<TaskItem> accreditedItems, AllowanceHistory allowanceHistory, long currentUserId);
    Task<AllowanceHistoryCalculation> CalculateFromAccreditedItemsAsync(TeamAllowanceInterval interval, IQueryable<TaskItem> accreditedItems);
    Task RecalculateAllowancesForIntervalChangeAsync(TeamAllowanceInterval interval, long currentUserId);
}

public class AllowanceCalculationService : IAllowanceCalculationService
{
    private readonly ITaskItemRepository _taskItemRepository;
    private readonly IAllowanceHistoryService _allowanceHistoryService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUserRepository _userRepository;
    private readonly IGradeRepository _gradeRepository;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<AllowanceCalculationService> _logger;

    public AllowanceCalculationService(ITaskItemRepository taskItemRepository
                                     , IAllowanceHistoryService allowanceHistoryService
                                     , ICurrentUserService currentUserService
                                     , IUserRepository userRepository
                                     , IGradeRepository gradeRepository
                                     , IDateTimeProvider dateTimeProvider
                                     , ILogger<AllowanceCalculationService> logger)
    {
        _taskItemRepository = taskItemRepository;
        _allowanceHistoryService = allowanceHistoryService;
        _currentUserService = currentUserService;
        _userRepository = userRepository;
        _gradeRepository = gradeRepository;
        _dateTimeProvider = dateTimeProvider;
        _logger = logger;
    }

    public async Task<AllowanceHistory?> RecalculateUserAllowanceAsync(User user, TeamAllowanceInterval interval, long currentUserId)
    {
        if (user == null)
            throw new ArgumentNullException(nameof(user), "User cannot be null");

        if (interval == null)
            throw new ArgumentNullException(nameof(interval), "TeamAllowanceIntervalResponse cannot be null");

        if (interval.MaxAllowanceAmount <= 0)
        {
            _logger.LogInformation($"Allowance calculation disabled for team ID: {user.TeamId} for interval ID: {interval.Id} due to MaxAllowanceAmount being {interval.MaxAllowanceAmount}");
            return null;
        }

        _logger.LogInformation("Starting allowance recalculation for user ID: {UserId}, interval ID: {IntervalId}", user.Id, interval.Id);
        Stopwatch stopwatch = Stopwatch.StartNew();

        var allowanceHistory = await _allowanceHistoryService.GetCurrentAsync(user, interval, currentUserId);  // create if not exists 
        if (allowanceHistory == null)
        {
            _logger.LogInformation("User allowance calculation disabled for user ID: {UserId}, interval {IntervalId}", user.Id, interval.Id);
            return null;
        }

        var accreditedItems = _taskItemRepository.GetAccreditedBaseQueryForAllowanceRecalculation(user.Id, interval.Id);
        allowanceHistory = await RecalculateFromAccreditedItemsAsync(interval, accreditedItems, allowanceHistory, currentUserId);

        stopwatch.Stop();
        _logger.LogInformation("Finished allowance recalculation for user ID: {UserId}, interval ID: {IntervalId} in {ElapsedMilliseconds} ms {ElapsedSeconds} s", user.Id, interval.Id, stopwatch.ElapsedMilliseconds, stopwatch.Elapsed.TotalSeconds);

        return allowanceHistory;
    }

    private async Task<AllowanceHistory> ClearAllowanceCalculationAsync(AllowanceHistory allowanceHistory, long currentUserId)
    {
        allowanceHistory.TotalCredits = 0;
        allowanceHistory.Gpa = 0.00m;
        allowanceHistory.CalculatedAmount = 0.00m;
        allowanceHistory.UpdatedAt = _dateTimeProvider.UtcNow;
        allowanceHistory.UpdatedBy = currentUserId;
        allowanceHistory.AllowanceHistoryTaskItems.Clear();

        return await _allowanceHistoryService.UpdateAsync(allowanceHistory, new List<TaskItem>());
    }

    public async Task<AllowanceHistory> RecalculateFromAccreditedItemsAsync(TeamAllowanceInterval interval, IQueryable<TaskItem> accreditedItems, AllowanceHistory allowanceHistory, long currentUserId)
    {
        if (!accreditedItems.Any())
        {
            return await ClearAllowanceCalculationAsync(allowanceHistory, currentUserId);
        }

        var calculation = await CalculateFromAccreditedItemsAsync(interval, accreditedItems);
        if (calculation.TotalCredits <= 0)
        {
            return await ClearAllowanceCalculationAsync(allowanceHistory, currentUserId);
        }

        allowanceHistory.TotalCredits = calculation.TotalCredits;
        allowanceHistory.Gpa = calculation.Gpa;
        allowanceHistory.CalculatedAmount = calculation.Allowance;
        allowanceHistory.UpdatedAt = _dateTimeProvider.UtcNow;
        allowanceHistory.UpdatedBy = currentUserId;

        return await _allowanceHistoryService.UpdateAsync(allowanceHistory);
    }

    public async Task RecalculateAllowancesForIntervalChangeAsync(TeamAllowanceInterval interval, long currentUserId)
    {
        Stopwatch stopwatch = Stopwatch.StartNew();

        await _allowanceHistoryService.UpdateCurrentAsync(interval, currentUserId);

        var usersIds = await _allowanceHistoryService.GetCurrentIntervalUsersAsync(interval.Id);

        _logger.LogInformation("Starting allowance recalculation on interval SETTINGS change intervalID: {IntervalId}, userCount: {UserCount}", interval.Id, usersIds.Count);

        foreach (var userId in usersIds)
        {
            var user = await _userRepository.GetAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("User with ID {UserId} not found during allowance recalculation for interval ID {IntervalId}", userId, interval.Id);
                continue;
            }

            _logger.LogInformation("Starting allowance recalculation on interval SETTINGS change for user ID: {UserId}", user.Id);

            await RecalculateUserAllowanceAsync(user, interval, currentUserId);

            _logger.LogInformation("Finished allowance recalculation on interval SETTINGS change for user ID: {UserId}", user.Id);
        }
        stopwatch.Stop();
        _logger.LogInformation("Finished allowance recalculation on interval SETTINGS change intervalID: {IntervalId} in {ElapsedMilliseconds} ms {ElapsedSeconds} s", interval.Id, stopwatch.ElapsedMilliseconds, stopwatch.Elapsed.TotalSeconds); 
    }

    public async Task<AllowanceHistoryCalculation> CalculateFromAccreditedItemsAsync(TeamAllowanceInterval interval, IQueryable<TaskItem> accreditedItems)
    {
        var calculation = new AllowanceHistoryCalculation
        {
            TotalCredits = 0,
            Gpa = 0.00m,
            Allowance = 0.00m
        };

        if (!await accreditedItems.AnyAsync())
        {
            return calculation;
        }

        var totalCredits = await accreditedItems.SumAsync(t => t.Credits) ?? 0;
        if (totalCredits <= 0)
        {
            return calculation;
        }
        else
        {
            calculation.TotalCredits = totalCredits;
        }

        var grades = await _gradeRepository.GetListAsync();

        if (grades == null)
        {
            _logger.LogError("Failed to retrieve grades for allowance calculations");
            throw new InvalidOperationException("Grades data is required for allowance calculations");
        }

        // Calculate weighted average
        var totalWeightedGradePoints = await accreditedItems.Where(x => x.GradeId.HasValue && x.Credits.HasValue).SumAsync(item => item.Grade!.GradePoints * (item.Credits ?? 0));
        calculation.Gpa = totalWeightedGradePoints > 0
            ? Math.Round(totalWeightedGradePoints / totalCredits, 1) : 0.0m;

        var grade = grades.GradeFromGpa(calculation.Gpa);
        var teamGradeConfig = interval.GradeConfigs?.FirstOrDefault(tgc => tgc.GradeId == grade.Id);

        calculation.Allowance = totalCredits >= interval.MinCreditsForAllowance ? interval.MaxAllowanceAmount * grade.PercentGradeMax / 100 : 0;
        calculation.Allowance = calculation.Allowance - (interval.MaxAllowanceAmount * (teamGradeConfig?.AllowanceReducePercent ?? grade.ReducePercent) / 100);
        if (calculation.Allowance < 0)
        {
            calculation.Allowance = 0;
        }
        calculation.Allowance = totalCredits >= interval.MinCreditsForAllowance ? (int)Math.Round(calculation.Allowance, 0) : 0;
        calculation.Allowance = calculation.Allowance;

        return calculation;
    }

    // public async Task RecalculateForUserAsync(User user)
    // {
    //     _logger.LogInformation("Starting allowance recalculation for user ID: {UserId}", user.Id);

    //     await RecalculateUserWithRetryAsync(user);

    //     _logger.LogInformation("Finished allowance recalculation for user ID: {UserId}", user.Id);
    // }
}
