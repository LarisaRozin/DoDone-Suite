/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Enums;

namespace DoDone.Server.Dtos.Common;

public class PagedListRequest
{
    public long ParentId { get; set; }

    public PagingRequest Paging { get; set; } = new();

    public FilteringRequest Filtering { get; set; } = new();

    public SortingRequest Sorting { get; set; } = new();
}

public class PagedListRequest<T> : PagedListRequest where T : class
{
    // Additional typed-specific properties can be added here if needed
}

// Already have Due/Not, Started/Not..., Unassigned....
// public enum FilterDateType
// {
//     Created,
//     Updated,
//     Due,
//     Started,
//     Ended,
//     Completed,
//     Assigned,
//     Graded,
//     // Accredited,  // TODO
//     Active,
//     Archived,
//     BonusStatus,
//     AllowanceStatus,
// }

public class TaskItemFilteringRequest
{
    public TaskItemAssignmentStatusFilter AssignmentFilter { get; set; } = TaskItemAssignmentStatusFilter.Any;
    public TaskItemCompletionStatusFilter CompletionFilter { get; set; } = TaskItemCompletionStatusFilter.Any;
    public TaskItemActiveStatusFilter ActiveFilter { get; set; } = TaskItemActiveStatusFilter.Any;
    public TaskItemArchivedStatusFilter ArchivedFilter { get; set; } = TaskItemArchivedStatusFilter.Any;
    public TaskItemDueStatusFilter DueFilter { get; set; } = TaskItemDueStatusFilter.Any;
    public TaskItemStartedStatusFilter StartedFilter { get; set; } = TaskItemStartedStatusFilter.Any;
    public TaskItemEndedStatusFilter EndedFilter { get; set; } = TaskItemEndedStatusFilter.Any;
    public TaskItemNeedReviewStatusFilter AllowanceNeedReviewFilter { get; set; } = TaskItemNeedReviewStatusFilter.Any;
    public TaskItemAllowanceAccreditedStatusFilter AllowanceAccreditedFilter { get; set; } = TaskItemAllowanceAccreditedStatusFilter.Any;
    public TaskItemBonusStatusFilter BonusStatusFilter { get; set; } = TaskItemBonusStatusFilter.Any;
    public TaskItemPriorityFilter PriorityFilter { get; set; } = TaskItemPriorityFilter.Any;
    public long? AssignedTo { get; set; }
    public long? GroupId { get; set; }
    public long? KindId { get; set; }
    public long? CategoryId { get; set; }
    public int? GradeId { get; set; }
    public byte? Credits { get; set; }
    // public FilterDateType? DateType { get; set; }
    // public DateTimeOffset? DateFrom { get; set; }
    // public DateTimeOffset? DateTo { get; set; }
    public string? SearchTerm { get; set; }
}

public class PagedTaskItemListRequest 
{
    public long TeamAllowanceIntervalId { get; set; }  
    public TaskItemFilteringRequest TaskItemFiltering { get; set; } = new TaskItemFilteringRequest();
    public PagingRequest Paging { get; set; } = new();
}