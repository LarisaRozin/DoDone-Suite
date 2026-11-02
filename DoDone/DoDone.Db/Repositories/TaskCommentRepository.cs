/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Db.Repositories;
public interface ITaskCommentRepository
{
    IQueryable<TaskComment> GetBaseQuery(long taskId);
    Task<TaskComment> GetAsync(long commentId);
    Task AddAsync(TaskComment comment);
    Task UpdateAsync(TaskComment comment);
    Task DeleteAsync(long commentId);
}

public class TaskCommentRepository : ITaskCommentRepository
{
    private readonly DoDoneDbContext _context;

    public TaskCommentRepository(DoDoneDbContext context)
    {
        _context = context;
    }

    public IQueryable<TaskComment> GetBaseQuery(long taskId)
    {
        return _context.TaskComments
            .AsSplitQuery()
            .Include(c => c.CreatedByUser)
            .Include(c => c.UpdatedByUser)
            .Where(c => c.TaskItemId == taskId)
            .AsNoTracking();
    }

    public async Task<TaskComment> GetAsync(long commentId)
    {
        var comment = await _context.TaskComments
            .AsSplitQuery()
            .Include(c => c.CreatedByUser)
            .Include(c => c.UpdatedByUser)
            .FirstOrDefaultAsync(c => c.Id == commentId);

        if (comment == null)
            throw new ArgumentException("Comment not found");

        return comment;
    }

    public async Task AddAsync(TaskComment comment)
    {
        _context.TaskComments.Add(comment);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(TaskComment comment)
    {
        _context.TaskComments.Update(comment);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(long commentId)
    {
        var comment = await _context.TaskComments.FindAsync(commentId);
        if (comment == null)
            throw new ArgumentException("Comment not found");

        _context.TaskComments.Remove(comment);
        await _context.SaveChangesAsync();
    }
}
