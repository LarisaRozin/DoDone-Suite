/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Shared.Enums;

public enum TaskItemAssignmentStatusFilter
{
    Any,
    Mine,
    Private,
    Team,
    Unassigned,
}

public enum TaskItemCompletionStatusFilter
{
    Any,
    Completed,
    InProgress,
}

public enum TaskItemActiveStatusFilter
{
    Any,
    Active,
    Inactive,
}

public enum TaskItemArchivedStatusFilter
{
    Any,
    Archived,
    Unarchived,
}

public enum TaskItemDueStatusFilter
{
    Any,
    Due,
    NotDue,
}

public enum TaskItemStartedStatusFilter
{
    Any,
    Started,
    NotStarted,
}

public enum TaskItemEndedStatusFilter
{
    Any,
    Ended,
    NotEnded,
}



public enum TaskItemNeedReviewStatusFilter
{
    Any,
    NeedsReview,
}

public enum TaskItemAllowanceAccreditedStatusFilter
{
    Any,
    Accredited,
}

public enum TaskItemPriorityFilter
{
    Any,
    None,
    Low,
    Medium,
    High,
    Critical
}

public enum TaskItemBonusStatusFilter
{
    Any,
    // AssignedWithBonus,
    // UnassignedWithBonus,
    // AssignedWithoutBonus,
    // UnassignedWithoutBonus,
    Current,
    NeedsReview,
    Approved,
    Rejected,
    Claimed,
    NotClaimed,
    WithBonus,
    WithoutBonus,
}


