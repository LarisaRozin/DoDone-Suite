/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Server.Dtos;

namespace DoDone.Server.Extensions;

public static class UserNotificationPreferenceExtensions
{
    public static UserNotificationPreferenceResponse ToDto(this UserNotificationPreference preference)
    {
        if (preference == null)
            throw new ArgumentNullException(nameof(preference), "UserNotificationPreference cannot be null");

        return new UserNotificationPreferenceResponse
        {
            Id = preference.Id,
            UserId = preference.UserId,
            NotificationType = preference.NotificationType,
            Channel = preference.Channel,
            IsEnabled = preference.IsEnabled,
            CreatedAt = preference.CreatedAt,
            UpdatedAt = preference.UpdatedAt
        };
    }

    public static List<UserNotificationPreferenceResponse> ToDto(this List<UserNotificationPreference> preferences)
    {
        return preferences.Select(p => p.ToDto()).ToList();
    }
}
