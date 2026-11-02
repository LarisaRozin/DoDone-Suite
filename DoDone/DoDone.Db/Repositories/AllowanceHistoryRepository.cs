/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Shared;
using DoDone.Shared.Abstractions;
using DoDone.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DoDone.Db.Repositories;

public class CurrentInterval
{
    public DateTimeOffset CalculatedStartAt { get; set; }
    public DateTimeOffset ActualStartAt { get; set; }
    public DateTimeOffset CalculatedEndAt { get; set; }
    public AllowanceIntervalType IntervalType { get; set; }
    public int IntervalValue { get; set; }
    public DayOfWeek? StartDayOfWeek { get; set; }
    public int? StartMonthOfYear { get; set; }
    public TeamAllowanceInterval TeamAllowanceInterval { get; set; } = null!;
    public bool IsApproved = false;
    public string DisplayName { get; set; } = null!;
} 

public interface IAllowanceHistoryRepository
{
    Task<List<AllowanceHistory>> GetCurrent(User user, TeamAllowanceInterval interval);
    Task<List<AllowanceHistory>> GetAllUnapprovedCurrent(TeamAllowanceInterval interval);
    // Task<List<CurrentInterval>> GetCurrent(TeamAllowanceInterval interval);
    Task<AllowanceHistory> UpdateAsync(AllowanceHistory updatedAllowanceHistory, List<TaskItem>? updatedTaskItems = null);
    Task<AllowanceHistory> CreateIntervalHistory(User user, TeamAllowanceInterval interval, DateTimeOffset startAt, DateTimeOffset endAt);
    // Task<List<AllowanceHistory>> GetUserListAsync(long userId, DateTimeOffset? startDate, DateTimeOffset? endDate);
    // Task<List<AllowanceHistory>> GetTeamListAsync(long teamId, DateTimeOffset? startDate, DateTimeOffset? endDate);
    // Task<AllowanceHistory?> GetForUserAsync(long teamId, long userId, DateTimeOffset startDate, DateTimeOffset endDate);
    // Task<List<AllowanceHistory>> GetCurrentListForUserAsync(long teamId, long userId);
    // Task<(DateTimeOffset? startAt, DateTimeOffset? endAt)> GetCurrentDatesForTeamAsync(long teamId);
    // Task<List<AllowanceHistory>> GetCurrentIntervalListForTeamAsync(long teamId);
    // Task<List<AllowanceHistory>> GetNextIntervalListForTeamAsync(long teamId, DateTimeOffset currentIntervalEndAt);
    // Task<List<AllowanceHistory>> GetAllMatchingIntervalsAsync(long teamId, long userId, DateTimeOffset startAt, DateTimeOffset endAt, int minimumDaysBetweenIntervals);
    Task<AllowanceHistory?> GetByIdAsync(long id);
    // Task<AllowanceHistory> AddAsync(AllowanceHistory allowanceHistory);
    // Task<AllowanceHistory> UpdateAsync(AllowanceHistory allowanceHistory);
    // Task DeleteAsync(long id);
    IQueryable<AllowanceHistory> GetBaseQuery(long teamId, long? userId);
    // Task<List<AllowanceHistory>> GetHistoriesWithAllowanceDaySoon();
    // Task<List<AllowanceHistory>> GetHistoriesWithAllowanceDayToday();
    
    // Batched versions for notification processing
    Task<List<AllowanceHistory>> GetHistoriesWithAllowanceDaySoonBatchAsync(int skip, int take);
    Task<List<AllowanceHistory>> GetHistoriesWithAllowanceDayTodayBatchAsync(int skip, int take);
    Task<int> GetHistoriesWithAllowanceDaySoonCountAsync();
    Task<int> GetHistoriesWithAllowanceDayTodayCountAsync();
    Task<List<long>> GetCurrentIntervalUsersAsync(long intervalId);
    Task<List<AllowanceHistory>> GetCurrentIntervalHistoriesAsync(long intervalId);
    Task<long> GetEndedIntervalsForGradeResetCountAsync();
    Task<List<long>> GetEndedIntervalsForGradeResetBatchAsync(int skip, int take);
    Task<int> GradeResetCompletedAsync(List<long> batch);
}

public class AllowanceHistoryRepository : IAllowanceHistoryRepository
{
    private readonly DoDoneDbContext _db;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<AllowanceHistoryRepository> _logger;

    public AllowanceHistoryRepository(DoDoneDbContext db, IDateTimeProvider dateTimeProvider, ILogger<AllowanceHistoryRepository> logger)
    {
        _db = db;
        _dateTimeProvider = dateTimeProvider;
        _logger = logger;
    }

