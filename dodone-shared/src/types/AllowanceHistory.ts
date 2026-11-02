/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { PagingRequest } from "../utils/paging";
import { AllowanceDayOfWeek, AllowanceIntervalType } from "./AllowanceInterval";

export interface AllowanceHistoryResponse
{
    id: number;
    teamId: number;
    userId?: number;
    teamAllowanceIntervalId: number;
    teamAllowanceIntervalName: string;
    allowanceIntervalType: AllowanceIntervalType;
    allowanceIntervalValue: number;
    allowanceStartDayOfWeek?: AllowanceDayOfWeek;
    allowanceStartMonthOfYear?: number;
    calculatedStartAt: string;
    actualStartAt: string;
    calculatedEndAt: string;
    totalCredits: number;
    gpa: number;
    calculatedAmount: number;
    approvedAmount?: number;
    isApproved: boolean;
    isRejected: boolean;
    comment?: string;
    createdAt: string;
    createdBy?: number;
    updatedAt?: string;
    updatedBy?: number;
    approvedAt?: string;
    approvedBy?: number;
    claimedAt?: string;
}

export interface AllowanceHistoryApprovalRequest
{
    id: number;
    approvedAmount?: number;
    comment?: string;
}

export interface AllowanceHistoryClaimRequest
{
    id: number;
    // TODO:
    // claimedAmount?: number;
    // comment?: string;
}

export interface AllowanceHistoryTaskItemResponse
{
    id: number;
    allowanceHistoryId: number;
    taskItemId: number;
    credits: number;
    gradeId: number;
    percentComplete: number;
    completedAt?: string;
    completedBy?: number;
    assignedTo: number;
    assignedBy: number;
    assignedAt?: string;
    gradedAt?: string;
    gradedBy?: number;
    createdAt: string;
    updatedAt?: string;
}

export interface PagedAllowanceHistoriesListRequest
{
    teamId: number;
    userId?: number;
    startAt?: string;
    endAt?: string;
    paging: PagingRequest;
}

export interface PagedAllowanceHistoryTaskItemsListRequest
{
    allowanceHistoryId: number;
    paging: PagingRequest;
}
