/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Db.Repositories;

public interface IFailedWebhookNotificationRepository
{
    Task<FailedWebhookNotification> CreateAsync(FailedWebhookNotification notification);
    Task<FailedWebhookNotification> UpdateAsync(FailedWebhookNotification notification);
    Task<List<FailedWebhookNotification>> GetPendingRetriesAsync(int limit = 100);
    Task<FailedWebhookNotification?> GetByIdAsync(long id);
    Task<int> GetPendingCountAsync();
}

public class FailedWebhookNotificationRepository : IFailedWebhookNotificationRepository
{
    private readonly DoDoneDbContext _context;

    public FailedWebhookNotificationRepository(DoDoneDbContext context)
    {
        _context = context;
    }

    public async Task<FailedWebhookNotification> CreateAsync(FailedWebhookNotification notification)
    {
        notification.CreatedAt = DateTimeOffset.UtcNow;
        _context.FailedWebhookNotifications.Add(notification);
        await _context.SaveChangesAsync();
        return notification;
    }

    public async Task<FailedWebhookNotification> UpdateAsync(FailedWebhookNotification notification)
    {
        _context.FailedWebhookNotifications.Update(notification);
        await _context.SaveChangesAsync();
        return notification;
    }

    /// <summary>
    /// Get webhook notifications that are ready for retry
    /// </summary>
    public async Task<List<FailedWebhookNotification>> GetPendingRetriesAsync(int limit = 100)
    {
        var now = DateTimeOffset.UtcNow;
        
        return await _context.FailedWebhookNotifications
            .Where(n => !n.IsProcessed && !n.IsAbandoned && n.NextRetryAt <= now)
            .OrderBy(n => n.NextRetryAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<FailedWebhookNotification?> GetByIdAsync(long id)
    {
        return await _context.FailedWebhookNotifications
            .FirstOrDefaultAsync(n => n.Id == id);
    }

    public async Task<int> GetPendingCountAsync()
    {
        return await _context.FailedWebhookNotifications
            .CountAsync(n => !n.IsProcessed && !n.IsAbandoned);
    }
}
