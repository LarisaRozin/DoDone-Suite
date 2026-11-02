/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using Microsoft.EntityFrameworkCore;
using EFCore.BulkExtensions;

namespace DoDone.Db.Repositories;

public interface ITaskGroupRepository : IRepositoryBase<TaskGroup>
{ }

public class TaskGroupRepository : ITaskGroupRepository
{
    private readonly DoDoneDbContext _db;

    public TaskGroupRepository(DoDoneDbContext db)
    {
        _db = db;
    }

    private long GetTeamId(long userId)
    {
        return _db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.TeamId)
            .First();
    }


    public async Task CreateAsync(TaskGroup group)
        => await _db.TaskGroups.AddAsync(group);

    public async Task<TaskGroup?> GetAsync(long id)
        => await _db.TaskGroups
            .FirstOrDefaultAsync(g => g.Id == id);

    public async Task<TaskGroup?> GetTaskItemEntityDetailsAsync(long id)
        => await _db.TaskGroups
            .AsSplitQuery()
            .Include(g => g.Kinds)
            .Include(g => g.CreatedByUser)
            .Include(g => g.UpdatedByUser)
            .FirstOrDefaultAsync(g => g.Id == id);

    public async Task<IEnumerable<TaskGroup>> GetListAsync(long userId)
    {
        var teamId = GetTeamId(userId);
        return await _db.TaskGroups
            .Where(g => g.UserId == userId || g.TeamId == teamId)
            .ToListAsync();
    }

    public async Task<IEnumerable<TaskGroup>> GetListDetailsAsync(long userId)
    {
        var teamId = GetTeamId(userId);
        return await _db.TaskGroups
            .AsSplitQuery()
            .Include(g => g.CreatedByUser)
            .Include(g => g.UpdatedByUser)
            .Include(g => g.Kinds)
            .ThenInclude(k => k.Categories)
            .Where(g => g.UserId == userId || g.TeamId == teamId)
            .ToListAsync();
    }
    public Task UpdateAsync(TaskGroup group)
    {
        var entry = _db.Entry(group);
        entry.State = EntityState.Modified;

        return Task.CompletedTask;
    }

    public async Task UpdateRangeAsync(IEnumerable<TaskGroup> groups)
    {
        await _db.BulkUpdateAsync(groups);
    }

    public async Task AddRangeAsync(IEnumerable<TaskGroup> groups)
    {
        await _db.BulkInsertAsync(groups);
    }

    public async Task SaveChangesAsync()
        => await _db.SaveChangesAsync();

    public Task<TaskGroup?> GetByNamesAsync(string name, long userId, long teamId)
    {
        return _db.TaskGroups
            .AsSplitQuery()
            .Include(g => g.Kinds)
            .ThenInclude(k => k.Categories)
            .Include(u => u.CreatedByUser)
            .Include(u => u.UpdatedByUser)
            .FirstOrDefaultAsync(g => g.Name == name && (g.UserId == userId || g.TeamId == teamId));
    }

    public IQueryable<TaskGroup> GetBaseQuery(long parentId)
    {
        var teamId = GetTeamId(parentId);
        return _db.TaskGroups.Where(g => g.UserId == parentId || g.TeamId == teamId);
    }

    public IQueryable<TaskGroup> GetBaseDetailsQuery(long parentId)
    {
        var teamId = GetTeamId(parentId);
        return _db.TaskGroups
            .AsSplitQuery()
            .Include(g => g.Kinds)
            .ThenInclude(k => k.Categories)
            .Include(g => g.CreatedByUser)
            .Include(g => g.UpdatedByUser)
            .Where(g => g.UserId == parentId || g.TeamId == teamId);
    }

    public async Task DeleteAsync(long id)
    {
        var group = await _db.TaskGroups.FindAsync(id);
        if (group != null)
        {
            _db.TaskGroups.Remove(group);
        }
    }
}