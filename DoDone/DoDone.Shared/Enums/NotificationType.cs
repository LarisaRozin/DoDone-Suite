/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using System.ComponentModel;

namespace DoDone.Shared.Enums;

public enum NotificationType
{
    [Description("Opt in to team event notifications")]
    OptInToTeamEventNotifications = 0,
    [Description("Task created")]
    TaskCreated = 1,
    [Description("Task deleted")]
    TaskDeleted = 2,
    [Description("Task assigned")]
    TaskAssigned = 3,
    [Description("Task unassigned")]
    TaskUnassigned = 4,
    [Description("Task reassigned")]
    TaskReassigned = 5,
    [Description("Task marked completed")]
    TaskMarkedCompleted = 6,
    [Description("Task marked incomplete")]
    TaskMarkedIncomplete = 7,
    [Description("Task progress updated")]
    TaskProgressUpdated = 8,
    [Description("Task marked active")]
    TaskMarkedActive = 9,
    [Description("Task marked inactive")]
    TaskMarkedInactive = 10,
    [Description("Task archived")]
    TaskArchived = 11,
    [Description("Task unarchived")]
    TaskUnarchived = 12,
    [Description("Task group changed")]
    TaskGroupChanged = 13,
    [Description("Task kind changed")]
    TaskKindChanged = 14,
    [Description("Task category changed")]
    TaskCategoryChanged = 15,
    [Description("Task details updated")]
    TaskDetailsUpdated = 16,
    [Description("Task priority changed")]
    TaskPriorityChanged = 17,
    [Description("Task credits assigned")]
    TaskCreditsAssigned = 18,
    [Description("Task credits removed")]
    TaskCreditsRemoved = 19,
    [Description("Task credits changed")]
    TaskCreditsChanged = 20,
    [Description("Task graded")]
    TaskGraded = 21,
    [Description("Task grade changed")]
    TaskGradeChanged = 22,
    [Description("Task grade removed")]
    TaskGradeRemoved = 23,
    [Description("Task comment created")]
    TaskCommentCreated = 24,
    [Description("Task comment updated")]
    TaskCommentUpdated = 25,
    [Description("Task comment deleted")]
    TaskCommentDeleted = 26,


    [Description("Allowance claimed")]
    AllowanceClaimed = 100,
    [Description("Allowance approved")]
    AllowanceApproved = 101,
    [Description("Allowance rejected")]
    AllowanceRejected = 102,


    [Description("Task allowance-approved")]
    TaskAllowanceApproved = 103,
    [Description("Task allowance-rejected")]
    TaskAllowanceRejected = 104,
    [Description("Task allowance interval removed")]
    TaskAllowanceIntervalRemoved = 105,
    [Description("Task allowance interval assigned")]
    TaskAllowanceIntervalAssigned = 106,
    [Description("Task allowance interval changed")]
    TaskAllowanceIntervalChanged = 107,
 

    [Description("Bonus assigned")]
    BonusAssigned = 200,
    [Description("Bonus changed")]
    BonusChanged = 201,
    [Description("Bonus removed")]
    BonusRemoved = 202,
    [Description("Bonus claimed")]
    BonusClaimed = 203,
    [Description("Bonus approved")]
    BonusApproved = 204,
    [Description("Bonus rejected")]
    BonusRejected = 205,

   // Periodic Task Notifications
    [Description("Task due soon")]
    TaskDueSoon = 1001,
    [Description("Task due")]
    TaskDue = 1002,
    [Description("Task starting soon")]
    TaskStartingSoon = 1003,
    [Description("Task started")]
    TaskStarted = 1004,
    [Description("Task ending soon")]
    TaskEndingSoon = 1005,
    [Description("Task ended")]
    TaskEnded = 1006,
    [Description("Allowance day soon")]
    AllowanceDaySoon = 1007,
    [Description("Allowance day")]
    AllowanceDay = 1008,

    [Description("Trial welcome")]
    TrialWelcome = -1001,
    [Description("Trial 3-day warning")]
    Trial3DayWarning = -1002,
    [Description("Trial 1-day warning")]
    Trial1DayWarning = -1003,
    [Description("Trial ended warning")]
    TrialEndedWarning = -1004,

    // TODO:
    // WeeklyDigest....

}