    public async Task<List<AllowanceHistory>> GetCurrent(User user, TeamAllowanceInterval interval)
    {
        return await _db.AllowanceHistories
            // .Include(x => x.AllowanceHistoryTaskItems)
            .Where(x => x.UserId == user.Id && x.TeamAllowanceIntervalId == interval.Id && x.CalculatedEndAt > _dateTimeProvider.UtcNow)
            .ToListAsync();
    }

    public async Task<List<AllowanceHistory>> GetAllUnapprovedCurrent(TeamAllowanceInterval interval)
    {
        return await _db.AllowanceHistories
            // .Include(x => x.AllowanceHistoryTaskItems)
            .Where(x => x.TeamAllowanceIntervalId == interval.Id && x.CalculatedEndAt > _dateTimeProvider.UtcNow && x.ApprovedAt == null)
            .ToListAsync();
    }

    // public async Task<List<CurrentInterval>> GetCurrent(TeamAllowanceInterval interval)
    // {
    //     return await _db.AllowanceHistories
    //         .Include(x => x.AllowanceHistoryTaskItems)
    //         .Where(x => x.TeamId == interval.TeamId && x.TeamAllowanceIntervalId == interval.Id && x.CalculatedEndAt > _dateTimeProvider.UtcNow)
    //         .Select(x => new CurrentInterval
    //         {
    //             CalculatedStartAt = x.CalculatedStartAt,
    //             CalculatedEndAt = x.CalculatedEndAt,
    //             ActualStartAt = x.ActualStartAt,
    //             IntervalType = x.AllowanceIntervalType,
    //             IntervalValue = x.AllowanceIntervalValue,
    //             StartDayOfWeek = x.StartDayOfWeek,
    //             StartMonthOfYear = interval.StartMonthOfYear,
    //             IsApproved = x.ApprovedAt.HasValue,
    //             TeamAllowanceInterval = interval
    //         })
    //         .Distinct()
    //         .ToListAsync();
    // }

    public async Task<AllowanceHistory> CreateIntervalHistory(User user, TeamAllowanceInterval interval, DateTimeOffset startAt, DateTimeOffset endAt)
    {
        var allowanceHistory = new AllowanceHistory
        {
            TeamId = user.TeamId,
            UserId = user.Id,
            TeamAllowanceIntervalId = interval.Id,
            AllowanceIntervalType = interval.IntervalType,
            AllowanceIntervalValue = interval.IntervalValue,
            StartDayOfWeek = interval.StartDayOfWeek,
            StartMonthOfYear = interval.StartMonthOfYear,
            CalculatedStartAt = startAt,
            ActualStartAt = _dateTimeProvider.UtcNow,
            CalculatedEndAt = endAt,
            TotalCredits = 0,
            Gpa = 0.00m,
            CalculatedAmount = 0.00m,
            CreatedAt = _dateTimeProvider.UtcNow,
            CreatedBy = user.Id
        };

        _db.AllowanceHistories.Add(allowanceHistory);
        await _db.SaveChangesAsync();
        return allowanceHistory;
    }


    public async Task<List<AllowanceHistory>> GetUserListAsync(long userId, DateTimeOffset? startDate, DateTimeOffset? endDate)
    {
        return await _db.AllowanceHistories
                        .Where(ah => ah.UserId == userId && (!startDate.HasValue || ah.CalculatedStartAt >= startDate) && (!endDate.HasValue || ah.CalculatedEndAt <= endDate))
                        .OrderByDescending(ah => ah.CalculatedStartAt)
                        .ToListAsync();
    }

    public async Task<List<AllowanceHistory>> GetTeamListAsync(long teamId, DateTimeOffset? startDate, DateTimeOffset? endDate)
    {
        return await _db.AllowanceHistories
                        .Where(ah => ah.TeamId == teamId && (!startDate.HasValue || ah.CalculatedStartAt >= startDate) && (!endDate.HasValue || ah.CalculatedEndAt <= endDate))
                        .OrderByDescending(ah => ah.CalculatedStartAt)
                        .ToListAsync();
    }

    public async Task<AllowanceHistory?> GetByIdAsync(long id)
    {
        return await _db.AllowanceHistories
                        .AsSplitQuery()
                        .Include(ah => ah.User)
                        .Include(ah => ah.ApprovedByUser)
                        .Include(ah => ah.AllowanceInterval)
                        // .Include(ah => ah.AllowanceHistoryTaskItems)
                        .FirstOrDefaultAsync(ah => ah.Id == id);
    }

