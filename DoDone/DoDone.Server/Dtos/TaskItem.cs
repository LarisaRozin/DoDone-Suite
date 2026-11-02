/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Enums;

namespace DoDone.Server.Dtos;

public class TaskItemUpdateBase : RequestBase
{
    public long? TeamId { get; set; }
    public long? GroupId { get; set; }
    public long? KindId { get; set; }
    public long? CategoryId { get; set; }
    public byte? Credits { get; set; }
    public int? GradeId { get; set; }
    public string? MaxBonus { get; set; }

    public DateTimeOffset? DueAt { get; set; }
    public DateTimeOffset? StartAt { get; set; }
    public DateTimeOffset? EndAt { get; set; }
    public byte? PercentComplete { get; set; }
    public bool IsComplete { get; set; } = false;
    public bool IsPinned { get; set; } = false;
    public bool IsArchived { get; set; } = false;
    public bool IsPrivate { get; set; } = false;
    public TaskItemPriority Priority { get; set; } = TaskItemPriority.Medium;
    public long? CompletedBy { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public long? AssignedTo { get; set; }
    public long? AssignedBy { get; set; }
    public DateTimeOffset? AssignedAt { get; set; }
    public DateTimeOffset? GradedAt { get; set; }
    public long? GradedBy { get; set; }
    public DateTimeOffset? ActiveAt { get; set; }
    public long? ActiveBy { get; set; }
    public DateTimeOffset? ArchivedAt { get; set; }
    public long? ArchivedBy { get; set; }
    public long? TeamAllowanceIntervalId { get; set; }
}

public class TaskItemBase : TaskItemUpdateBase
{
    public string? Details { get; set; }
}

public class TaskItemResponse : TaskItemBase
{
    public long Id { get; set; }
    public bool IsBonusRejected { get; set; } = false;
    public string? ApprovedBonus { get; set; }
    public long? BonusStatusBy { get; set; }
    public DateTimeOffset? BonusStatusAt { get; set; }
    public string? BonusStatusComment { get; set; }
    public DateTimeOffset? BonusClaimedAt { get; set; }
    public bool IsApprovedForAllowance { get; set; } = false;
    public DateTimeOffset? AllowanceApprovalStatusAt { get; set; }
    public long? AllowanceApprovalStatusBy { get; set; }
    public string? AllowanceApprovalStatusComment { get; set; }
    public long CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public string TeamAllowanceIntervalName { get; set; } = string.Empty;
}

public class TaskItemDetailsResponse : TaskItemResponse
{
    public TaskGroupResponse? Group { get; set; }
    public TaskKindResponse? Kind { get; set; }
    public TaskCategoryResponse? Category { get; set; }
    public GradeResponse? Grade { get; set; }
    // public UserResponse? AssignedToUser { get; set; }
    // public UserResponse? AssignedByUser { get; set; }
    // public required UserResponse CreatedByUser { get; set; }
    // public UserResponse? UpdatedByUser { get; set; }
    // public UserResponse? CompletedByUser { get; set; }
    // public UserResponse? ActiveByUser { get; set; }
    // public UserResponse? ArchivedByUser { get; set; }
    // public UserResponse? GradedByUser { get; set; }
    // public UserResponse? BonusStatusByUser { get; set; }
    // public UserResponse? AllowanceApprovalStatusByUser { get; set; }
}

public class TaskItemTaskDetailsUpdateRequest
{
    public required long Id { get; set; }
    public required string TaskDetails { get; set; }
}

public class TaskItemCreateRequest : TaskItemUpdateBase
{
}

public class TaskItemUpdateRequest : TaskItemUpdateBase
{
    public required long Id { get; set; }
}

public class BonusApprovalRequest
{
    public required long TaskItemId { get; set; }
    public required bool IsApproved { get; set; }
    public string? ApprovedBonus { get; set; }
    public string? Comment { get; set; }
}

public class TaskItemAllowanceApprovalRequest
{
    public required long TaskItemId { get; set; }
    public long TeamAllowanceIntervalId { get; set; }
    public required bool IsApproved { get; set; }
    public string? Comment { get; set; }
}

