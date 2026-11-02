/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Db.Repositories;
using DoDone.Server.Dtos;
using DoDone.Server.Dtos.Common;
using DoDone.Shared;
using DoDone.Shared.Abstractions;
using DoDone.Shared.Enums;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Server.Services.Common;

public interface IQueryableProcessorService
{
    IQueryable<T> ApplyPaging<T>(IQueryable<T> query, PagingRequest paging) where T : class;
    IQueryable<T> ApplySearchTermFilter<T>(IQueryable<T> query, string? searchTerm) where T : class, IEntity;
    IQueryable<T> ApplyDefaultSorting<T>(IQueryable<T> query) where T : class, IEntity;
    Task<long> GetTotalCountAsync<T>(IQueryable<T> query) where T : class;
}

public class QueryableProcessorService : IQueryableProcessorService
{
    public async Task<long> GetTotalCountAsync<T>(IQueryable<T> query) where T : class
    {
        return await Task.FromResult(query.LongCount());
    }
    public IQueryable<T> ApplyPaging<T>(IQueryable<T> query, PagingRequest paging) where T : class
    {
        return query
            .Skip(paging.Skip)
            .Take(paging.Take);
    }

    public IQueryable<T> ApplySearchTermFilter<T>(IQueryable<T> query, string? searchTerm) where T : class, IEntity
    {
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(t => t.Name.Contains(searchTerm) || (t.Description != null && t.Description.Contains(searchTerm)));
        }
        return query;
    }

    public IQueryable<T> ApplyDefaultSorting<T>(IQueryable<T> query) where T : class, IEntity
    {
        return query
            .OrderByDescending(x => x.IsActive)
            .ThenBy(x => x.Name);
    }
}


public class AllowanceStats
{
    public long TotalCredits { get; set; }
    public decimal Gpa { get; set; }
    public decimal Allowance { get; set; } 
    public long NeedsReviewCount { get; set; }

    public long TeamAllowanceIntervalId { get; set; }
    public required string TeamAllowanceIntervalName { get; set; }
    public DateTimeOffset CalculatedStartAt { get; set; }
    public DateTimeOffset ActualStartAt { get; set; }
    public DateTimeOffset CalculatedEndAt { get; set; }
    public long BonusTotalCount { get; set; }
}

public class BonusStats
{
    public long TotalCount { get; set; }
    // public long AssignedWithBonusCount { get; set; }
    // public long UnassignedWithBonusCount { get; set; }

    // public long AssignedWithoutBonusCount { get; set; }
    // public long UnassignedWithoutBonusCount { get; set; }
    public long CurrentBonusCount { get; set; }
    public long NeedsReviewCount { get; set; }
    public long ApprovedCount { get; set; }
    public long RejectedCount { get; set; }
    public long ClaimedCount { get; set; }
    public long NotClaimedCount { get; set; }
    public long WithBonusCount { get; set; }
    public long WithoutBonusCount { get; set; }
}

public class TaskItemStats
{
    public long TotalCount { get; set; }
    public long FilteredCount { get; set; }
    public long CompletedCount { get; set; }
    public long ActiveCount { get; set; }
    public long ArchivedCount { get; set; }
    public long DueCount { get; set; }
    public long StartedCount { get; set; }
    public long EndedCount { get; set; }
    public long UnassignedCount { get; set; }
}


public interface IQueryableTaskItemProcessorService 
{

    IQueryable<TaskItem> ApplyAssignmentStatusFilter(IQueryable<TaskItem> query, TaskItemAssignmentStatusFilter filter);
    IQueryable<TaskItem> ApplyTeamMemberFilter(IQueryable<TaskItem> query, long? userId);

    IQueryable<TaskItem> ApplySearchTermFilter(IQueryable<TaskItem> query, string? searchTerm);