    // public async Task<AllowanceHistory> AddAsync(AllowanceHistory allowanceHistory)
    // {
    //     _db.AllowanceHistories.Add(allowanceHistory);
    //     await _db.SaveChangesAsync();
    //     return allowanceHistory;
    // }

    public async Task<AllowanceHistory> UpdateAsync(AllowanceHistory updatedAllowanceHistory, List<TaskItem>? updatedTaskItems = null)
    {
        _db.AllowanceHistories.Update(updatedAllowanceHistory);
        await _db.SaveChangesAsync();

        // if (updatedTaskItems != null)
        // {
        //     var existingHistoryItems = await _db.AllowanceHistoryTaskItems
        //         .Where(ah => ah.AllowanceHistoryId == updatedAllowanceHistory.Id)
        //         .ToListAsync();

        //     var itemsToRemove = existingHistoryItems.Where(ah => !updatedTaskItems.Any(i => i.Id == ah.Id)).ToList();
        //     _db.AllowanceHistoryTaskItems.RemoveRange(itemsToRemove);

        //     var itemsToAdd = updatedTaskItems.Where(i => !existingHistoryItems.Any(ah => ah.TaskItemId == i.Id))
        //         .Select(i => new AllowanceHistoryTaskItems
        //         {
        //             AllowanceHistoryId = updatedAllowanceHistory.Id,
        //             TaskItemId = i.Id,
        //             Credits = i.Credits ?? throw new InvalidOperationException("Accredited TaskItem must have Credits"),
        //             GradeId = i.GradeId ?? throw new InvalidOperationException("Accredited TaskItem must have GradeId"),
        //             PercentComplete = i.PercentComplete,
        //             CompletedAt = i.CompletedAt,
        //             CompletedBy = i.CompletedBy,
        //             AssignedTo = i.AssignedTo ?? throw new InvalidOperationException("Accredited TaskItem must have AssignedTo"),
        //             AssignedBy = i.AssignedBy ?? throw new InvalidOperationException("Accredited TaskItem must have AssignedBy"),
        //             AssignedAt = i.AssignedAt,
        //             GradedAt = i.GradedAt,
        //             GradedBy = i.GradedBy,
        //             CreatedAt = _dateTimeProvider.UtcNow,
        //         }).ToList();
        //     _db.AllowanceHistoryTaskItems.AddRange(itemsToAdd);

        //     var itemsToUpdate = existingHistoryItems.Where(i => updatedTaskItems.Any(ah => ah.Id == i.TaskItemId)).ToList();
        //     foreach (var item in itemsToUpdate)
        //     {
        //         var taskItem = updatedTaskItems.First(ah => ah.Id == item.TaskItemId);
        //         item.Credits = taskItem.Credits ?? throw new InvalidOperationException("Accredited TaskItem must have Credits");
        //         item.GradeId = taskItem.GradeId ?? throw new InvalidOperationException("Accredited TaskItem must have GradeId");
        //         item.PercentComplete = taskItem.PercentComplete;
        //         item.CompletedAt = taskItem.CompletedAt;
        //         item.CompletedBy = taskItem.CompletedBy;
        //         item.AssignedTo = taskItem.AssignedTo ?? throw new InvalidOperationException("Accredited TaskItem must have AssignedTo");
        //         item.AssignedBy = taskItem.AssignedBy ?? throw new InvalidOperationException("Accredited TaskItem must have AssignedBy");
        //         item.AssignedAt = taskItem.AssignedAt;
        //         item.GradedAt = taskItem.GradedAt;
        //         item.GradedBy = taskItem.GradedBy;
        //     }
        //     _db.AllowanceHistoryTaskItems.UpdateRange(itemsToUpdate);
        //     await _db.SaveChangesAsync();
        // }
        // else
        // {
        //     // if no updated task items provided, just update the allowance history and do not update the items
        //     // do nothing
        // }

        return updatedAllowanceHistory;
    }

    // public async Task DeleteAsync(long id)
    // {
    //     var allowanceHistory = await GetByIdAsync(id);
    //     if (allowanceHistory != null)
    //     {
    //         _db.AllowanceHistories.Remove(allowanceHistory);
    //         await _db.SaveChangesAsync();
    //     }
    // }

