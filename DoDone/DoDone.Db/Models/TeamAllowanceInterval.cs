/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

using DoDone.Shared.Enums;

namespace DoDone.Db.Models;

public class TeamAllowanceInterval
{
    public long Id { get; set; }
    public long TeamId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal MaxAllowanceAmount { get; set; }
    public long MinCreditsForAllowance { get; set; }
    public AllowanceIntervalType IntervalType { get; set; }
    public int IntervalValue { get; set; }
    public DayOfWeek? StartDayOfWeek { get; set; }
    public int? StartMonthOfYear { get; set; }
    public bool IsActive { get; set; } = true;
    public bool ResetGradesOnIntervalEnd { get; set; } = true;
    public long CreatedBy { get; set; } 
    public DateTimeOffset CreatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Team Team { get; set; } = null!;
    public List<AllowanceHistory> AllowanceHistories { get; set; } = new();
    public List<AllowanceIntervalGradeConfig> GradeConfigs { get; set; } = new();
    public List<TaskItem> TaskItems { get; set; } = new();
    public List<TeamAllowanceIntervalGradingPeriod> GradingPeriods { get; set; } = new();
    public User CreatedByUser { get; set; } = null!;
    public User? UpdatedByUser { get; set; } = null!;
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}

