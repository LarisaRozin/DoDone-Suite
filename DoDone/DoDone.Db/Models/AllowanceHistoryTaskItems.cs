/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Enums;

namespace DoDone.Db.Models;

public class AllowanceHistoryTaskItems
{
    public long Id { get; set; }
    public long AllowanceHistoryId { get; set; }
    public long TaskItemId { get; set; }
    public byte Credits { get; set; }
    public int GradeId { get; set; }
    public byte PercentComplete { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public long? CompletedBy { get; set; }
    public long AssignedTo { get; set; }
    public long AssignedBy { get; set; }
    public DateTimeOffset? AssignedAt { get; set; }
    public DateTimeOffset? GradedAt { get; set; }
    public long? GradedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public TaskItem TaskItem { get; set; } = null!;
    public User CompletedByUser { get; set; } = null!;
    public User AssignedToUser { get; set; } = null!;
    public User AssignedByUser { get; set; } = null!;
    public User? GradedByUser { get; set; } = null!;
    public Grade Grade { get; set; } = null!;
    public AllowanceHistory AllowanceHistory { get; set; } = null!;
}