    public async Task<AllowanceHistory?> GetForUserAsync(long teamId, long userId, DateTimeOffset startDate, DateTimeOffset endDate)
    {
        return await _db.AllowanceHistories
                        .Where(ah => ah.TeamId == teamId && ah.UserId == userId
                            && ah.CalculatedStartAt >= startDate.Date && ah.CalculatedStartAt < startDate.Date.AddDays(1)
                            && ah.CalculatedEndAt >= endDate.Date && ah.CalculatedEndAt < endDate.Date.AddDays(1))
                        .FirstOrDefaultAsync();
    }

    public async Task<List<AllowanceHistory>> GetCurrentListForUserAsync(long teamId, long userId)
    {
        return await _db.AllowanceHistories
                        // .Include(ah => ah.AllowanceHistoryTaskItems)
                        .Where(ah => ah.TeamId == teamId && ah.UserId == userId
                            && ah.CalculatedEndAt >= _dateTimeProvider.UtcNow)
                        .OrderByDescending(ah => ah.CalculatedEndAt)
                        .ToListAsync();
    }

    public async Task<List<AllowanceHistory>> GetCurrentIntervalListForTeamAsync(long teamId)
    {
        return await _db.AllowanceHistories
                        // .Include(ah => ah.AllowanceHistoryTaskItems)
                        .Where(ah => ah.TeamId == teamId
                            && ah.CalculatedEndAt >= _dateTimeProvider.UtcNow)
                        .OrderByDescending(ah => ah.CalculatedStartAt)
                        .ToListAsync();
    }

    public async Task<List<AllowanceHistory>> GetNextIntervalListForTeamAsync(long teamId, DateTimeOffset currentIntervalEndAt)
    {
        return await _db.AllowanceHistories
                        // .Include(ah => ah.AllowanceHistoryTaskItems)
                        .Where(ah => ah.TeamId == teamId
                            && ah.CalculatedEndAt >= currentIntervalEndAt)
                        .OrderByDescending(ah => ah.CalculatedStartAt)
                        .ToListAsync();
    }


    public async Task<(DateTimeOffset? startAt, DateTimeOffset? endAt)> GetCurrentDatesForTeamAsync(long teamId)
    {
        var startAt = await _db.AllowanceHistories
                        .Where(ah => ah.TeamId == teamId
                            && ah.CalculatedEndAt >= _dateTimeProvider.UtcNow && !ah.ApprovedAt.HasValue)
                        .Select(x => x.CalculatedStartAt)
                        .MaxAsync();

        var endAt = await _db.AllowanceHistories
                        .Where(ah => ah.TeamId == teamId
                            && ah.CalculatedEndAt >= _dateTimeProvider.UtcNow && !ah.ApprovedAt.HasValue)
                        .Select(x => x.CalculatedEndAt)
                        .MaxAsync();

        return (startAt, endAt);
    }



    public IQueryable<AllowanceHistory> GetBaseQuery(long teamId, long? userId)
    {
        var query = _db.AllowanceHistories
            .Include(ah => ah.User)
            .Include(ah => ah.ApprovedByUser)
            .Include(ah => ah.AllowanceInterval)
            .ThenInclude(ai => ai.GradingPeriods)
            .AsQueryable();

        query = query.Where(ah => ah.TeamId == teamId);

        if (userId.HasValue)
        {
            query = query.Where(ah => ah.UserId == userId.Value);
        }

        return query;
    }

    public async Task<List<AllowanceHistory>> GetAllMatchingIntervalsAsync(long teamId, long userId, DateTimeOffset startAt, DateTimeOffset endAt, int minimumDaysBetweenIntervals)
    {
        var query = GetBaseQuery(teamId, userId);

        var result = await query
            .Where(h => h.CalculatedStartAt > startAt - TimeSpan.FromDays(minimumDaysBetweenIntervals) && h.CalculatedStartAt < startAt + TimeSpan.FromDays(minimumDaysBetweenIntervals)
                     && h.CalculatedEndAt > endAt - TimeSpan.FromDays(minimumDaysBetweenIntervals) && h.CalculatedEndAt < endAt + TimeSpan.FromDays(minimumDaysBetweenIntervals))
            .ToListAsync();

        return result;
    }

    // public async Task<List<AllowanceHistory>> GetHistoriesWithAllowanceDaySoon()
    // {
    //     var soon = _dateTimeProvider.UtcNow.AddDays(2);
    //     return await _db.AllowanceHistories
    //         .Where(ah => ah.CalculatedEndAt > _dateTimeProvider.UtcNow && ah.CalculatedEndAt.Date == soon.Date)
    //         .ToListAsync();
    // }

