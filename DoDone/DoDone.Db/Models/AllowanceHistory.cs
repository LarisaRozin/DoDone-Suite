/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using System.ComponentModel.DataAnnotations;
using DoDone.Shared.Enums;

namespace DoDone.Db.Models;

public class AllowanceHistory
{
    public long Id { get; set; }
    public long TeamId { get; set; }  
    public long UserId { get; set; }
    public long TeamAllowanceIntervalId { get; set; }
    public AllowanceIntervalType AllowanceIntervalType { get; set; }
    public int AllowanceIntervalValue { get; set; }
    public DayOfWeek? StartDayOfWeek { get; set; }
    public int? StartMonthOfYear { get; set; }
    public DateTimeOffset CalculatedStartAt { get; set; }
    public DateTimeOffset ActualStartAt { get; set; }
    public DateTimeOffset CalculatedEndAt { get; set; }  // ActualEndAt == ApprovedAt, if not null, otherwise CalculatedEndAt is the end of the interval
    public long TotalCredits { get; set; }
    public decimal Gpa { get; set; }
    public decimal CalculatedAmount { get; set; }
    public decimal? ApprovedAmount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public long? CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
    public long? ApprovedBy { get; set; }
    public string? Comment { get; set; }  // TODO: Allow for multiple comments
    public DateTimeOffset? ClaimedAt { get; set; }   // TODO: Allow for claims history
    public DateTimeOffset? GradesResetAt { get; set; }
    public User User { get; set; } = null!;
    public User? ApprovedByUser { get; set; } = null!;
    public Team Team { get; set; } = null!;
    public TeamAllowanceInterval AllowanceInterval { get; set; } = null!;
    public List<AllowanceHistoryTaskItems> AllowanceHistoryTaskItems { get; set; } = new();
    public List<UserNotification> Notifications { get; set; } = new();

    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}