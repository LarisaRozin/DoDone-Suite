/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Enums;
using System.ComponentModel.DataAnnotations;

namespace DoDone.Server.Dtos;

public class UserNotificationPreferenceResponse
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public NotificationType NotificationType { get; set; }
    public NotificationChannel Channel { get; set; }
    public bool IsEnabled { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}

public class UserNotificationPreferenceCreateRequest
{
    [Required]
    public NotificationType NotificationType { get; set; }

    [Required]
    public NotificationChannel Channel { get; set; }

    [Required]
    public bool IsEnabled { get; set; }
}

public class UserNotificationPreferenceUpdateRequest
{
    [Required]
    [Range(1, long.MaxValue, ErrorMessage = "Id must be a positive number")]
    public long Id { get; set; }
    
    [Required]
    public bool IsEnabled { get; set; }
}

public class BulkNotificationPreferenceUpdateRequest
{
    [Required]
    [MinLength(1, ErrorMessage = "At least one preference must be provided")]
    public required List<UserNotificationPreferenceUpdateRequest> Preferences { get; set; }
}

public class BulkNotificationPreferenceCreateRequest
{
    [Required]
    [MinLength(1, ErrorMessage = "At least one preference must be provided")]
    public required List<UserNotificationPreferenceCreateRequest> Preferences { get; set; }
}

