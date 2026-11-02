/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Db.Repositories;

public interface IUserDevicesRepository
{
    Task UpsertAsync(UserDevices deviceRegistration);
    Task<List<UserDevices>> GetUserDevicesAsync(long userId);
    Task<string> GetUserTimezoneAsync(long userId);
    Task DeleteAsync(long id);
    Task DeleteByFcmTokenAsync(string fcmToken);
    Task SaveChangesAsync();
}

public class UserDevicesRepository : IUserDevicesRepository
{
    private readonly DoDoneDbContext _db;

    public UserDevicesRepository(DoDoneDbContext db)
    {
        _db = db;
    }

    public async Task UpsertAsync(UserDevices deviceRegistration)
    {
        var existing = await _db.DeviceRegistrations
            .FirstOrDefaultAsync(d => d.UserId == deviceRegistration.UserId && d.DeviceId == deviceRegistration.DeviceId);

        if (existing != null)
        {
            existing.FcmToken = deviceRegistration.FcmToken;
            existing.Platform = deviceRegistration.Platform;
            existing.IsActive = deviceRegistration.IsActive;
            existing.Timezone = deviceRegistration.Timezone;
            existing.LastSeenAt = DateTime.UtcNow;
            existing.UpdatedAt = DateTime.UtcNow;
            _db.DeviceRegistrations.Update(existing);
        }
        else
        {
            deviceRegistration.CreatedAt = DateTime.UtcNow;
            _db.DeviceRegistrations.Add(deviceRegistration);
        }
        await _db.SaveChangesAsync();
    }

    public async Task<List<UserDevices>> GetUserDevicesAsync(long userId)
    {
        return await _db.DeviceRegistrations
            .Where(d => d.UserId == userId && d.IsActive)
            .ToListAsync();
    }

    public async Task DeleteAsync(long id)
    {
        var registration = await _db.DeviceRegistrations.FindAsync(id);
        if (registration != null)
        {
            _db.DeviceRegistrations.Remove(registration);
        }
    }

    public async Task DeleteByFcmTokenAsync(string fcmToken)
    {
        var registration = await _db.DeviceRegistrations
            .FirstOrDefaultAsync(d => d.FcmToken == fcmToken);
        if (registration != null)
        {
            _db.DeviceRegistrations.Remove(registration);
            await _db.SaveChangesAsync();
        }
    }

    public Task SaveChangesAsync()
    {
        return _db.SaveChangesAsync();
    }

    public async Task<string> GetUserTimezoneAsync(long userId)
    {
        string? timezone = await _db.DeviceRegistrations
            .Where(d => d.UserId == userId)
            .Select(d => d.Timezone)
            .FirstOrDefaultAsync();

        // if user doesn't have a device registration, assume creator's timezone
        if (string.IsNullOrWhiteSpace(timezone))
        {
            var creatorId = await _db.Users
                .Where(u => u.Id == userId)
                .Select(u => u.CreatedBy)
                .FirstOrDefaultAsync();

            if (creatorId.HasValue)
            {
                timezone = await _db.DeviceRegistrations
                    .Where(d => d.UserId == creatorId.Value)
                    .Select(d => d.Timezone)
                    .FirstOrDefaultAsync();
            }
        }

        if (string.IsNullOrWhiteSpace(timezone))
        {
            timezone = TimeZoneInfo.Utc.Id;
        }

        return timezone ?? string.Empty;
    }
}