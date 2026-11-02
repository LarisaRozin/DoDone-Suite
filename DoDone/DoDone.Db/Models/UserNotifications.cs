/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Enums;

namespace DoDone.Db.Models;

public class UserNotification
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long? TaskItemId { get; set; }
    public long? AllowanceHistoryId { get; set; }
    public NotificationType NotificationType { get; set; }
    public string Title { get; set; } = null!;
    public string Body { get; set; } = null!;
    public string Data { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset NotificationDate { get; set; }
    public DateTimeOffset? LastSentAttemptAt { get; set; }
    public DateTimeOffset? SentAt { get; set; }
    public User User { get; set; } = null!;
    public TaskItem? TaskItem { get; set; }
    public AllowanceHistory? AllowanceHistory { get; set; }
}

