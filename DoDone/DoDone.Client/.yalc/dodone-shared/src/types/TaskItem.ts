/*
 * Copyright (c) 2025 LarisaRozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { User } from "./User";

export interface RequestBase
{
    name: string;
    description?: string;
    isActive: boolean;
}

export interface ExistingItemBase extends RequestBase
{
    createdBy: number;
    createdAt: string;
    updatedBy?: number;
    updatedAt?: string;
}

export interface GradeResponse
{
    id: number;
    letterGrade: string;
    gradePoints: number;
    percentGradeMin: number;
    percentGradeMax: number;
    reducePercent: number;
}

// TaskCategory
export interface  TaskCategoryCreateRequest extends RequestBase
{
    kindId: number;
}

export interface TaskCategoryUpdateRequest extends RequestBase
{
    id: number;
    kindId: number;
}

export interface TaskCategoryResponse extends ExistingItemBase
{
    id: number;
    kindId: number;
}

export interface TaskCategoryDetailsResponse extends TaskCategoryResponse
{
    createdByUser: User
    updatedByUser?: User;
}

// TaskKind
export interface TaskKindCreateRequest extends RequestBase
{
    groupId: number;
}

export interface TaskKindUpdateRequest extends RequestBase
{
    id: number;
    groupId: number;
}

export interface TaskKindResponse extends ExistingItemBase
{
    id: number;
    groupId: number;
}

export interface TaskKindDetailsResponse extends TaskKindResponse
{
    createdByUser: User;
    updatedByUser?: User;
    categories?: TaskCategoryResponse[];
}

// TaskGroup
export interface TaskGroupBase extends ExistingItemBase
{
    id: number;
    userId: number;
    teamId?: number;
    isPrivate: boolean;
}

export interface TaskGroupCreateRequest extends RequestBase
{
    userId: number;
    isPrivate: boolean;
}

export interface TaskGroupUpdateRequest extends RequestBase
{
    id: number;
    isPrivate: boolean;
}

export interface TaskGroupResponse extends TaskGroupBase
{ }

export interface TaskGroupDetailsResponse extends TaskGroupResponse
{
    createdByUser: User;
    updatedByUser?: User;
    kinds?: TaskKindResponse[];
}

export enum TaskItemPriority
{
    None = 0,
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4,
}


// TaskItem
export interface TaskItemUpdateBase extends RequestBase
{
    teamId?: number;
    groupId?: number;
    kindId?: number;
    categoryId?: number;
    credits?: number;
    gradeId?: number;
    maxBonus?: string;
    percentComplete?: number;
    isCompleted?: boolean;
    isPinned?: boolean;
    isArchived?: boolean;
    isPrivate: boolean;
    priority: TaskItemPriority;
    activeAt?: string;
    activeBy?: number;
    archivedAt?: string;
    archivedBy?: number;
    gradedAt?: string;
    gradedBy?: number;
    completedAt?: string;
    completedBy?: number;
    assignedTo?: number;
    assignedBy?: number;
    assignedAt?: string;
    dueAt?: string;
    startAt?: string;
    endAt?: string;
    teamAllowanceIntervalId?: number;
}

export interface TaskItemBase extends TaskItemUpdateBase
{   
    details?: string;
}

export interface TaskItemResponse extends ExistingItemBase, TaskItemBase
{
    id: number;
    approvedBonus?: string;
    isBonusRejected?: boolean;
    bonusStatusBy?: number;
    bonusStatusAt?: string;
    bonusStatusComment?: string;
    bonusClaimedAt?: string;
    isApprovedForAllowance: boolean;
    allowanceApprovalStatusAt?: string;
    allowanceApprovalStatusBy?: number;
    allowanceApprovalStatusComment?: string;
    teamAllowanceIntervalName: string;
}

export interface TaskItemDetailsResponse extends TaskItemResponse
{
    group?: TaskGroupResponse;
    kind?: TaskKindResponse;
    category?: TaskCategoryResponse;
    grade?: GradeResponse;
    details?: string;
}

export interface TaskItemTaskDetailsUpdateRequest 
{
    id: number;
    taskDetails: string;
}

export interface TaskItemCreateRequest extends TaskItemUpdateBase
{
}

export interface TaskItemUpdateRequest extends TaskItemUpdateBase
{
    id: number;
}

export interface BonusApprovalRequest
{
    taskItemId: number;
    isApproved: boolean;
    approvedBonus?: string;
    comment?: string;
}

export interface TaskItemAllowanceApprovalRequest
{
    taskItemId: number;
    teamAllowanceIntervalId: number;
    isApproved: boolean;
    comment?: string;
}

// TaskComment
export interface TaskCommentBase 
{
    taskId: number;
    userId: number;
    content: string;
    createdAt: string;
    updatedAt?: string;
}

export interface TaskCommentCreateRequest 
{
    taskId: number;
    content: string;
}

export interface TaskCommentUpdateRequest 
{
    id: number;
    content: string;
}

export interface TaskCommentResponse extends ExistingItemBase, TaskCommentBase
{
    id: number;
    createdByUser: User;
    updatedByUser?: User;
}

