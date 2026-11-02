/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Enums;

namespace DoDone.Db.Repositories;

/// <summary>
/// Request object for repository paged list operations
/// </summary>
public class PagedRepositoryRequest
{
    public long ParentId { get; set; }

    public int Skip { get; set; }

    public int Take { get; set; }

    public string? SortBy { get; set; }

    public bool SortDescending { get; set; }

    public IDictionary<string, object>? Filters { get; set; }

    public static PagedRepositoryRequest Create(
        long parentId, 
        int skip, 
        int take)
    {
        return new PagedRepositoryRequest
        {
            ParentId = parentId,
            Skip = skip,
            Take = take,
        };
    }
}


public class PagedTaskItemListRepositoryRequest : PagedRepositoryRequest
{
    public TaskItemAssignmentStatusFilter? AssignmentStatusFilter { get; set; }
    
    public TaskItemCompletionStatusFilter? CompletionStatusFilter { get; set; }
    
    public TaskItemActiveStatusFilter? ActiveStatusFilter { get; set; }
    
    public TaskItemDueStatusFilter? DueStatusFilter { get; set; }

    public TaskItemNeedReviewStatusFilter? NeedReviewStatusFilter { get; set; }

    /// <summary>
    /// Creates a new paged task item repository request
    /// </summary>
    public static PagedTaskItemListRepositoryRequest Create(
        long userId,
        int skip,
        int take,
        string? sortBy = null,
        bool sortDescending = false,
        IDictionary<string, object>? filters = null,
        TaskItemAssignmentStatusFilter? assignmentStatusFilter = null,
        TaskItemCompletionStatusFilter? completionStatusFilter = null,
        TaskItemActiveStatusFilter? activeStatusFilter = null,
        TaskItemDueStatusFilter? dueStatusFilter = null,
        TaskItemNeedReviewStatusFilter? needReviewStatusFilter = null)
    {
        return new PagedTaskItemListRepositoryRequest
        {
            ParentId = userId,
            Skip = skip,
            Take = take,
            SortBy = sortBy,
            SortDescending = sortDescending,
            Filters = filters,
            AssignmentStatusFilter = assignmentStatusFilter,
            CompletionStatusFilter = completionStatusFilter,
            ActiveStatusFilter = activeStatusFilter,
            DueStatusFilter = dueStatusFilter,
            NeedReviewStatusFilter = needReviewStatusFilter
        };
    }
}
