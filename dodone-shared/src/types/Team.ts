/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { AllowanceDayOfWeek, AllowanceIntervalType, AllowanceMonthOfYear } from "./AllowanceInterval";
import { Team, User } from "./User";


export interface TeamGradeConfigResponse
{
    id: number;
    teamAllowanceIntervalId: number;
    gradeId: number;
    allowanceReducePercent: number;
    createdAt: Date;
    createdBy: number;
    updatedAt?: Date;
    updatedBy: number;
}

export interface TeamDetailsBase
{
    name: string;
    description?: string;
    isBusiness: boolean;
    createdAt: string;
}

export interface ExistingTeamDetails extends TeamDetailsBase
{
    id: number;
    updatedAt?: string;
    updatedBy: number;
    updatedByUser: User;
}

export interface TeamDetailsCreateRequest extends TeamDetailsBase
{ }


export interface TeamDetailsUpdateRequest extends ExistingTeamDetails
{ }


export interface TeamDetailsResponse extends ExistingTeamDetails
{ 
    members: User[];
}

export interface TeamAllowanceIntervalGradingPeriodResponse
{
    id: number;
    name: string;
    startMonth: AllowanceMonthOfYear;
    startDay: number;
    endMonth: AllowanceMonthOfYear;
    endDay: number;
    isSchoolBreak: boolean;
}

export interface TeamAllowanceIntervalBase
{
    teamId: number;
    name: string;
    description?: string;
    maxAllowanceAmount: number;
    minCreditsForAllowance: number;
    intervalType: AllowanceIntervalType;
    intervalValue: number;
    startDayOfWeek?: AllowanceDayOfWeek;
    startMonthOfYear?: number;
    isActive: boolean;
    resetGradesOnIntervalEnd: boolean;
    createdBy: number;
    createdAt: string;
    gradeConfigs: TeamGradeConfigResponse[];
    gradingPeriods?: TeamAllowanceIntervalGradingPeriodResponse[];
}  

export interface ExistingTeamAllowanceInterval extends TeamAllowanceIntervalBase
{
    id: number;
    updatedAt?: string;
    updatedBy: number;
}

export interface TeamAllowanceIntervalResponse extends ExistingTeamAllowanceInterval
{ 
    createdByUser: User;
    updatedByUser: User;
}

export interface TeamAllowanceIntervalCreateRequest extends TeamAllowanceIntervalBase
{ } 

export interface TeamAllowanceIntervalUpdateRequest extends ExistingTeamAllowanceInterval
{ }

export interface TeamAllowanceIntervalDeleteRequest 
{
    id: number;
}

export interface TeamAllowanceIntervalListResponse 
{
    allowanceIntervals: TeamAllowanceIntervalResponse[];
}