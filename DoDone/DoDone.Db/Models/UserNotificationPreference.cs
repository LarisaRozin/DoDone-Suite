/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Enums;

namespace DoDone.Db.Models;

public class UserNotificationPreference
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public NotificationType NotificationType { get; set; }
    public bool IsEnabled { get; set; } = true;
    public NotificationChannel Channel { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    
    public User User { get; set; } = null!;
}
