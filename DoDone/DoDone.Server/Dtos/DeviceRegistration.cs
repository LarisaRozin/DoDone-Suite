/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;

namespace DoDone.Server.Dtos;

public class DeviceRegistrationRequest
{
    public required string DeviceId { get; set; }
    public required string FcmToken { get; set; }
    public string Platform { get; set; } = null!;  // "android" or "ios"
    public string Timezone { get; set; } = null!;
}

// public class NotificationPreferencesRequest
// {
//     [Required]
//     public string UserId { get; set; }
    
//     public bool TaskAssigned { get; set; } = true;
//     public bool TaskCompleted { get; set; } = true;
//     public bool TaskDueSoon { get; set; } = true;
//     public bool TaskOverdue { get; set; } = true;
//     public bool TeamUpdates { get; set; } = true;
//     public bool WeeklyDigest { get; set; } = true;
// }

// public class NotificationPreferencesResponse
// {
//     public string UserId { get; set; }
//     public bool TaskAssigned { get; set; }
//     public bool TaskCompleted { get; set; }
//     public bool TaskDueSoon { get; set; }
//     public bool TaskOverdue { get; set; }
//     public bool TeamUpdates { get; set; }
//     public bool WeeklyDigest { get; set; }
// }

// public class UserDevice
// {
//     public int Id { get; set; }
//     public required long UserId { get; set; }
//     public required string FcmToken { get; set; }
//     public string? Platform { get; set; }
//     public required string DeviceId { get; set; }
//     public DateTime CreatedAt { get; set; }
//     public DateTime LastUsed { get; set; }
//     public bool IsActive { get; set; } = true;
// }

// public class NotificationPreferences
// {
//     public int Id { get; set; }
//     public required long UserId { get; set; }
//     public bool TaskAssigned { get; set; } = true;
//     public bool TaskCompleted { get; set; } = true;
//     public bool TaskDueSoon { get; set; } = true;
//     public bool TaskOverdue { get; set; } = true;
//     public bool TeamUpdates { get; set; } = true;
//     public bool WeeklyDigest { get; set; } = true;
//     public DateTime UpdatedAt { get; set; }
// }