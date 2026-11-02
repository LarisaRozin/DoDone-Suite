/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Server.Services;

public class PeriodicTasksConfiguration
{
    public const string SectionName = "PeriodicTasks";

    // Master switch to enable/disable the entire background service
    public bool EnablePeriodicTasksService { get; set; } = true;

    // Trial notification settings
    public bool EnableWelcomeNotificationsToGrandfatheredUsers { get; set; } = true;
    public bool EnableTrial3DayWarningNotifications { get; set; } = true;
    public bool EnableTrial1DayWarningNotifications { get; set; } = true;
    public bool EnableTrialEndedWarningNotifications { get; set; } = true;
    public bool EnableGrandfatheredTrial3DayWarningNotifications { get; set; } = true;
    public bool EnableGrandfatheredTrial1DayWarningNotifications { get; set; } = true;
    public bool EnableGrandfatheredTrialEndedWarningNotifications { get; set; } = true;


    // Task and allowance related settings
    public bool EnableResetTaskGradesOnIntervalChange { get; set; } = true;
    public bool EnableTaskDueSoonNotifications { get; set; } = true;
    public bool EnableTaskDueTodayNotifications { get; set; } = true;
    public bool EnableTaskStartingSoonNotifications { get; set; } = true;
    public bool EnableTaskStartingTodayNotifications { get; set; } = true;
    public bool EnableTaskEndingSoonNotifications { get; set; } = true;
    public bool EnableTaskEndingTodayNotifications { get; set; } = true;
    public bool EnableAllowanceDaySoonNotifications { get; set; } = true;
    public bool EnableAllowanceDayTodayNotifications { get; set; } = true;

    // Execution intervals
    public int WelcomeNotificationsToGrandfatheredUsersIntervalHours { get; set; } = 24;
    public int Trial3DayWarningNotificationsIntervalHours { get; set; } = 24;
    public int Trial1DayWarningNotificationsIntervalHours { get; set; } = 24;
    public int TrialEndedWarningNotificationsIntervalHours { get; set; } = 24;
    public int GrandfatheredTrial3DayWarningNotificationsIntervalHours { get; set; } = 24;
    public int GrandfatheredTrial1DayWarningNotificationsIntervalHours { get; set; } = 24;
    public int GrandfatheredTrialEndedWarningNotificationsIntervalHours { get; set; } = 24;


    public int ResetTaskGradesOnIntervalChangeIntervalHours { get; set; } = 12; 
    public int TaskDueSoonNotificationsIntervalHours { get; set; } = 8;
    public int TaskDueTodayNotificationsIntervalHours { get; set; } = 3;
    public int TaskStartingSoonNotificationsIntervalHours { get; set; } = 8;
    public int TaskStartingTodayNotificationsIntervalHours { get; set; } = 3;
    public int TaskEndingSoonNotificationsIntervalHours { get; set; } = 8;
    public int TaskEndingTodayNotificationsIntervalHours { get; set; } = 3;
    public int AllowanceDaySoonNotificationsIntervalHours { get; set; } = 12;
    public int AllowanceDayTodayNotificationsIntervalHours { get; set; } = 4;

    // Initial delays in minutes to stagger first execution
    public int WelcomeNotificationsToGrandfatheredUsersInitialDelayMinutes { get; set; } = 134;
    public int Trial3DayWarningNotificationsInitialDelayMinutes { get; set; } = 144;
    public int Trial1DayWarningNotificationsInitialDelayMinutes { get; set; } = 154;
    public int TrialEndedWarningNotificationsInitialDelayMinutes { get; set; } = 164;
    public int GrandfatheredTrial3DayWarningNotificationsInitialDelayMinutes { get; set; } = 174;
    public int GrandfatheredTrial1DayWarningNotificationsInitialDelayMinutes { get; set; } = 184;
    public int GrandfatheredTrialEndedWarningNotificationsInitialDelayMinutes { get; set; } = 194;


    public int ResetTaskGradesOnIntervalChangeInitialDelayMinutes { get; set; } = 127;
    public int TaskDueSoonNotificationsInitialDelayMinutes { get; set; } = 0;
    public int TaskDueTodayNotificationsInitialDelayMinutes { get; set; } = 15;
    public int TaskStartingSoonNotificationsInitialDelayMinutes { get; set; } = 30;
    public int TaskStartingTodayNotificationsInitialDelayMinutes { get; set; } = 45;
    public int TaskEndingSoonNotificationsInitialDelayMinutes { get; set; } = 60;
    public int TaskEndingTodayNotificationsInitialDelayMinutes { get; set; } = 75;
    public int AllowanceDaySoonNotificationsInitialDelayMinutes { get; set; } = 90;
    public int AllowanceDayTodayNotificationsInitialDelayMinutes { get; set; } = 105;
}
