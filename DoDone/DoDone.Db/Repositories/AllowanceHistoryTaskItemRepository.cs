/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using EFCore.BulkExtensions;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Db.Repositories;

public interface IAllowanceHistoryTaskItemRepository
{
    // Task<List<AllowanceHistoryTaskItems>> GetByAllowanceHistoryIdAsync(long allowanceHistoryId);
    // Task AddAsync(AllowanceHistoryTaskItems item);
    // Task UpdateAsync(AllowanceHistoryTaskItems item);
    Task DeleteAsync(List<long> ids);
    Task CreateAsync(List<AllowanceHistoryTaskItems> items);
    Task UpdateAsync(List<AllowanceHistoryTaskItems> items);
    IQueryable<AllowanceHistoryTaskItems> GetBaseQuery(long allowanceHistoryId);
}

public class AllowanceHistoryTaskItemRepository : IAllowanceHistoryTaskItemRepository
{
    private readonly DoDoneDbContext _db;

    public AllowanceHistoryTaskItemRepository(DoDoneDbContext db)
    {
        _db = db;
    }

    public async Task<List<AllowanceHistoryTaskItems>> GetByAllowanceHistoryIdAsync(long allowanceHistoryId)
    {
        return await _db.AllowanceHistoryTaskItems
            .Where(x => x.AllowanceHistoryId == allowanceHistoryId)
            .ToListAsync();
    }

    public async Task AddAsync(AllowanceHistoryTaskItems item)
    {
        await _db.AllowanceHistoryTaskItems.AddAsync(item);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(AllowanceHistoryTaskItems item)
    {
        _db.AllowanceHistoryTaskItems.Update(item);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(List<long> ids)
    {
        var items = await _db.AllowanceHistoryTaskItems.Where(t => ids.Contains(t.Id)).ToListAsync();
        await _db.BulkDeleteAsync(items);
    }

    public Task CreateAsync(List<AllowanceHistoryTaskItems> items)
    {
        return _db.BulkInsertAsync(items);
    }

    public Task UpdateAsync(List<AllowanceHistoryTaskItems> items)
    {
        return _db.BulkUpdateAsync(items);
    }

    public IQueryable<AllowanceHistoryTaskItems> GetBaseQuery(long allowanceHistoryId)
    {
        return _db.AllowanceHistoryTaskItems.Where(x => x.AllowanceHistoryId == allowanceHistoryId);
    }
}