    IQueryable<TaskItem> ApplyPriorityFilter(IQueryable<TaskItem> query, TaskItemPriorityFilter filter);
    IQueryable<TaskItem> ApplyCompletionStatusFilter(IQueryable<TaskItem> query, TaskItemCompletionStatusFilter filter);
    IQueryable<TaskItem> ApplyActiveStatusFilter(IQueryable<TaskItem> query, TaskItemActiveStatusFilter filter);
    IQueryable<TaskItem> ApplyArchivedStatusFilter(IQueryable<TaskItem> query, TaskItemArchivedStatusFilter filter);
    IQueryable<TaskItem> ApplyDueStatusFilter(IQueryable<TaskItem> query, TaskItemDueStatusFilter filter);
    IQueryable<TaskItem> ApplyStartedStatusFilter(IQueryable<TaskItem> query, TaskItemStartedStatusFilter filter);
    IQueryable<TaskItem> ApplyEndedStatusFilter(IQueryable<TaskItem> query, TaskItemEndedStatusFilter filter);
    IQueryable<TaskItem> ApplyAllowanceNeedReviewStatusFilter(IQueryable<TaskItem> query, TaskItemNeedReviewStatusFilter filter, long teamAllowanceIntervalId = 0);
    IQueryable<TaskItem> ApplyBonusStatusFilter(IQueryable<TaskItem> query, TaskItemBonusStatusFilter filter, DateTimeOffset startAt, DateTimeOffset endAt);
    IQueryable<TaskItem> ApplyGroupKindCategoryFilters(IQueryable<TaskItem> query, long? groupId, long? kindId, long? categoryId);

    IQueryable<TaskItem> ApplyGradeFilter(IQueryable<TaskItem> query, int? gradeId);
    IQueryable<TaskItem> ApplyCreditsFilter(IQueryable<TaskItem> query, byte? credits);
    // IQueryable<TaskItem> ApplyDateFilters(IQueryable<TaskItem> query, FilterDateType? dateType, DateTimeOffset? dateFrom, DateTimeOffset? dateTo);
    IQueryable<TaskItem> ApplyAllowanceIntervalFilter(IQueryable<TaskItem> query, long? allowanceIntervalId);

    Task<TaskItemStats> GetTaskItemStatsAsync(IQueryable<TaskItem> query);
    Task<List<AllowanceStats>> GetAllowanceStatsAsync(IQueryable<TaskItem> query, long requestedIntervalId, SubscriptionLimitsResponse subscriptionLimits);
    Task<BonusStats> GetBonusStatsAsync(IQueryable<TaskItem> query, DateTimeOffset startAt, DateTimeOffset endAt);

    IQueryable<TaskItem> ApplyPaging(IQueryable<TaskItem> query, PagingRequest paging);
    IQueryable<TaskItem> ApplyDefaultSorting(IQueryable<TaskItem> query);
}

public class QueryableTaskItemProcessorService : IQueryableTaskItemProcessorService
{
    private readonly ICurrentUserService _currentUserService;
    private readonly ITeamService _teamService;
    private readonly ITeamRepository _teamRepository;
    private readonly IAllowanceCalculationService _allowanceCalculationService;
    private readonly ITaskItemRepository _taskItemRepository;
    private readonly IUserDevicesRepository _userDevicesRepository;
    private readonly IAllowanceHistoryService _allowanceHistoryService;
    private readonly ISubscriptionService _subscriptionService;
    private readonly IDateTimeProvider _dateTimeProvider;



    public QueryableTaskItemProcessorService(ICurrentUserService currentUserService,
        IAllowanceCalculationService allowanceCalculationService,
        ITeamService teamService,
        ITeamRepository teamRepository,
        ITaskItemRepository taskItemRepository,
        IUserDevicesRepository userDevicesRepository,
        IAllowanceHistoryService allowanceHistoryService,
        ISubscriptionService subscriptionService,
        IDateTimeProvider dateTimeProvider)
    {
        _currentUserService = currentUserService;
        _allowanceCalculationService = allowanceCalculationService;
        _teamService = teamService;
        _teamRepository = teamRepository;
        _taskItemRepository = taskItemRepository;
        _userDevicesRepository = userDevicesRepository;
        _allowanceHistoryService = allowanceHistoryService;
        _subscriptionService = subscriptionService;
        _dateTimeProvider = dateTimeProvider;
    }

