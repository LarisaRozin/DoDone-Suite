/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Db.Models;

public class UserTaskItemPin
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long TaskItemId { get; set; }
    public DateTimeOffset PinnedAt { get; set; } = DateTimeOffset.UtcNow;
    public User User { get; set; } = null!;
    public TaskItem TaskItem { get; set; } = null!;
}