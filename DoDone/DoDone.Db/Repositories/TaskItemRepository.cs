/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Shared.Abstractions;
using DoDone.Shared.Enums;
using EFCore.BulkExtensions;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Db.Repositories;

public interface ITaskItemRepository : IRepositoryBase<TaskItem>
{
    Task SetCompleteAsync(long id, long userId, bool complete = true);
    Task SetCompleteAsync(List<long> taskItemIds, long userId, bool completing = true);
    Task SetActiveAsync(List<long> taskItemIds, long userId, bool activating = true);
    Task SetActiveAsync(long id, long userId, bool activating = true);
    Task ArchiveAsync(long id, long userId, bool archiving = true);
    Task ArchiveAsync(List<long> taskItemIds, long userId, bool archiving = true);
    Task PinAsync(long id, long userId, bool pinnning = true);
    Task PinAsync(List<long> taskItemIds, long userId, bool pinnning = true);
    Task<TaskItem> CopyAsync(long id, long userId);
    Task DeleteAsync(List<long> ids);
    Task<string> GetTaskDetails(long id);  // TaskItem.Details
    new Task<TaskItem?> GetTaskItemEntityDetailsAsync(long id);  // TaskItem with all related entities                      
    Task<TaskItem?> GetTaskItemEntityDetailsForUpdateAsync(long id);
    new Task<TaskItem?> GetAsync(long id);
    new IQueryable<TaskItem> GetBaseQuery(long userId);
    new IQueryable<TaskItem> GetBaseDetailsQuery(long userId);
    Task<List<TaskItem>> GetListAsync(List<long> ids);

    IQueryable<TaskItem> GetAccreditedBaseQueryForAllowanceRecalculation(long userId, long teamAllowanceIntervalId);
    IQueryable<TaskItem> GetAccreditedBaseQueryForAllowanceRecalculation(long userId, long? teamAllowanceIntervalId, DateTimeOffset startDate, DateTimeOffset endDate);
    IQueryable<TaskItem> ApplyAccreditedFilterAsync(IQueryable<TaskItem> query, long? teamAllowanceIntervalId, DateTimeOffset startDate, DateTimeOffset endDate);
    IQueryable<TaskItem> ApplyPrivateTasksFilterAsync(IQueryable<TaskItem> query, long userId);
    IQueryable<TaskItem> ApplyAccreditedFilterAsync(IQueryable<TaskItem> query);

    IQueryable<TaskItem> ApplyAllowanceNeedReviwFilterAsync(IQueryable<TaskItem> query);
    IQueryable<TaskItem> ApplyBonusFilterAsync(IQueryable<TaskItem> query);
    IQueryable<TaskItem> ApplyNoBonusFilterAsync(IQueryable<TaskItem> query);
    IQueryable<TaskItem> ApplyCurrentBonusFilterAsync(IQueryable<TaskItem> query, DateTimeOffset startAt, DateTimeOffset endAt);
    IQueryable<TaskItem> ApplyNeedsReviewBonusFilterAsync(IQueryable<TaskItem> query);
    IQueryable<TaskItem> ApplyApprovedBonusFilterAsync(IQueryable<TaskItem> query);
    IQueryable<TaskItem> ApplyRejectedBonusFilterAsync(IQueryable<TaskItem> query);
    IQueryable<TaskItem> ApplyClaimedBonusFilterAsync(IQueryable<TaskItem> query);
    IQueryable<TaskItem> ApplyNotClaimedBonusFilterAsync(IQueryable<TaskItem> query);
    
    Task<List<TaskItem>> GetTasksDueSoonBatchAsync(int skip, int take);
    Task<List<TaskItem>> GetTasksDueTodayBatchAsync(int skip, int take);
    Task<List<TaskItem>> GetTasksStartingSoonBatchAsync(int skip, int take);
    Task<List<TaskItem>> GetTasksStartingTodayBatchAsync(int skip, int take);
    Task<List<TaskItem>> GetTasksEndingSoonBatchAsync(int skip, int take);
    Task<List<TaskItem>> GetTasksEndingTodayBatchAsync(int skip, int take);
    Task<int> GetTasksDueSoonCountAsync();
    Task<int> GetTasksDueTodayCountAsync();
    Task<int> GetTasksStartingSoonCountAsync();
    Task<int> GetTasksStartingTodayCountAsync();
    Task<int> GetTasksEndingSoonCountAsync();
    Task<int> GetTasksEndingTodayCountAsync();
    Task ResetTaskGradesForEndedAllowanceIntervalAsync(long intervalId);
    Task<int> GetCountByTeamIdAsync(long teamId);
    Task<int> GetUnarchivedCountByTeamIdAsync(long teamId);
}

