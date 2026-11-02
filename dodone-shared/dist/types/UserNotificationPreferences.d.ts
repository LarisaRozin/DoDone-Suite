export declare enum NotificationType {
    OptInToTeamEventNotifications = 0,
    TaskCreated = 1,
    TaskDeleted = 2,
    TaskAssigned = 3,
    TaskUnassigned = 4,
    TaskReassigned = 5,
    TaskMarkedCompleted = 6,
    TaskMarkedIncomplete = 7,
    TaskProgressUpdated = 8,
    TaskMarkedActive = 9,
    TaskMarkedInactive = 10,
    TaskArchived = 11,
    TaskUnarchived = 12,
    TaskGroupChanged = 13,
    TaskKindChanged = 14,
    TaskCategoryChanged = 15,
    TaskDetailsUpdated = 16,
    TaskPriorityChanged = 17,
    TaskCreditsAssigned = 18,
    TaskCreditsRemoved = 19,
    TaskCreditsChanged = 20,
    TaskGraded = 21,
    TaskGradeChanged = 22,
    TaskGradeRemoved = 23,
    TaskCommentCreated = 24,
    TaskCommentUpdated = 25,
    TaskCommentDeleted = 26,
    AllowanceClaimed = 100,
    AllowanceApproved = 101,
    AllowanceRejected = 102,
    TaskAllowanceApproved = 103,
    TaskAllowanceRejected = 104,
    TaskAllowanceIntervalRemoved = 105,
    TaskAllowanceIntervalAssigned = 106,
    TaskAllowanceIntervalChanged = 107,
    BonusAssigned = 200,
    BonusChanged = 201,
    BonusRemoved = 202,
    BonusClaimed = 203,
    BonusApproved = 204,
    BonusRejected = 205,
    TaskDueSoon = 1001,
    TaskDue = 1002,
    TaskStartingSoon = 1003,
    TaskStarted = 1004,
    TaskEndingSoon = 1005,
    TaskEnded = 1006,
    AllowanceDaySoon = 1007,
    AllowanceDay = 1008,
    TrialWelcome = -1001,
    Trial3DayWarning = -1002,
    Trial1DayWarning = -1003,
    TrialEndedWarning = -1004
}
export declare enum NotificationChannel {
    Email = 0,
    Push = 1,
    SMS = 2,
    InApp = 3
}
export interface UserNotificationPreferenceResponse {
    id: number;
    userId: number;
    notificationType: NotificationType;
    channel: NotificationChannel;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt?: Date;
}
export interface UserNotificationPreferenceUpdateRequest {
    id: number;
    isEnabled: boolean;
}
export interface UserNotificationPreferenceCreateRequest {
    notificationType: NotificationType;
    channel: NotificationChannel;
    isEnabled: boolean;
}
export interface BulkNotificationPreferenceUpdateRequest {
    Preferences: UserNotificationPreferenceUpdateRequest[];
}
export interface BulkNotificationPreferenceCreateRequest {
    Preferences: UserNotificationPreferenceCreateRequest[];
}
