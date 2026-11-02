/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using System.ComponentModel.DataAnnotations;
using DoDone.Server.Dtos.Common;
using DoDone.Server.Extensions;
using DoDone.Shared.Enums;

namespace DoDone.Server.Dtos;

public class AllowanceHistoryResponse
{
    public long Id { get; set; }
    public long TeamId { get; set; }
    public long TeamAllowanceIntervalId { get; set; }
    public string TeamAllowanceIntervalName { get; set; } = null!;
    public AllowanceIntervalType AllowanceIntervalType { get; set; }
    public int AllowanceIntervalValue { get; set; }
    public DayOfWeek? AllowanceStartDayOfWeek { get; set; }
    public int? AllowanceStartMonthOfYear { get; set; }
    public long? UserId { get; set; }
    public DateTimeOffset CalculatedStartAt { get; set; }
    public DateTimeOffset ActualStartAt { get; set; }
    public DateTimeOffset CalculatedEndAt { get; set; } // ActualEndAt == ApprovedAt, if not null, otherwise CalculatedEndAt is the end of the interval
    public long TotalCredits { get; set; }
    public decimal Gpa { get; set; }
    public decimal CalculatedAmount { get; set; }
    public decimal? ApprovedAmount { get; set; }
    public string? Comment { get; set; }
    public bool IsApproved { get => ApprovedAmount.HasValue && ApprovedAmount.Value > 0; }
    public bool IsRejected { get => ApprovedAmount.HasValue && ApprovedAmount.Value == 0; }
    public DateTimeOffset CreatedAt { get; set; }
    public long? CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
    public long? ApprovedBy { get; set; }
    public DateTimeOffset? ClaimedAt { get; set; }
}


public class AllowanceHistoryApprovalRequest
{
    [Required]
    public long Id { get; set; }
    
    [Required]
    public decimal ApprovedAmount { get; set; }
    
    public string? Comment { get; set; }
}

public class AllowanceHistoryClaimRequest
{
    [Required]
    public long Id { get; set; }
}



public static class AllowanceHistoryExtensions
{
    public static AllowanceHistoryResponse ToDto(this Db.Models.AllowanceHistory history)
    {
        return new AllowanceHistoryResponse
        {
            Id = history.Id,
            TeamId = history.TeamId,
            UserId = history.UserId,
            TeamAllowanceIntervalId = history.TeamAllowanceIntervalId,
            TeamAllowanceIntervalName = history.AllowanceInterval.Name,
            AllowanceIntervalType = history.AllowanceIntervalType,
            AllowanceIntervalValue = history.AllowanceIntervalValue,
            AllowanceStartDayOfWeek = history.StartDayOfWeek,
            AllowanceStartMonthOfYear = history.StartMonthOfYear,
            CalculatedStartAt = history.CalculatedStartAt,
            ActualStartAt = history.ActualStartAt,
            CalculatedEndAt = history.CalculatedEndAt,
            TotalCredits = history.TotalCredits,
            Gpa = history.Gpa,
            CalculatedAmount = history.CalculatedAmount,
            ApprovedAmount = history.ApprovedAmount,
            Comment = history.Comment,
            CreatedAt = history.CreatedAt,
            CreatedBy = history.CreatedBy,
            UpdatedAt = history.UpdatedAt,
            UpdatedBy = history.UpdatedBy,
            ApprovedAt = history.ApprovedAt,
            ApprovedBy = history.ApprovedBy,
            ClaimedAt = history.ClaimedAt,
        };
    }

    public static List<AllowanceHistoryResponse> ToDtoList(this IEnumerable<Db.Models.AllowanceHistory> histories)
    {
        return histories.Select(h => h.ToDto()).ToList();
    }
}

public class AllowanceHistoryTaskItemResponse
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
}

public static class AllowanceHistoryTaskItemExtensions
{
    public static AllowanceHistoryTaskItemResponse ToDto(this Db.Models.AllowanceHistoryTaskItems taskItem)
    {
        return new AllowanceHistoryTaskItemResponse
        {
            Id = taskItem.Id,
            AllowanceHistoryId = taskItem.AllowanceHistoryId,
            TaskItemId = taskItem.TaskItemId,
            Credits = taskItem.Credits,
            GradeId = taskItem.GradeId,
            PercentComplete = taskItem.PercentComplete,
            CompletedAt = taskItem.CompletedAt,
            CompletedBy = taskItem.CompletedBy,
            AssignedTo = taskItem.AssignedTo,
            AssignedBy = taskItem.AssignedBy,
            AssignedAt = taskItem.AssignedAt,
            GradedAt = taskItem.GradedAt,
            GradedBy = taskItem.GradedBy,
            CreatedAt = taskItem.CreatedAt,
            UpdatedAt = taskItem.UpdatedAt,
        };
    }

    public static List<AllowanceHistoryTaskItemResponse> ToDtoList(this IEnumerable<Db.Models.AllowanceHistoryTaskItems> taskItems)
    {
        return taskItems.Select(ti => ti.ToDto()).ToList();
    }
}

public class PagedAllowanceHistoriesListRequest
{
    public required long TeamId { get; set; }
    public long? UserId { get; set; }
    public DateTimeOffset? StartAt { get; set; }
    public DateTimeOffset? EndAt { get; set; }
    public PagingRequest Paging { get; set; } = new();
}


public class PagedAllowanceHistoryTaskItemsListRequest
{
    public required long AllowanceHistoryId { get; set; }
    public PagingRequest Paging { get; set; } = new();
}