    public async Task<List<AllowanceStats>> GetAllowanceStatsAsync(IQueryable<TaskItem> query, long requestedIntervalId, SubscriptionLimitsResponse subscriptionLimits)
    {
        var teamAllowanceIntervals = await _teamService.GetTeamAllowanceIntervalsAsync();
        teamAllowanceIntervals = teamAllowanceIntervals.Where(tai => tai.IsActive).ToList();

        if (!subscriptionLimits.AllowanceIntervalsLimit.CanAdd && subscriptionLimits.AllowanceIntervalsLimit.Max > 0)
        {
            teamAllowanceIntervals = teamAllowanceIntervals.Take(subscriptionLimits.AllowanceIntervalsLimit.Max).ToList();
        }

        var currentIntervals = await _allowanceHistoryService.GetCurrentIntervalsAsync(teamAllowanceIntervals, _currentUserService.UserId);
        var timezone = await _userDevicesRepository.GetUserTimezoneAsync(_currentUserService.UserId) ?? "UTC";
        var defaultStartAt = _dateTimeProvider.UtcNow.AddDays(-7);
        var defaultEndAt = _dateTimeProvider.UtcNow.AddDays(7);

        var overallStartAt = currentIntervals.Any() ? currentIntervals.Min(r => r.CalculatedStartAt) : defaultStartAt;
        var overallEndAt = currentIntervals.Any() ? currentIntervals.Max(r => r.CalculatedEndAt) : defaultEndAt; 

        var allAccreditedTasks = _taskItemRepository
            .ApplyAccreditedFilterAsync(query);

        var allowanceStatsList = new List<AllowanceStats>();

        foreach (var interval in currentIntervals)
        {
            var intervalStats = new AllowanceStats
                {
                    TeamAllowanceIntervalId = interval.TeamAllowanceInterval.Id,
                    TeamAllowanceIntervalName = interval.DisplayName,
                    CalculatedStartAt = interval.CalculatedStartAt,
                    CalculatedEndAt = interval.CalculatedEndAt,
                };

            if (interval.TeamAllowanceInterval.Id == requestedIntervalId || requestedIntervalId == Defaults.ALL_INTERVALS_ID || requestedIntervalId == Defaults.ALL_TASKS_INTERVAL_ID)
            {
                var accreditedItems = allAccreditedTasks
                    .Where(t => t.TeamAllowanceIntervalId == interval.TeamAllowanceInterval.Id);

                var allowanceCalculation = await _allowanceCalculationService.CalculateFromAccreditedItemsAsync(interval.TeamAllowanceInterval, accreditedItems);

                // Needs Review: Approved, Assigned, Completed and not yet Graded (and exluding archived and private)
                var needsReviewCount = await accreditedItems.LongCountAsync(t => t.AssignedTo.HasValue
                    && !t.GradeId.HasValue && t.PercentComplete == 100 && !t.IsArchived && !t.IsPrivate);

                var intervalBonusTotal = await accreditedItems.LongCountAsync(t => t.MaxBonus != null && t.MaxBonus.Trim() != string.Empty);

                intervalStats.TotalCredits = allowanceCalculation.TotalCredits;
                intervalStats.Gpa = allowanceCalculation.Gpa;
                intervalStats.Allowance = allowanceCalculation.Allowance;
                intervalStats.NeedsReviewCount = needsReviewCount;
                intervalStats.BonusTotalCount = intervalBonusTotal;
            }
            allowanceStatsList.Add(intervalStats);
        }

        var allIntervalsStartAt = allowanceStatsList.Count > 0 ? allowanceStatsList.Min(x => x.CalculatedStartAt) : defaultStartAt;
        var allIntervalsEndAt = allowanceStatsList.Count > 0 ? allowanceStatsList.Max(x => x.CalculatedEndAt) : defaultEndAt;

        // Add "All Intervals" Stats
        var allIntervalsStats = new AllowanceStats
            {
                TeamAllowanceIntervalId = Defaults.ALL_INTERVALS_ID,
                TeamAllowanceIntervalName = "All Intervals",
                CalculatedStartAt = allIntervalsStartAt,
                CalculatedEndAt = allIntervalsEndAt,
            };

        if (requestedIntervalId == Defaults.ALL_INTERVALS_ID || requestedIntervalId == Defaults.ALL_TASKS_INTERVAL_ID)
        {
            var statsWithCreditsCount = allowanceStatsList.Count(a => a.TotalCredits > 0);
            var avgGpa = statsWithCreditsCount > 0 
                ? Math.Round(allowanceStatsList.Where(x => x.TotalCredits > 0).Average(a => a.Gpa), 2) 
                : 0.00m;
            var allIntervalsStatsAllowance = statsWithCreditsCount > 0 
                ? allowanceStatsList.Sum(a => a.Allowance) 
                : 0.00m;
                allIntervalsStats.TotalCredits = statsWithCreditsCount > 0 ? allowanceStatsList.Sum(a => a.TotalCredits) : 0;
                allIntervalsStats.Gpa = avgGpa;
                allIntervalsStats.Allowance = allIntervalsStatsAllowance;
                allIntervalsStats.NeedsReviewCount = statsWithCreditsCount > 0 ? allowanceStatsList.Sum(a => a.NeedsReviewCount) : 0;
                allIntervalsStats.BonusTotalCount = statsWithCreditsCount > 0 ? allowanceStatsList.Sum(a => a.BonusTotalCount) : 0;
        }
        allowanceStatsList.Insert(0, allIntervalsStats);

        // Add "No Interval" stats
        var noIntervalStats = new AllowanceStats
            {
                TeamAllowanceIntervalId = Defaults.NO_ASSIGNED_INTERVAL_ID,
                TeamAllowanceIntervalName = "No Interval Assigned",
                CalculatedStartAt = allIntervalsStartAt,
                CalculatedEndAt = allIntervalsEndAt,
            };

        if (requestedIntervalId == Defaults.NO_ASSIGNED_INTERVAL_ID || requestedIntervalId == Defaults.ALL_TASKS_INTERVAL_ID)
        {
            var accreditedWithNoAssignedInterval = allAccreditedTasks
                .Where(t => t.TeamAllowanceIntervalId == null && !t.IsPrivate);
            
            var accreditedWithNoAssignedIntervalAllowanceCalculation = await _allowanceCalculationService
                .CalculateFromAccreditedItemsAsync(new TeamAllowanceInterval(), accreditedWithNoAssignedInterval);

            var accreditedWithNoAssignedIntervalNeedsReviewCount = accreditedWithNoAssignedInterval
                .LongCount(t => t.AssignedTo.HasValue && t.Credits.HasValue && t.Credits.Value > 0
                    && !t.GradeId.HasValue && t.PercentComplete == 100 && !t.IsArchived && !t.IsPrivate);
            
            var accreditedWithNoAssignedIntervalBonusTotal = accreditedWithNoAssignedInterval
                .LongCount(t => t.MaxBonus != null && t.MaxBonus.Trim() != string.Empty);

            noIntervalStats.TotalCredits = accreditedWithNoAssignedIntervalAllowanceCalculation.TotalCredits;
            noIntervalStats.Gpa = accreditedWithNoAssignedIntervalAllowanceCalculation.Gpa;
            noIntervalStats.Allowance = accreditedWithNoAssignedIntervalAllowanceCalculation.Allowance;
            noIntervalStats.NeedsReviewCount = accreditedWithNoAssignedIntervalNeedsReviewCount;
            noIntervalStats.BonusTotalCount = accreditedWithNoAssignedIntervalBonusTotal;
        }
        allowanceStatsList.Add(noIntervalStats);

        // Add "Private Tasks" stats
        var privateStats = new AllowanceStats
            {
                TeamAllowanceIntervalId = Defaults.PRIVATE_TASKS_INTERVAL_ID,
                TeamAllowanceIntervalName = "Private Tasks",
                CalculatedStartAt = allIntervalsStartAt,
                CalculatedEndAt = allIntervalsEndAt,
            };
        if (requestedIntervalId == Defaults.PRIVATE_TASKS_INTERVAL_ID || requestedIntervalId == Defaults.ALL_TASKS_INTERVAL_ID)
        {
            var privateTasks = _taskItemRepository.ApplyPrivateTasksFilterAsync(allAccreditedTasks, _currentUserService.UserId);
            
            var privateTasksAllowanceCalculation = await _allowanceCalculationService
                .CalculateFromAccreditedItemsAsync(new TeamAllowanceInterval(), privateTasks);
            
            var privateTasksBonusTotal = privateTasks
                .LongCount(t => t.MaxBonus != null && t.MaxBonus.Trim() != string.Empty);

            privateStats.TotalCredits = privateTasksAllowanceCalculation.TotalCredits;
            privateStats.Gpa = privateTasksAllowanceCalculation.Gpa;
            privateStats.Allowance = privateTasksAllowanceCalculation.Allowance;
            privateStats.NeedsReviewCount = 0; // Private tasks do not need review
            privateStats.BonusTotalCount = privateTasksBonusTotal;
        }
        allowanceStatsList.Add(privateStats);

        // Add "Overall" stats
        var overallStats = new AllowanceStats
            {
                TeamAllowanceIntervalId = Defaults.ALL_TASKS_INTERVAL_ID,
                TeamAllowanceIntervalName = "All Tasks",
                CalculatedStartAt = allIntervalsStartAt,
                CalculatedEndAt = allIntervalsEndAt,
            };

        if (requestedIntervalId == Defaults.ALL_TASKS_INTERVAL_ID)
        {
            var gpaList = new List<decimal>();
            if (allIntervalsStats.Gpa > 0) gpaList.Add(allIntervalsStats.Gpa);
            if (privateStats.Gpa > 0) gpaList.Add(privateStats.Gpa);
            if (noIntervalStats.Gpa > 0) gpaList.Add(noIntervalStats.Gpa);
            var avgGpa = gpaList.Count > 0
                ? Math.Round(gpaList.Average(a => a), 2) 
                : 0.00m;

            overallStats.TotalCredits = allIntervalsStats.TotalCredits + privateStats.TotalCredits + noIntervalStats.TotalCredits;
            overallStats.Gpa = avgGpa;
            overallStats.Allowance = allIntervalsStats.Allowance + privateStats.Allowance + noIntervalStats.Allowance;
            overallStats.NeedsReviewCount = allIntervalsStats.NeedsReviewCount + privateStats.NeedsReviewCount + noIntervalStats.NeedsReviewCount;
            overallStats.BonusTotalCount = allIntervalsStats.BonusTotalCount + privateStats.BonusTotalCount + noIntervalStats.BonusTotalCount;
        }
        allowanceStatsList.Insert(0, overallStats);

        return allowanceStatsList;
    }

