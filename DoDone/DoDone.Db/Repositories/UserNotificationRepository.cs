/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Shared.Enums;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Db.Repositories;

public interface IUserNotificationRepository
{
    Task<UserNotification?> GetExistingTaskItemNotificationAsync(long userId, long? taskItemId, NotificationType notificationType, DateTimeOffset notificationDate);
    Task<UserNotification?> GetExistingAllowanceNotificationAsync(long userId, long? allowanceHistoryId, NotificationType notificationType, DateTimeOffset notificationDate);
    Task<UserNotification> AddAsync(UserNotification userNotification);
    Task AddRangeAsync(IEnumerable<UserNotification> userNotifications);
    Task<UserNotification> UpdateAsync(UserNotification userNotification);
    Task UpdateRangeAsync(IEnumerable<UserNotification> userNotifications);
    Task SaveChangesAsync();
    // Task DeleteAsync(long id);
}

public class UserNotificationRepository : IUserNotificationRepository
{
    private readonly DoDoneDbContext _db;

    public UserNotificationRepository(DoDoneDbContext db)
    {
        _db = db;
    }

    public async Task<UserNotification?> GetExistingTaskItemNotificationAsync(long userId, long? taskItemId, NotificationType notificationType, DateTimeOffset notificationDate)
    {
        return await _db.UserNotifications
                        .FirstOrDefaultAsync(un => un.UserId == userId && un.TaskItemId == taskItemId && un.NotificationType == notificationType && un.NotificationDate.Date == notificationDate.Date);
    }

    public async Task<UserNotification?> GetExistingAllowanceNotificationAsync(long userId, long? allowanceHistoryId, NotificationType notificationType, DateTimeOffset notificationDate)
    {
        return await _db.UserNotifications
                        .FirstOrDefaultAsync(un => un.UserId == userId && un.AllowanceHistoryId == allowanceHistoryId && un.NotificationType == notificationType && un.NotificationDate.Date == notificationDate.Date);
    }

    public async Task<UserNotification> AddAsync(UserNotification userNotification)
    {
        var entry = await _db.UserNotifications.AddAsync(userNotification);
        return entry.Entity;
    }

    public async Task AddRangeAsync(IEnumerable<UserNotification> userNotifications)
    {
        await _db.UserNotifications.AddRangeAsync(userNotifications);
    }

    public async Task<UserNotification> UpdateAsync(UserNotification userNotification)
    {
        var entry = _db.UserNotifications.Update(userNotification);
        return await Task.FromResult(entry.Entity);
    }

    public async Task UpdateRangeAsync(IEnumerable<UserNotification> userNotifications)
    {
        _db.UserNotifications.UpdateRange(userNotifications);
        await Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}

