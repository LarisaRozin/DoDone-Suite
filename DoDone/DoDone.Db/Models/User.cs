/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Microsoft.AspNetCore.Identity;

namespace DoDone.Db.Models;

public class User : IdentityUser<long>
{
    public long TeamId { get; set; }
    public required string FirstName { get; set; } = null!;
    public required string LastName { get; set; } = null!;
    public string? MiddleName { get; set; }
    public string? Salutation { get; set; }
    public string? AvatarUri { get; set; }
    public bool IsAdmin { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public long? CreatedBy { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public bool IsFirstTeamAdmin { get; set; } = false;
    // public DateTimeOffset? LastLoginAt { get; set; }
    public DateTimeOffset? TrialWelcomeSentAt { get; set; }
    public DateTimeOffset? Trial3DayWarningSentAt { get; set; }
    public DateTimeOffset? Trial1DayWarningSentAt { get; set; }
    public DateTimeOffset? TrialExpiredWarningSentAt { get; set; }
    public Team Team { get; set; } = null!;
    public List<TaskGroup> TaskGroups { get; set; } = new();
    public List<TaskItem> AssignedToTasks { get; set; } = new();
    public List<TaskItem> AssignedByTasks { get; set; } = new();
    public List<TaskItem> CreatedByTasks { get; set; } = new();
    public List<TaskItem> UpdatedByTasks { get; set; } = new();
    public List<TaskItem> ActiveByTasks { get; set; } = new();
    public List<TaskItem> CompletedByTasks { get; set; } = new();
    public List<TaskItem> GradedByTasks { get; set; } = new();
    public List<TaskItem> ArchivedByTasks { get; set; } = new();
    public List<TaskItem> BonusStatusByTasks { get; set; } = new();
    public List<TaskItem> AllowanceApprovalStatusByTasks { get; set; } = new();
    public List<AllowanceHistory> UserAllowanceHistories { get; set; } = new();
    public List<AllowanceHistory> ApprovedByAllowanceHistories { get; set; } = new();
    public List<AllowanceHistoryTaskItems> AssignedByAllowanceHistoryTasks { get; set; } = new();
    public List<AllowanceHistoryTaskItems> AssignedToAllowanceHistoryTasks { get; set; } = new();
    public List<AllowanceHistoryTaskItems> GradedByAllowanceHistoryTasks { get; set; } = new();
    public List<AllowanceHistoryTaskItems> CompletedByAllowanceHistoryTasks { get; set; } = new();
    public List<UserDevices> DeviceRegistrations { get; set; } = new();
    public List<UserTaskItemPin> TaskItemPins { get; set; } = new();
    public List<UserNotificationPreference> NotificationPreferences { get; set; } = new();
    public List<UserNotification> Notifications { get; set; } = new();
    public User? CreatedByUser { get; set; }
    public User? UpdatedByUser { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}


