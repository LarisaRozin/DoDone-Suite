/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Db.Repositories;

public interface ITaskCategoryRepository : IRepositoryBase<TaskCategory>
{ }

public class TaskCategoryRepository : ITaskCategoryRepository
{
    private readonly DoDoneDbContext _db;

    public TaskCategoryRepository(DoDoneDbContext db)
    {
        _db = db;
    }

    public async Task<TaskCategory?> GetAsync(long id)
    {
        return await _db.TaskCategories.FindAsync(id);
    }


    public async Task<TaskCategory?> GetTaskItemEntityDetailsAsync(long id)
        => await _db.TaskCategories
            .AsSplitQuery()
            .Include(c => c.CreatedByUser)
            .Include(c => c.UpdatedByUser)
            .FirstOrDefaultAsync(c => c.Id == id);

    public async Task<IEnumerable<TaskCategory>> GetListAsync(long kindId)
    {
        return await _db.TaskCategories
            .Where(c => c.KindId == kindId)
            .ToListAsync();
    }

    public async Task<IEnumerable<TaskCategory>> GetListDetailsAsync(long kindId)
    {
        return await _db.TaskCategories
            .AsSplitQuery()
            .Include(c => c.CreatedByUser)
            .Include(c => c.UpdatedByUser)
            .Where(c => c.KindId == kindId)
            .ToListAsync();
    }

    public async Task CreateAsync(TaskCategory category)
    {
        await _db.TaskCategories.AddAsync(category);
    }

    public async Task UpdateAsync(TaskCategory category)
    {
        _db.TaskCategories.Update(category);
        await Task.CompletedTask;
    }

    public Task SaveChangesAsync()
    {
        return _db.SaveChangesAsync();
    }

    public IQueryable<TaskCategory> GetBaseQuery(long parentId)
    {
        return _db.TaskCategories.Where(c => c.KindId == parentId);
    }

    public IQueryable<TaskCategory> GetBaseDetailsQuery(long parentId)
    {
        return _db.TaskCategories
            .AsSplitQuery()
            .Include(c => c.CreatedByUser)
            .Include(c => c.UpdatedByUser)
            .Where(c => c.KindId == parentId);
    }

    public async Task DeleteAsync(long id)
    {
        var category = await _db.TaskCategories.FindAsync(id);
        if (category != null)
        {
            _db.TaskCategories.Remove(category);
        }
    }
}
