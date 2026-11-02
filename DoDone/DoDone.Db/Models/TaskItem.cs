/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Abstractions;
using DoDone.Shared.Enums;

namespace DoDone.Db.Models;

public partial class TaskItem : IDoDoneModel, ITeamEntity, IDetailedEntity, IAssignableEntity
{
    public long Id { get; set; }
    public long? TeamId { get; set; }   
    public long? GroupId { get; set; }
    public long? KindId { get; set; }
    public long? CategoryId { get; set; }
    // TODO: Hierarchical tasks, recurring tasks
    // public long ParentId { get; set; }
    // public bool IsRecurring { get; set; } = false;
    public required string Name { get; set; } = null!;
    public string? Description { get; set; }
    public TaskItemPriority Priority { get; set; } = TaskItemPriority.Medium;
    public bool IsActive { get; set; } = true;
    public bool IsPrivate { get; set; } = false;  
    public bool IsArchived { get; set; } = false;
    public byte PercentComplete { get; set; }
    public byte? Credits { get; set; }
    public int? GradeId { get; set; }
    public string? MaxBonus { get; set; }
    public string? ApprovedBonus { get; set; } 
    public bool IsBonusRejected { get; set; } = false;  
    public long? BonusStatusBy { get; set; }
    public DateTimeOffset? BonusStatusAt { get; set; }
    public string? BonusStatusComment { get; set; }
    public DateTimeOffset? BonusClaimedAt { get; set; } 
    public bool IsApprovedForAllowance { get; set; } = false;
    public DateTimeOffset? AllowanceApprovalStatusAt { get; set; }
    public long? AllowanceApprovalStatusBy { get; set; }
    public string? AllowanceApprovalStatusComment { get; set; }
    public string? Details { get; set; }
    public DateTimeOffset? DueAt { get; set; }
    public DateTimeOffset? StartAt { get; set; }
    public DateTimeOffset? EndAt { get; set; }
    public DateTimeOffset? ActiveAt { get; set; } 
    public long? ActiveBy { get; set; } 
    public DateTimeOffset? CompletedAt { get; set; }
    public long? CompletedBy { get; set; }
    public DateTimeOffset? ArchivedAt { get; set; }
    public long? ArchivedBy { get; set; }
    public long? AssignedTo { get; set; }
    public long? AssignedBy { get; set; }
    public DateTimeOffset? AssignedAt { get; set; }
    public DateTimeOffset? GradedAt { get; set; }
    public long? GradedBy { get; set; }
    public long CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public long? TeamAllowanceIntervalId { get; set; }

    // Navigation properties
    // public TaskItem? Parent { get; set; }
    public Grade? Grade { get; set; }
    public TaskGroup? Group { get; set; } = null!;
    public TaskKind? Kind { get; set; } = null!;
    public TaskCategory? Category { get; set; } = null!;
    public User? AssignedToUser { get; set; } = null!;
    public User? AssignedByUser { get; set; } = null!;
    public User? GradedByUser { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public User? UpdatedByUser { get; set; } = null!;
    public User? ActiveByUser { get; set; } = null!;
    public User? ArchivedByUser { get; set; } = null!;
    public User? CompletedByUser { get; set; } = null!;
    public User? BonusStatusByUser { get; set; } = null!;
    public User? AllowanceApprovalStatusByUser { get; set; } = null!;
    public Team? Team { get; set; } = null!;
    public TeamAllowanceInterval? TeamAllowanceInterval { get; set; }
    public List<UserTaskItemPin> UserPins { get; set; } = new();
    public List<TaskComment> Comments { get; set; } = new();
    public List<AllowanceHistoryTaskItems> AllowanceHistoryTaskItems { get; set; } = new();
    public List<UserNotification> Notifications { get; set; } = new();
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}

