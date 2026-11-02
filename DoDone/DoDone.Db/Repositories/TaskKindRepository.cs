/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using EFCore.BulkExtensions;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Db.Repositories;

public interface ITaskKindRepository : IRepositoryBase<TaskKind>
{ }

public class TaskKindRepository : ITaskKindRepository
{
    private readonly DoDoneDbContext _db;

    public TaskKindRepository(DoDoneDbContext db)
    {
        _db = db;
    }

    public async Task CreateAsync(TaskKind kind)
        => await _db.TaskKinds.AddAsync(kind);

    public async Task<IEnumerable<TaskKind>> GetListAsync(long groupId)
        => await _db.TaskKinds
            .Where(g => g.GroupId == groupId)
            .ToListAsync();

    public async Task<IEnumerable<TaskKind>> GetListDetailsAsync(long groupId)
        => await _db.TaskKinds
            .AsSplitQuery()
            .Include(u => u.CreatedByUser)
            .Include(u => u.UpdatedByUser)
            .Include(g => g.Group)
            .Include(g => g.Categories)
            .Where(g => g.GroupId == groupId)
            .ToListAsync();

    public async Task<TaskKind?> GetAsync(long id)
        => await _db.TaskKinds
            .FirstOrDefaultAsync(g => g.Id == id);

    public async Task<TaskKind?> GetTaskItemEntityDetailsAsync(long id)
        => await _db.TaskKinds
            .AsSplitQuery()
            .Include(u => u.CreatedByUser)
            .Include(u => u.UpdatedByUser)
            .Include(g => g.Group)
            .Include(g => g.Categories)
            .FirstOrDefaultAsync(g => g.Id == id);

    public async Task SaveChangesAsync()
        => await _db.SaveChangesAsync();

    public Task UpdateAsync(TaskKind group)
    {
        var entry = _db.Entry(group);
        entry.State = EntityState.Modified;

        return Task.CompletedTask;
    }

    public async Task UpdateRangeAsync(IEnumerable<TaskKind> kinds)
    {
        await _db.BulkUpdateAsync(kinds);
    }

    public async Task AddRangeAsync(IEnumerable<TaskKind> kinds)
    {
        await _db.BulkInsertAsync(kinds);
    }

    public IQueryable<TaskKind> GetBaseQuery(long parentId)
    {
        return _db.TaskKinds.Where(k => k.GroupId == parentId);
    }

    public IQueryable<TaskKind> GetBaseDetailsQuery(long parentId)
    {
        return _db.TaskKinds
            .AsSplitQuery()
            .Include(k => k.CreatedByUser)
            .Include(k => k.UpdatedByUser)
            .Include(k => k.Categories)
            .Where(k => k.GroupId == parentId);
    }

    public async Task DeleteAsync(long id)
    {
        var kind = await _db.TaskKinds.FindAsync(id);
        if (kind != null)
        {
            _db.TaskKinds.Remove(kind);
        }
    }
}