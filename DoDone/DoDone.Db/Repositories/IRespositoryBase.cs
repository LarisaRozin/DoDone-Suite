/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Db.Repositories;

public interface IRepositoryBase<T> where T : class
{
    Task<T?> GetAsync(long id);
    Task<T?> GetTaskItemEntityDetailsAsync(long id);
    Task<IEnumerable<T>> GetListAsync(long id);
    Task<IEnumerable<T>> GetListDetailsAsync(long id);
    IQueryable<T> GetBaseQuery(long parentId);
    IQueryable<T> GetBaseDetailsQuery(long parentId);
    Task CreateAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(long id);
    Task SaveChangesAsync();
}