    public IQueryable<TaskItem> ApplyAllowanceIntervalFilter(IQueryable<TaskItem> query, long? allowanceIntervalId)
    {
        if (allowanceIntervalId.HasValue)
        {
            if (allowanceIntervalId == Defaults.ALL_TASKS_INTERVAL_ID)
                return query;
            else if (allowanceIntervalId == Defaults.NO_ASSIGNED_INTERVAL_ID)
                query = query.Where(t => t.TeamAllowanceIntervalId == null && !t.IsPrivate);
            else if (allowanceIntervalId == Defaults.PRIVATE_TASKS_INTERVAL_ID)
                query = query.Where(t => t.IsPrivate && t.AssignedTo == _currentUserService.UserId);
            else if (allowanceIntervalId == Defaults.ALL_INTERVALS_ID)
                query = query.Where(t => t.TeamAllowanceIntervalId != null && !t.IsPrivate);
            else if (allowanceIntervalId > 0)
                query = query.Where(t => t.TeamAllowanceIntervalId == allowanceIntervalId && !t.IsPrivate);
        }
        return query;
    }

    public async Task<BonusStats> GetBonusStatsAsync(IQueryable<TaskItem> query, DateTimeOffset startAt, DateTimeOffset endAt)
    {
        // Materialize the base query once to avoid multiple database round trips
        var allTasks = await query.ToListAsync();
        
        return new BonusStats
        {
            TotalCount = allTasks.LongCount(t => t.MaxBonus != null && t.MaxBonus.Trim() != string.Empty),
            WithBonusCount = allTasks.LongCount(t => t.MaxBonus != null && t.MaxBonus.Trim() != string.Empty),
            WithoutBonusCount = allTasks.LongCount(t => t.MaxBonus == null || t.MaxBonus.Trim() == string.Empty),
            CurrentBonusCount = allTasks.LongCount(t => 
                (t.MaxBonus != null && t.MaxBonus.Trim() != string.Empty) &&
                ((t.StartAt.HasValue && t.StartAt.Value >= startAt && t.StartAt.Value <= endAt) ||
                 (t.EndAt.HasValue && t.EndAt.Value >= startAt && t.EndAt.Value <= endAt))),
            NeedsReviewCount = allTasks.LongCount(t => 
                (t.MaxBonus != null && t.MaxBonus.Trim() != string.Empty) && 
                t.BonusStatusAt == null && t.PercentComplete == 100),
            ApprovedCount = allTasks.LongCount(t => 
                (t.MaxBonus != null && t.MaxBonus.Trim() != string.Empty) && 
                !string.IsNullOrEmpty(t.ApprovedBonus) && !t.IsBonusRejected),
            RejectedCount = allTasks.LongCount(t => 
                (t.MaxBonus != null && t.MaxBonus.Trim() != string.Empty) && 
                t.IsBonusRejected),
            ClaimedCount = allTasks.LongCount(t => 
                (t.MaxBonus != null && t.MaxBonus.Trim() != string.Empty) && 
                t.BonusClaimedAt.HasValue),
            NotClaimedCount = allTasks.LongCount(t => 
                (t.MaxBonus != null && t.MaxBonus.Trim() != string.Empty) && 
                !t.BonusClaimedAt.HasValue),
        };
    }