public class TaskItemRepository : ITaskItemRepository
{
    private readonly DoDoneDbContext _db;
    private readonly IDateTimeProvider _dateTimeProvider;

    public TaskItemRepository(DoDoneDbContext db, IDateTimeProvider dateTimeProvider)
    {
        _db = db;
        _dateTimeProvider = dateTimeProvider;
    }

    private (bool isAdmin, long teamId) GetUserDetails(long userId)
    {
        var isAdmin = _db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.IsAdmin)
            .Single();
        var teamId = _db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.TeamId)
            .Single();

        return (isAdmin, teamId);
    }

    public async Task CreateAsync(TaskItem item)
        => await _db.TaskItems.AddAsync(item);

    public Task UpdateAsync(TaskItem item)
    {
        var entry = _db.Entry(item);
        entry.State = EntityState.Modified;

        return Task.CompletedTask;
    }

    public async Task ArchiveAsync(long id, long userId, bool archive = true)
    {
        var item = await _db.TaskItems.FindAsync(id);
        if (item != null)
        {
            item.IsArchived = archive;
            item.ActiveAt = DateTimeOffset.UtcNow;
            item.ArchivedBy = userId;
            item.UpdatedBy = userId;
            item.UpdatedAt = DateTimeOffset.UtcNow;
            _db.TaskItems.Update(item);
        }
    }

    public async Task ArchiveAsync(List<long> ids, long userId, bool archive = true)
    {
        var items = await _db.TaskItems.Where(t => ids.Contains(t.Id)).ToListAsync();
        foreach (var item in items)
        {
            item.IsArchived = archive;
            item.ActiveAt = DateTimeOffset.UtcNow;
            item.ArchivedBy = userId;
            item.UpdatedBy = userId;
            item.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await _db.BulkUpdateAsync(items);
    }

    public async Task DeleteAsync(long id)
    {
        var item = await _db.TaskItems.FindAsync(id);
        if (item != null)
        {
            _db.TaskItems.Remove(item);
        }
    }


    public async Task DeleteAsync(List<long> ids)
    {
        var items = await _db.TaskItems.Where(t => ids.Contains(t.Id)).ToListAsync();
        var taskItemIds = items.Select(i => i.Id).ToList();

        var userNotifications = await _db.UserNotifications.Where(n => n.TaskItemId.HasValue && taskItemIds.Contains(n.TaskItemId.Value)).ToListAsync();
        if (userNotifications.Any())
        {
            await _db.BulkDeleteAsync(userNotifications);
        }

        var userPins = await _db.UserTaskItemPins.Where(p => taskItemIds.Contains(p.TaskItemId)).ToListAsync();
        if (userPins.Any())
        {
            await _db.BulkDeleteAsync(userPins);
        }

        var comments = await _db.TaskComments.Where(c => taskItemIds.Contains(c.TaskItemId)).ToListAsync();
        if (comments.Any())
        {
            await _db.BulkDeleteAsync(comments);
        }

        // var allowanceHistories = await _db.AllowanceHistoryTaskItems.Where(a => taskItemIds.Contains(a.TaskItemId)).ToListAsync();
        // if (allowanceHistories.Any())
        // {
        //     await _db.BulkDeleteAsync(allowanceHistories);
        // }

        await _db.BulkDeleteAsync(items);
    }

    public async Task PinAsync(long taskId, long userId, bool pin = true)
    {
        var item = await _db.TaskItems.FindAsync(taskId);
        if (item == null)
        {
            throw new ArgumentException($"TaskItem with Id {taskId} not found");
        }

        var existingPin = await _db.UserTaskItemPins.FirstOrDefaultAsync(p => p.UserId == userId && p.TaskItemId == taskId);
        if (pin)
        {
            if (existingPin == null)
            {
                item.UserPins.Add(new UserTaskItemPin
                {
                    UserId = userId,
                    TaskItemId = taskId
                });
            }
        }
        else
        {
            if (existingPin != null)
            {
                item.UserPins.Remove(existingPin);
            }
        }
        item.UpdatedBy = userId;
        item.UpdatedAt = DateTimeOffset.UtcNow;
        _db.TaskItems.Update(item);
        //  await _db.SaveChangesAsync();
    }

    public async Task PinAsync(List<long> ids, long userId, bool pin = true)
    {
        var items = await _db.TaskItems
            .Include(t => t.UserPins)
            .Where(t => ids.Contains(t.Id))
            .ToListAsync();

        var pinsToInsert = new List<UserTaskItemPin>();
        var pinsToDelete = new List<UserTaskItemPin>();

        foreach (var item in items)
        {
            var existingPin = item.UserPins.FirstOrDefault(p => p.UserId == userId);
            if (pin)
            {
                if (existingPin == null)
                {
                    pinsToInsert.Add(new UserTaskItemPin
                    {
                        UserId = userId,
                        TaskItemId = item.Id
                    });
                }
            }
            else
            {
                if (existingPin != null)
                {
                    pinsToDelete.Add(existingPin);
                }
            }
            item.UpdatedBy = userId;
            item.UpdatedAt = DateTimeOffset.UtcNow;
        }

        // Update TaskItems
        await _db.BulkUpdateAsync(items);

        // Insert new pins
        if (pinsToInsert.Any())
        {
            await _db.BulkInsertAsync(pinsToInsert);
        }

        // Delete removed pins
        if (pinsToDelete.Any())
        {
            await _db.BulkDeleteAsync(pinsToDelete);
        }
    }

    public async Task<TaskItem?> GetAsync(long id)
        => await _db.TaskItems
            .AsSplitQuery()
            .Include(g => g.Grade)
            .Include(p => p.UserPins)
            .FirstOrDefaultAsync(g => g.Id == id);

    public async Task<TaskItem?> GetTaskItemEntityDetailsAsync(long id)
        => await _db.TaskItems
            .AsSplitQuery()
            .Include(g => g.Group)
            .Include(g => g.Kind)
            .Include(g => g.Category)
            .Include(g => g.Grade)
            .Include(g => g.UserPins)
            .Include(g => g.TeamAllowanceInterval)
            .FirstOrDefaultAsync(g => g.Id == id);

    public async Task<TaskItem?> GetTaskItemEntityDetailsForUpdateAsync(long id)
        => await _db.TaskItems
            .AsSplitQuery()
            .Include(g => g.Group)
            .Include(g => g.Kind)
            .Include(g => g.Category)
            .Include(g => g.Grade)
            .Include(g => g.TeamAllowanceInterval)
            .Include(g => g.UserPins)
            .Include(g => g.UpdatedByUser)
            .Include(g => g.CreatedByUser)
            .Include(g => g.AssignedToUser)
            .Include(g => g.CompletedByUser)
            .Include(g => g.BonusStatusByUser)
            .Include(g => g.AllowanceApprovalStatusByUser)
            .FirstOrDefaultAsync(g => g.Id == id);

    // TODO: this is not really used.  But main screen should be changed to use it whereas GetListDetailsAsync should be used for detailed views.
    public async Task<IEnumerable<TaskItem>> GetListAsync(long userId)
    {
        var (isAdmin, teamId) = GetUserDetails(userId);

        if (isAdmin)
        {
            return await _db.TaskItems
                .Include(t => t.UserPins)
                .Where(t => t.TeamId == teamId && (t.CreatedBy == userId || t.AssignedTo == userId || !t.IsPrivate))
                .OrderByDescending(t => t.UserPins.Any(p => p.UserId == userId && p.TaskItemId == t.Id))
                .ThenByDescending(t => t.IsArchived)
                .ThenByDescending(t => t.IsActive)
                .ThenByDescending(t => t.Priority)
                .ThenBy(t => t.PercentComplete)
                .ThenBy(t => t.Name)
                .ToListAsync();
        }

        return await _db.TaskItems
            .Where(t => t.AssignedTo == userId || t.CreatedBy == userId)
            .ToListAsync();
    }

    // TODO: this is not really used
    public async Task<IEnumerable<TaskItem>> GetListDetailsAsync(long userId)
    {
        var (isAdmin, teamId) = GetUserDetails(userId);
        var query = _db.TaskItems
            .AsSplitQuery()
            .Include(g => g.Group)
            .Include(k => k.Kind)
            .Include(c => c.Category)
            .Include(t => t.Grade)
            .Include(t => t.UserPins)
            .Include(t => t.TeamAllowanceInterval)
            .OrderByDescending(t => t.UserPins.Any(p => p.UserId == userId && p.TaskItemId == t.Id))
            .ThenByDescending(t => t.IsArchived)
            .ThenByDescending(t => t.IsActive)
            .ThenByDescending(t => t.Priority)
            .ThenBy(t => t.PercentComplete)
            .ThenBy(t => t.Name)
            .AsQueryable();

        if (isAdmin)
        {
            query = query.Where(t => t.TeamId == teamId && (t.CreatedBy == userId || t.AssignedTo == userId || !t.IsPrivate));
        }
        else
        {
            query = query.Where(t => t.AssignedTo == userId || t.CreatedBy == userId);
        }

        return await query.ToListAsync();
    }

    public async Task SaveChangesAsync()
        => await _db.SaveChangesAsync();

    public Task SetCompleteAsync(List<long> taskItemIds, long userId, bool complete = true)
    {
        var items = _db.TaskItems
            .Where(t => taskItemIds.Contains(t.Id))
            .ToList();

        items.ForEach(t =>
        {
            t.PercentComplete = (byte)(complete ? 100 : 0);
            t.CompletedAt = DateTimeOffset.UtcNow;
            t.CompletedBy = userId;
            t.UpdatedBy = userId;
            t.UpdatedAt = DateTimeOffset.UtcNow;
        });

        return _db.BulkUpdateAsync(items);
    }

    public async Task SetCompleteAsync(long id, long userId, bool complete = true)
    {
        var item = await _db.TaskItems.FindAsync(id);
        if (item != null)
        {
            item.PercentComplete = (byte)(complete ? 100 : 0);
            item.CompletedAt = DateTimeOffset.UtcNow;
            item.CompletedBy = userId;
            item.UpdatedBy = userId;
            item.UpdatedAt = DateTimeOffset.UtcNow;
            _db.TaskItems.Update(item);
        }
    }

    public async Task SetActiveAsync(List<long> taskItemIds, long userId, bool active = true)
    {
        var items = await _db.TaskItems
            .Where(t => taskItemIds.Contains(t.Id))
            .ToListAsync();

        items.ForEach(t =>
            {
                t.IsActive = active;
                t.ActiveBy = userId;
                t.ActiveAt = DateTimeOffset.UtcNow;
                t.UpdatedBy = userId;
                t.UpdatedAt = DateTimeOffset.UtcNow;
            });

        await _db.BulkUpdateAsync(items);
    }

    public async Task SetActiveAsync(long id, long userId, bool active = true)
    {
        var item = await _db.TaskItems.FindAsync(id);
        if (item != null)
        {
            item.IsActive = active;
            item.ActiveBy = userId;
            item.ActiveAt = DateTimeOffset.UtcNow;
            item.UpdatedBy = userId;
            item.UpdatedAt = DateTimeOffset.UtcNow;
            _db.TaskItems.Update(item);
        }
    }

    public async Task<TaskItem> CopyAsync(long id, long userId)
    {
        var item = await _db.TaskItems.FindAsync(id);
        if (item == null)
            throw new ArgumentException("TaskItem not found");


        var newItem = new TaskItem
        {
            TeamId = item.TeamId,
            GroupId = item.GroupId,
            KindId = item.KindId,
            CategoryId = item.CategoryId,
            Name = item.Name + " Copy",
            Description = item.Description,
            IsActive = item.IsActive,
            IsPrivate = item.IsPrivate,
            Priority = item.Priority,
            Credits = item.Credits,
            GradeId = null,
            MaxBonus = item.MaxBonus,
            PercentComplete = 0,
            DueAt = item.DueAt,
            StartAt = item.StartAt,
            EndAt = item.EndAt,
            AssignedTo = userId,
            AssignedBy = userId,
            AssignedAt = DateTimeOffset.UtcNow,
            ActiveAt = item.IsActive ? DateTimeOffset.UtcNow : null,
            ActiveBy = item.IsActive ? userId : null,
            CompletedAt = item.PercentComplete == 100 ? DateTimeOffset.UtcNow : null,
            CompletedBy = item.PercentComplete == 100 ? userId : null,
            ArchivedAt = item.ArchivedAt,
            ArchivedBy = item.ArchivedBy.HasValue ? userId : null,
            GradedAt = null,
            GradedBy = null,
            CreatedBy = userId,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        _db.TaskItems.Add(newItem);

        var IsPinned = item.UserPins.Any(p => p.UserId == userId && p.TaskItemId == item.Id);
        if (IsPinned)
        {
            newItem.UserPins.Add(new UserTaskItemPin
            {
                UserId = userId,
                TaskItemId = newItem.Id
            });
        }

        return newItem;
    }

    public IQueryable<TaskItem> GetBaseQuery(long userId)
    {
        var (isAdmin, teamId) = GetUserDetails(userId);

        var query = _db.TaskItems
           .AsSplitQuery()
           .Include(t => t.UserPins)
           .Where(t => t.TeamId == teamId && (t.AssignedTo == userId || t.CreatedBy == userId || !t.IsPrivate));

        return query;
    }

    public IQueryable<TaskItem> GetBaseDetailsQuery(long userId)
    {
        var query = GetBaseQuery(userId)
            .Include(t => t.Group)
            .Include(t => t.Kind)
            .Include(t => t.Category)
            .Include(t => t.Grade)
            .Include(t => t.TeamAllowanceInterval);

        return query;
    }

    public IQueryable<TaskItem> GetAccreditedBaseQueryForAllowanceRecalculation(long userId, long? teamAllowanceIntervalId, DateTimeOffset startDate, DateTimeOffset endDate)
    {
        var query = _db.TaskItems
            .Include(t => t.Grade)
            .Where(t => t.AssignedTo == userId);

        query = ApplyAccreditedFilterAsync(query, teamAllowanceIntervalId, startDate, endDate);

        return query;
    }

    public IQueryable<TaskItem> GetAccreditedBaseQueryForAllowanceRecalculation(long userId, long teamAllowanceIntervalId)
    {
        var query = _db.TaskItems
            .Include(t => t.Grade)
            .Where(t => t.AssignedTo == userId && t.TeamAllowanceIntervalId == teamAllowanceIntervalId);

        query = ApplyAccreditedFilterAsync(query);

        return query;
    }



    public IQueryable<TaskItem> ApplyAccreditedFilterAsync(IQueryable<TaskItem> query, long? teamAllowanceIntervalId, DateTimeOffset startDate, DateTimeOffset endDate)
    {
        return query
            .Where(t => t.TeamAllowanceIntervalId == teamAllowanceIntervalId && t.IsApprovedForAllowance == true && t.AssignedTo.HasValue && t.Credits.HasValue && t.Credits.Value > 0
                && t.GradeId.HasValue && t.GradedAt.HasValue && t.GradedAt.Value >= startDate && t.GradedAt.Value <= endDate && !t.IsArchived && !t.IsPrivate);
    }

    public IQueryable<TaskItem> ApplyAccreditedFilterAsync(IQueryable<TaskItem> query)
    {
        return query
            .Where(t => t.IsApprovedForAllowance == true && t.Credits.HasValue && t.Credits.Value > 0);
    }

    public IQueryable<TaskItem> ApplyPrivateTasksFilterAsync(IQueryable<TaskItem> query, long userId)
    {
        return query.Where(t => t.IsPrivate && t.CreatedBy == userId);
    }

    public IQueryable<TaskItem> ApplyAllowanceNeedReviwFilterAsync(IQueryable<TaskItem> query)
    {
        return query
            .Where(t => t.IsApprovedForAllowance == true && t.AssignedTo.HasValue && t.Credits.HasValue && t.Credits.Value > 0
                && !t.GradeId.HasValue && t.PercentComplete == 100 && !t.IsArchived == false && !t.IsPrivate);
    }

    public IQueryable<TaskItem> ApplyBonusFilterAsync(IQueryable<TaskItem> query)
    {
        return query
            .Where(t => t.MaxBonus != null && t.MaxBonus.Trim() != string.Empty);
    }

    public IQueryable<TaskItem> ApplyNoBonusFilterAsync(IQueryable<TaskItem> query)
    {
        return query
            .Where(t => t.MaxBonus == null || t.MaxBonus.Trim() == string.Empty);
    }

    public IQueryable<TaskItem> ApplyCurrentBonusFilterAsync(IQueryable<TaskItem> query, DateTimeOffset startAt, DateTimeOffset endAt)
    {
        query = ApplyBonusFilterAsync(query);
        query = query.Where(t => (t.BonusStatusAt == null || (t.BonusStatusAt >= startAt && t.BonusStatusAt <= endAt)) && !t.IsPrivate);
        return query;
    }

    public IQueryable<TaskItem> ApplyNeedsReviewBonusFilterAsync(IQueryable<TaskItem> query)
    {
        query = ApplyBonusFilterAsync(query);
        return query.Where(t => t.CompletedAt != null && t.BonusStatusAt == null && !t.IsPrivate);
    }

    public IQueryable<TaskItem> ApplyApprovedBonusFilterAsync(IQueryable<TaskItem> query)
    {
        query = ApplyBonusFilterAsync(query);
        return query.Where(t => t.ApprovedBonus != null && t.ApprovedBonus.Trim() != string.Empty && t.BonusStatusAt != null && !t.IsBonusRejected && !t.IsPrivate);
    }

    public IQueryable<TaskItem> ApplyRejectedBonusFilterAsync(IQueryable<TaskItem> query)
    {
        query = ApplyBonusFilterAsync(query);
        return query.Where(t => t.IsBonusRejected && t.BonusStatusAt != null && !t.IsPrivate);
    }

    public IQueryable<TaskItem> ApplyClaimedBonusFilterAsync(IQueryable<TaskItem> query)
    {
        query = ApplyBonusFilterAsync(query);
        return query.Where(t => t.BonusClaimedAt != null && !t.IsPrivate);
    }

    public IQueryable<TaskItem> ApplyNotClaimedBonusFilterAsync(IQueryable<TaskItem> query)
    {
        query = ApplyBonusFilterAsync(query);
        return query.Where(t => t.BonusClaimedAt == null && !t.IsPrivate);
    }

    // Batched versions for notification processing
    public async Task<List<TaskItem>> GetTasksDueSoonBatchAsync(int skip, int take)
    {
        var now = _dateTimeProvider.UtcNow;
        var soon = now.AddDays(2);

        return await _db.TaskItems
            .Where(t => !t.IsArchived && t.DueAt.HasValue && t.DueAt >= now && t.DueAt.Value.Date == soon.Date)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<List<TaskItem>> GetTasksDueTodayBatchAsync(int skip, int take)
    {
        var now = _dateTimeProvider.UtcNow;

        return await _db.TaskItems
            .Where(t => !t.IsArchived && t.DueAt.HasValue && t.DueAt.Value.Date == now.Date)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<List<TaskItem>> GetTasksStartingSoonBatchAsync(int skip, int take)
    {
        var now = _dateTimeProvider.UtcNow;
        var soon = now.AddDays(2);

        return await _db.TaskItems
            .Where(t => !t.IsArchived && t.StartAt.HasValue && t.StartAt.Value.Date >= now.Date && t.StartAt.Value.Date <= soon.Date)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<List<TaskItem>> GetTasksStartingTodayBatchAsync(int skip, int take)
    {
        var now = _dateTimeProvider.UtcNow;

        return await _db.TaskItems
            .Where(t => !t.IsArchived && t.StartAt.HasValue && t.StartAt.Value.Date == now.Date)
            .OrderBy(t => t.Id)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<List<TaskItem>> GetTasksEndingSoonBatchAsync(int skip, int take)
    {
        var now = _dateTimeProvider.UtcNow;
        var soon = now.AddDays(2);

        return await _db.TaskItems
            .Where(t => !t.IsArchived && t.EndAt.HasValue && t.EndAt.Value.Date >= now.Date && t.EndAt.Value.Date <= soon.Date)
            .OrderBy(t => t.Id)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<List<TaskItem>> GetTasksEndingTodayBatchAsync(int skip, int take)
    {
        var now = _dateTimeProvider.UtcNow;

        return await _db.TaskItems
            .Where(t => !t.IsArchived && t.EndAt.HasValue && t.EndAt.Value.Date == now.Date)
            .OrderBy(t => t.Id)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    // Count methods for batched processing
    public async Task<int> GetTasksDueSoonCountAsync()
    {
        var now = _dateTimeProvider.UtcNow;
        var soon = now.AddDays(2);

        return await _db.TaskItems
            .Where(t => !t.IsArchived && t.DueAt.HasValue && t.DueAt >= now && t.DueAt.Value.Date == soon.Date)
            .CountAsync();
    }

    public async Task<int> GetTasksDueTodayCountAsync()
    {
        var now = _dateTimeProvider.UtcNow;

        return await _db.TaskItems
            .Where(t => !t.IsArchived && t.DueAt.HasValue && t.DueAt.Value.Date == now.Date)
            .CountAsync();
    }

    public async Task<int> GetTasksStartingSoonCountAsync()
    {
        var now = _dateTimeProvider.UtcNow;
        var soon = now.AddDays(2);

        return await _db.TaskItems
            .Where(t => !t.IsArchived && t.StartAt.HasValue && t.StartAt.Value.Date >= now.Date && t.StartAt.Value.Date <= soon.Date)
            .CountAsync();
    }

    public async Task<int> GetTasksStartingTodayCountAsync()
    {
        var now = _dateTimeProvider.UtcNow;

        return await _db.TaskItems
            .Where(t => !t.IsArchived && t.StartAt.HasValue && t.StartAt.Value.Date == now.Date)
            .CountAsync();
    }

    public async Task<int> GetTasksEndingSoonCountAsync()
    {
        var now = _dateTimeProvider.UtcNow;
        var soon = now.AddDays(2);

        return await _db.TaskItems
            .Where(t => !t.IsArchived && t.EndAt.HasValue && t.EndAt.Value.Date >= now.Date && t.EndAt.Value.Date <= soon.Date)
            .CountAsync();
    }

    public async Task<int> GetTasksEndingTodayCountAsync()
    {
        var now = _dateTimeProvider.UtcNow;

        return await _db.TaskItems
            .Where(t => !t.IsArchived && t.EndAt.HasValue && t.EndAt.Value.Date == now.Date)
            .CountAsync();
    }

    public async Task<List<TaskItem>> GetListAsync(List<long> ids)
    {
        return await _db.TaskItems
            .Where(t => ids.Contains(t.Id))
            .ToListAsync();
    }

    public async Task<string> GetTaskDetails(long id)
    {
        return await _db.TaskItems
            .Where(t => t.Id == id)
            .Select(t => t.Details)
            .FirstOrDefaultAsync() ?? string.Empty;
    }

    public async Task ResetTaskGradesForEndedAllowanceIntervalAsync(long intervalId)
    {
        await _db.Database.ExecuteSqlRawAsync(@"
            UPDATE ""TaskItems""
            SET 
                ""GradeId"" = NULL,
                ""GradedAt"" = NULL,
                ""GradedBy"" = NULL
            WHERE ""TeamAllowanceIntervalId"" = {0}
        ", intervalId);
    }

    public async Task<int> GetCountByTeamIdAsync(long teamId)
    {
        return await _db.TaskItems
            .Where(t => t.TeamId == teamId)
            .CountAsync();
    }

    public async Task<int> GetUnarchivedCountByTeamIdAsync(long teamId)
    {
        return await _db.TaskItems
            .Where(t => t.TeamId == teamId && !t.IsArchived)
            .CountAsync();
    }

}