    // public async Task<List<AllowanceHistory>> GetHistoriesWithAllowanceDayToday()
    // {
    //     var today = _dateTimeProvider.UtcNow;
    //     return await _db.AllowanceHistories
    //         .Where(ah => ah.CalculatedEndAt.Date == today.Date)
    //         .ToListAsync();
    // }

    // Batched versions for notification processing
    public async Task<List<AllowanceHistory>> GetHistoriesWithAllowanceDaySoonBatchAsync(int skip, int take)
    {
        var soon = _dateTimeProvider.UtcNow.AddDays(2);
        return await _db.AllowanceHistories
            .Where(ah => ah.CalculatedEndAt > _dateTimeProvider.UtcNow && ah.CalculatedEndAt.Date == soon.Date)
            .OrderByDescending(ah => ah.Id)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<List<AllowanceHistory>> GetHistoriesWithAllowanceDayTodayBatchAsync(int skip, int take)
    {
        var today = _dateTimeProvider.UtcNow;
        return await _db.AllowanceHistories
            .Where(ah => ah.CalculatedEndAt.Date == today.Date)
            .OrderByDescending(ah => ah.Id)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<int> GetHistoriesWithAllowanceDaySoonCountAsync()
    {
        var soon = _dateTimeProvider.UtcNow.AddDays(2);
        return await _db.AllowanceHistories
            .Where(ah => ah.CalculatedEndAt > _dateTimeProvider.UtcNow && ah.CalculatedEndAt.Date == soon.Date)
            .CountAsync();
    }

    public async Task<int> GetHistoriesWithAllowanceDayTodayCountAsync()
    {
        var today = _dateTimeProvider.UtcNow;
        return await _db.AllowanceHistories
            .Where(ah => ah.CalculatedEndAt.Date == today.Date)
            .CountAsync();
    }

    public Task<List<long>> GetCurrentIntervalUsersAsync(long intervalId)
    {
        return _db.AllowanceHistories
            .Where(ah => ah.TeamAllowanceIntervalId == intervalId && ah.CalculatedEndAt > _dateTimeProvider.UtcNow)
            .Select(ah => ah.UserId)
            .Distinct()
            .ToListAsync();
    }
	
    public Task<List<AllowanceHistory>> GetCurrentIntervalHistoriesAsync(long intervalId)
    {
        return _db.AllowanceHistories
            .Where(ah => ah.TeamAllowanceIntervalId == intervalId && ah.CalculatedEndAt > _dateTimeProvider.UtcNow)
            .ToListAsync();
    }

    public Task<long> GetEndedIntervalsForGradeResetCountAsync()
    {
        return _db.AllowanceHistories
            .Join(_db.TeamAllowanceIntervals,
                  ah => ah.TeamAllowanceIntervalId, tai => tai.Id,
                  (ah, tai) => new { AllowanceHistory = ah, TeamAllowanceInterval = tai })
            .Where(ah => ah.TeamAllowanceInterval.ResetGradesOnIntervalEnd && ah.TeamAllowanceInterval.IsActive && ah.AllowanceHistory.CalculatedEndAt <= _dateTimeProvider.UtcNow && !ah.AllowanceHistory.GradesResetAt.HasValue)
            .Select(ah => ah.AllowanceHistory.TeamAllowanceIntervalId)
            .Distinct()
            .LongCountAsync();
    }

    public Task<List<long>> GetEndedIntervalsForGradeResetBatchAsync(int skip, int take)
    {
        return _db.AllowanceHistories
            .Join(_db.TeamAllowanceIntervals,
                  ah => ah.TeamAllowanceIntervalId, tai => tai.Id,
                  (ah, tai) => new { AllowanceHistory = ah, TeamAllowanceInterval = tai })
            .Where(ah => ah.TeamAllowanceInterval.ResetGradesOnIntervalEnd && ah.TeamAllowanceInterval.IsActive && ah.AllowanceHistory.CalculatedEndAt <= _dateTimeProvider.UtcNow && !ah.AllowanceHistory.GradesResetAt.HasValue)
            .Skip(skip)
            .Take(take)
            .Select(ah => ah.AllowanceHistory.TeamAllowanceIntervalId)
            .Distinct()
            .ToListAsync();
    }

    public Task<int> GradeResetCompletedAsync(List<long> batch)
    {
        return _db.AllowanceHistories
            .Where(ah => ah.CalculatedEndAt <= _dateTimeProvider.UtcNow && !ah.GradesResetAt.HasValue && batch.Contains(ah.TeamAllowanceIntervalId))
            .ExecuteUpdateAsync(setters => setters.SetProperty(ah => ah.GradesResetAt, _dateTimeProvider.UtcNow));
    }
}