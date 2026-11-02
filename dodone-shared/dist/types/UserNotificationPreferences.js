"use strict";
/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationChannel = exports.NotificationType = void 0;
var NotificationType;
(function (NotificationType) {
    NotificationType[NotificationType["OptInToTeamEventNotifications"] = 0] = "OptInToTeamEventNotifications";
    NotificationType[NotificationType["TaskCreated"] = 1] = "TaskCreated";
    NotificationType[NotificationType["TaskDeleted"] = 2] = "TaskDeleted";
    NotificationType[NotificationType["TaskAssigned"] = 3] = "TaskAssigned";
    NotificationType[NotificationType["TaskUnassigned"] = 4] = "TaskUnassigned";
    NotificationType[NotificationType["TaskReassigned"] = 5] = "TaskReassigned";
    NotificationType[NotificationType["TaskMarkedCompleted"] = 6] = "TaskMarkedCompleted";
    NotificationType[NotificationType["TaskMarkedIncomplete"] = 7] = "TaskMarkedIncomplete";
    NotificationType[NotificationType["TaskProgressUpdated"] = 8] = "TaskProgressUpdated";
    NotificationType[NotificationType["TaskMarkedActive"] = 9] = "TaskMarkedActive";
    NotificationType[NotificationType["TaskMarkedInactive"] = 10] = "TaskMarkedInactive";
    NotificationType[NotificationType["TaskArchived"] = 11] = "TaskArchived";
    NotificationType[NotificationType["TaskUnarchived"] = 12] = "TaskUnarchived";
    NotificationType[NotificationType["TaskGroupChanged"] = 13] = "TaskGroupChanged";
    NotificationType[NotificationType["TaskKindChanged"] = 14] = "TaskKindChanged";
    NotificationType[NotificationType["TaskCategoryChanged"] = 15] = "TaskCategoryChanged";
    NotificationType[NotificationType["TaskDetailsUpdated"] = 16] = "TaskDetailsUpdated";
    NotificationType[NotificationType["TaskPriorityChanged"] = 17] = "TaskPriorityChanged";
    NotificationType[NotificationType["TaskCreditsAssigned"] = 18] = "TaskCreditsAssigned";
    NotificationType[NotificationType["TaskCreditsRemoved"] = 19] = "TaskCreditsRemoved";
    NotificationType[NotificationType["TaskCreditsChanged"] = 20] = "TaskCreditsChanged";
    NotificationType[NotificationType["TaskGraded"] = 21] = "TaskGraded";
    NotificationType[NotificationType["TaskGradeChanged"] = 22] = "TaskGradeChanged";
    NotificationType[NotificationType["TaskGradeRemoved"] = 23] = "TaskGradeRemoved";
    NotificationType[NotificationType["TaskCommentCreated"] = 24] = "TaskCommentCreated";
    NotificationType[NotificationType["TaskCommentUpdated"] = 25] = "TaskCommentUpdated";
    NotificationType[NotificationType["TaskCommentDeleted"] = 26] = "TaskCommentDeleted";
    NotificationType[NotificationType["AllowanceClaimed"] = 100] = "AllowanceClaimed";
    NotificationType[NotificationType["AllowanceApproved"] = 101] = "AllowanceApproved";
    NotificationType[NotificationType["AllowanceRejected"] = 102] = "AllowanceRejected";
    NotificationType[NotificationType["TaskAllowanceApproved"] = 103] = "TaskAllowanceApproved";
    NotificationType[NotificationType["TaskAllowanceRejected"] = 104] = "TaskAllowanceRejected";
    NotificationType[NotificationType["TaskAllowanceIntervalRemoved"] = 105] = "TaskAllowanceIntervalRemoved";
    NotificationType[NotificationType["TaskAllowanceIntervalAssigned"] = 106] = "TaskAllowanceIntervalAssigned";
    NotificationType[NotificationType["TaskAllowanceIntervalChanged"] = 107] = "TaskAllowanceIntervalChanged";
    NotificationType[NotificationType["BonusAssigned"] = 200] = "BonusAssigned";
    NotificationType[NotificationType["BonusChanged"] = 201] = "BonusChanged";
    NotificationType[NotificationType["BonusRemoved"] = 202] = "BonusRemoved";
    NotificationType[NotificationType["BonusClaimed"] = 203] = "BonusClaimed";
    NotificationType[NotificationType["BonusApproved"] = 204] = "BonusApproved";
    NotificationType[NotificationType["BonusRejected"] = 205] = "BonusRejected";
    // Periodic Task Notifications
    NotificationType[NotificationType["TaskDueSoon"] = 1001] = "TaskDueSoon";
    NotificationType[NotificationType["TaskDue"] = 1002] = "TaskDue";
    NotificationType[NotificationType["TaskStartingSoon"] = 1003] = "TaskStartingSoon";
    NotificationType[NotificationType["TaskStarted"] = 1004] = "TaskStarted";
    NotificationType[NotificationType["TaskEndingSoon"] = 1005] = "TaskEndingSoon";
    NotificationType[NotificationType["TaskEnded"] = 1006] = "TaskEnded";
    NotificationType[NotificationType["AllowanceDaySoon"] = 1007] = "AllowanceDaySoon";
    NotificationType[NotificationType["AllowanceDay"] = 1008] = "AllowanceDay";
    // Subscription Trial Notifications
    NotificationType[NotificationType["TrialWelcome"] = -1001] = "TrialWelcome";
    NotificationType[NotificationType["Trial3DayWarning"] = -1002] = "Trial3DayWarning";
    NotificationType[NotificationType["Trial1DayWarning"] = -1003] = "Trial1DayWarning";
    NotificationType[NotificationType["TrialEndedWarning"] = -1004] = "TrialEndedWarning";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel[NotificationChannel["Email"] = 0] = "Email";
    NotificationChannel[NotificationChannel["Push"] = 1] = "Push";
    NotificationChannel[NotificationChannel["SMS"] = 2] = "SMS";
    NotificationChannel[NotificationChannel["InApp"] = 3] = "InApp";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
