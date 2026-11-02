/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using System.DirectoryServices.Protocols;
using DoDone.Db.Repositories;
using DoDone.Server.Dtos;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Server.Services;

public interface IUserDeviceRegistrationService
{
    Task RegisterDeviceAsync(DeviceRegistrationRequest request, long? userId = null); 
    Task UnregisterDeviceAsync(string fcmToken);
    Task<string?> GetUserTimezoneAsync(long userId);
}

public class UserDeviceRegistrationService : IUserDeviceRegistrationService
{
    private readonly IUserDevicesRepository _userDevicesRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<UserDeviceRegistrationService> _logger;

    public UserDeviceRegistrationService(IUserDevicesRepository userDevicesRepository
                                        , ICurrentUserService currentUserService
                                        , ILogger<UserDeviceRegistrationService> logger)
    {
        _userDevicesRepository = userDevicesRepository;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<string?> GetUserTimezoneAsync(long userId)
    {
        return await _userDevicesRepository.GetUserTimezoneAsync(userId);
    }

    public async Task RegisterDeviceAsync(DeviceRegistrationRequest request, long? userId = null)
    {
       try
       {
            TimeZoneInfo.TryConvertIanaIdToWindowsId(request.Timezone, out string? windowsId);

            if (string.IsNullOrWhiteSpace(windowsId))
            {
                _logger.LogWarning("Invalid timezone ID: {Timezone}", request.Timezone);
            }

            var deviceRegistration = new Db.Models.UserDevices
            {
                UserId = userId ?? _currentUserService.UserId,
                DeviceId = request.DeviceId,
                FcmToken = request.FcmToken,
                Platform = request.Platform,
                Timezone = windowsId ?? request.Timezone,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                LastSeenAt = DateTimeOffset.UtcNow
            };

            try
            {
                await _userDevicesRepository.UpsertAsync(deviceRegistration);
            } 
            catch (DbUpdateException dbEx)
            {
                if (dbEx.InnerException != null && dbEx.InnerException.Message.Contains("duplicate key value violates unique constraint"))
                {
                    _logger.LogWarning("Unique constraint violation when registering device for UserId: {UserId}, DeviceId: {DeviceId}", deviceRegistration.UserId, deviceRegistration.DeviceId);
                }
            }
       }
       catch (Exception ex)
       {
           _logger.LogError(ex, "Error in RegisterDeviceAsync for user {UserId}", userId ?? _currentUserService.UserId);
           // don't fail on device registration errors
       }
    }

    public async Task UnregisterDeviceAsync(string fcmToken)
    {
        var userDevices = await _userDevicesRepository.GetUserDevicesAsync(_currentUserService.UserId);
        var deviceToRemove = userDevices.FirstOrDefault(d => d.FcmToken == fcmToken);
        if (deviceToRemove != null)
        {
            await _userDevicesRepository.DeleteAsync(deviceToRemove.Id);
            await _userDevicesRepository.SaveChangesAsync();
        }
    }
}