    public async Task<TaskItemStats> GetTaskItemStatsAsync(IQueryable<TaskItem> query)
    {
        // Single query with all aggregations - let SQL do the work
        var now = _dateTimeProvider.UtcNow;
        
        var stats = await query
            .GroupBy(t => 1) // Group all into single row for aggregation
            .Select(g => new TaskItemStats
            {
                TotalCount = g.LongCount(),
                CompletedCount = g.LongCount(t => t.PercentComplete == 100),
                ActiveCount = g.LongCount(t => t.IsActive),
                ArchivedCount = g.LongCount(t => t.IsArchived),
                DueCount = g.LongCount(t => t.DueAt != null && t.DueAt <= now),
                StartedCount = g.LongCount(t => t.StartAt != null && t.StartAt <= now),
                EndedCount = g.LongCount(t => t.EndAt != null && t.EndAt <= now),
                UnassignedCount = g.LongCount(t => t.AssignedTo == null)
            })
            .SingleOrDefaultAsync();

        return stats ?? new TaskItemStats(); // Return empty stats if no tasks
    }

    public IQueryable<TaskItem> ApplyBonusStatusFilter(IQueryable<TaskItem> query, TaskItemBonusStatusFilter filter, DateTimeOffset startAt, DateTimeOffset endAt)
    {
        switch (filter)
        {
            case TaskItemBonusStatusFilter.Any:
                break;
            case TaskItemBonusStatusFilter.WithBonus:
                query = _taskItemRepository.ApplyBonusFilterAsync(query); 
                break;
            case TaskItemBonusStatusFilter.WithoutBonus:
                query = _taskItemRepository.ApplyNoBonusFilterAsync(query); 
                break;
            case TaskItemBonusStatusFilter.Current:
                query = _taskItemRepository.ApplyCurrentBonusFilterAsync(query, startAt, endAt);
                break;
            case TaskItemBonusStatusFilter.NeedsReview:
                query = _taskItemRepository.ApplyNeedsReviewBonusFilterAsync(query);
                break;
            case TaskItemBonusStatusFilter.Approved:
                query = _taskItemRepository.ApplyApprovedBonusFilterAsync(query);
                break;
            case TaskItemBonusStatusFilter.Rejected:
                query = _taskItemRepository.ApplyRejectedBonusFilterAsync(query);
                break;
            case TaskItemBonusStatusFilter.Claimed:
                query = _taskItemRepository.ApplyClaimedBonusFilterAsync(query);
                break;
            case TaskItemBonusStatusFilter.NotClaimed:
                query = _taskItemRepository.ApplyNotClaimedBonusFilterAsync(query); 
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(filter), filter, null);
        }
        return query;
    }


    // public IQueryable<TaskItem> ApplyAllowanceAccreditedStatusFilter(IQueryable<TaskItem> query, TaskItemAllowanceAccreditedStatusFilter filter, DateTimeOffset startAt, DateTimeOffset endAt)
    // {
    //     switch (filter)
    //     {
    //         case TaskItemAllowanceAccreditedStatusFilter.Accredited:
    //             query = _taskItemRepository.ApplyAccreditedFilterAsync(query, startAt, endAt);
    //             break;
    //         case TaskItemAllowanceAccreditedStatusFilter.Any:
    //         default:
    //             break;
    //     }
    //     return query;
    // }

    public IQueryable<TaskItem> ApplySearchTermFilter(IQueryable<TaskItem> query, string? searchTerm)
    {
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(t => (t.Name != null && t.Name.Contains(searchTerm)) || (t.Description != null && t.Description.Contains(searchTerm)));
        }
        return query;
    }

    public IQueryable<TaskItem> ApplyAssignmentStatusFilter(IQueryable<TaskItem> query, TaskItemAssignmentStatusFilter filter)
    {
        switch (filter)
        {
            case TaskItemAssignmentStatusFilter.Mine:
                query = query.Where(t => t.AssignedTo == _currentUserService.UserId || (t.CreatedBy == _currentUserService.UserId && !t.AssignedTo.HasValue));
                break;
            case TaskItemAssignmentStatusFilter.Team:
                query = query.Where(t => t.AssignedTo.HasValue && t.AssignedTo != _currentUserService.UserId);
                break;
            case TaskItemAssignmentStatusFilter.Unassigned:
                query = query.Where(t => !t.AssignedTo.HasValue);
                break;
            case TaskItemAssignmentStatusFilter.Private:
                query = query.Where(t => t.CreatedBy == _currentUserService.UserId && t.IsPrivate);
                break;
            case TaskItemAssignmentStatusFilter.Any:
            default:
                break;
        }

        return query;
    }
    public IQueryable<TaskItem> ApplyTeamMemberFilter(IQueryable<TaskItem> query, long? userId)
    {
        if (userId.HasValue)
        {
            query = query.Where(t => t.AssignedTo == userId.Value);
        }
        return query;
    }

    public IQueryable<TaskItem> ApplyCompletionStatusFilter(IQueryable<TaskItem> query, TaskItemCompletionStatusFilter filter)
    {
        if (filter != TaskItemCompletionStatusFilter.Any)
        {
            if (filter == TaskItemCompletionStatusFilter.InProgress)
            {
                query = query.Where(t => t.PercentComplete >= 0 && t.PercentComplete < 100);
            }
            else if (filter == TaskItemCompletionStatusFilter.Completed)
            {
                query = query.Where(t => t.PercentComplete == 100);
            }
        }
        return query;
    }

    public IQueryable<TaskItem> ApplyActiveStatusFilter(IQueryable<TaskItem> query, TaskItemActiveStatusFilter filter)
    {
        switch (filter)
        {
            case TaskItemActiveStatusFilter.Active:
                query = query.Where(t => t.IsActive);
                break;
            case TaskItemActiveStatusFilter.Inactive:
                query = query.Where(t => !t.IsActive);
                break;
            case TaskItemActiveStatusFilter.Any:
            default:
                break;
        }
        return query;
    }

    public IQueryable<TaskItem> ApplyArchivedStatusFilter(IQueryable<TaskItem> query, TaskItemArchivedStatusFilter filter)
    {
        switch (filter)
        {
            case TaskItemArchivedStatusFilter.Unarchived:
                query = query.Where(t => !t.IsArchived);
                break;
            case TaskItemArchivedStatusFilter.Archived:
                query = query.Where(t => t.IsArchived);
                break;
            case TaskItemArchivedStatusFilter.Any:
            default:
                break;
        }

        return query;
    }

    public IQueryable<TaskItem> ApplyDueStatusFilter(IQueryable<TaskItem> query, TaskItemDueStatusFilter filter)
    {
        if (filter != TaskItemDueStatusFilter.Any)
        {
            if (filter == TaskItemDueStatusFilter.NotDue)
                query = query.Where(t => t.DueAt == null || t.DueAt > _dateTimeProvider.UtcNow);
            else if (filter == TaskItemDueStatusFilter.Due)
                query = query.Where(t => t.DueAt != null && t.DueAt <= _dateTimeProvider.UtcNow);
        }
        return query;
    }

    public IQueryable<TaskItem> ApplyStartedStatusFilter(IQueryable<TaskItem> query, TaskItemStartedStatusFilter filter)
    {
        if (filter != TaskItemStartedStatusFilter.Any)
        {
            if (filter == TaskItemStartedStatusFilter.NotStarted)
                query = query.Where(t => t.StartAt == null || t.StartAt > _dateTimeProvider.UtcNow);
            else if (filter == TaskItemStartedStatusFilter.Started)
                query = query.Where(t => t.StartAt != null && t.StartAt <= _dateTimeProvider.UtcNow);
        }
        return query;
    }

    public IQueryable<TaskItem> ApplyEndedStatusFilter(IQueryable<TaskItem> query, TaskItemEndedStatusFilter filter)
    {
        if (filter != TaskItemEndedStatusFilter.Any)
        {
            if (filter == TaskItemEndedStatusFilter.NotEnded)
                query = query.Where(t => t.EndAt == null || t.EndAt > _dateTimeProvider.UtcNow);
            else if (filter == TaskItemEndedStatusFilter.Ended)
                query = query.Where(t => t.EndAt != null && t.EndAt <= _dateTimeProvider.UtcNow);
        }
        return query;
    }

    public IQueryable<TaskItem> ApplyAllowanceNeedReviewStatusFilter(IQueryable<TaskItem> query, TaskItemNeedReviewStatusFilter filter, long teamAllowanceIntervalId = 0)
    {
        if (filter != TaskItemNeedReviewStatusFilter.Any)
        {
            if (teamAllowanceIntervalId > 0)
            {
                query = query.Where(t => t.TeamAllowanceIntervalId == teamAllowanceIntervalId);
                query = _taskItemRepository.ApplyAllowanceNeedReviwFilterAsync(query);
            }
            else
                query = _taskItemRepository.ApplyAllowanceNeedReviwFilterAsync(query);
        }
        return query;
    }

    public IQueryable<TaskItem> ApplyGroupKindCategoryFilters(IQueryable<TaskItem> query, long? groupId, long? kindId, long? categoryId)
    {
        if (groupId.HasValue)
        {
            query = query.Where(t => t.GroupId == groupId.Value);
            if (kindId.HasValue)
            {
                query = query.Where(t => t.KindId == kindId.Value);
                if (categoryId.HasValue)
                {
                    query = query.Where(t => t.CategoryId == categoryId.Value);
                }
            }
        }

        return query;
    }

    public IQueryable<TaskItem> ApplyPriorityFilter(IQueryable<TaskItem> query, TaskItemPriorityFilter filter)
    {
        if (filter != TaskItemPriorityFilter.Any)
        {
            switch (filter)
            {
                case TaskItemPriorityFilter.None:
                    query = query.Where(t => t.Priority == TaskItemPriority.None);
                    break;
                case TaskItemPriorityFilter.Low:
                    query = query.Where(t => t.Priority == TaskItemPriority.Low);
                    break;
                case TaskItemPriorityFilter.Medium:
                    query = query.Where(t => t.Priority == TaskItemPriority.Medium);
                    break;
                case TaskItemPriorityFilter.High:
                    query = query.Where(t => t.Priority == TaskItemPriority.High);
                    break;
                case TaskItemPriorityFilter.Critical:
                    query = query.Where(t => t.Priority == TaskItemPriority.Critical);
                    break;
                default:
                    break;
            }
        }
        return query;
    }

    public IQueryable<TaskItem> ApplyPaging(IQueryable<TaskItem> query, PagingRequest paging)
    {
        return query
            .Skip(paging.Skip)
            .Take(paging.Take);
    }

    public IQueryable<TaskItem> ApplyDefaultSorting(IQueryable<TaskItem> query)
    {
        return query
            .OrderByDescending(x => x.UserPins.Any(p => p.UserId == _currentUserService.UserId && p.TaskItemId == x.Id))
            .ThenByDescending(x => x.IsActive)
            // .ThenBy(x => x.DueAt)
            .ThenBy(x => x.Name);
    }

    public IQueryable<TaskItem> ApplyGradeFilter(IQueryable<TaskItem> query, int? gradeId)
    {
        if (gradeId.HasValue)
        {
            query = query.Where(t => t.GradeId == gradeId.Value);
        }
        return query;
    }

    public IQueryable<TaskItem> ApplyCreditsFilter(IQueryable<TaskItem> query, byte? credits)
    {
        if (credits.HasValue)
        {
            query = query.Where(t => t.Credits == credits.Value);
        }
        return query;
    }

    // public IQueryable<TaskItem> ApplyDateFilters(IQueryable<TaskItem> query, FilterDateType? dateType, DateTimeOffset? dateFrom, DateTimeOffset? dateTo)
    // {
    //     if (dateType.HasValue)
    //     {
    //         switch (dateType.Value)
    //         {
    //             case FilterDateType.Created:
    //                 query = query.Where(t => t.CreatedAt >= dateFrom && t.CreatedAt <= dateTo);
    //                 break;
    //             case FilterDateType.Updated:
    //                 query = query.Where(t => t.UpdatedAt >= dateFrom && t.UpdatedAt <= dateTo);
    //                 break;
    //             case FilterDateType.Due:
    //                 query = query.Where(t => t.DueAt >= dateFrom && t.DueAt <= dateTo);
    //                 break;
    //             case FilterDateType.Started:
    //                 query = query.Where(t => t.StartAt >= dateFrom && t.StartAt <= dateTo);
    //                 break;
    //             case FilterDateType.Ended:
    //                 query = query.Where(t => t.EndAt >= dateFrom && t.EndAt <= dateTo);
    //                 break;
    //             case FilterDateType.Completed:
    //                 query = query.Where(t => t.CompletedAt >= dateFrom && t.CompletedAt <= dateTo);
    //                 break;
    //             case FilterDateType.Assigned:
    //                 query = query.Where(t => t.AssignedAt >= dateFrom && t.AssignedAt <= dateTo);
    //                 break;
    //             case FilterDateType.Graded:
    //                 query = query.Where(t => t.GradedAt >= dateFrom && t.GradedAt <= dateTo);
    //                 break;
    //             case FilterDateType.Active:
    //                 query = query.Where(t => t.ActiveAt >= dateFrom && t.ActiveAt <= dateTo);
    //                 break;
    //             case FilterDateType.Archived:
    //                 query = query.Where(t => t.ArchivedAt >= dateFrom && t.ArchivedAt <= dateTo);
    //                 break;
    //             case FilterDateType.BonusStatus:
    //                 query = query.Where(t => t.BonusStatusAt >= dateFrom && t.BonusStatusAt <= dateTo);
    //                 break;
    //             case FilterDateType.AllowanceStatus:
    //                 query = query.Where(t => t.AllowanceApprovalStatusAt >= dateFrom && t.AllowanceApprovalStatusAt <= dateTo);
    //                 break;
    //         }
    //     }
    //     return query;
    // }
}