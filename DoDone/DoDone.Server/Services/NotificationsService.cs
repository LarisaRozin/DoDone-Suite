/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Db.Repositories;
using DoDone.Server.Helpers;
using DoDone.Shared;
using DoDone.Shared.Abstractions;
using DoDone.Shared.Enums;
using DoDone.Shared.Extensions;

namespace DoDone.Server.Services;

public interface INotificationService
{
    Task SendTaskCreatedNotificationsAsync(TaskItem taskItem, long currentUserId);
    Task SendTaskDeletedNotificationsAsync(TaskItem taskItem, long currentUserId);
    Task SendTaskAssignedNotificationsAsync(TaskItem taskItem, long currentUserId);
    Task SendTaskUnassignedNotificationsAsync(TaskItem taskItem, long currentUserId);
    Task SendTaskReassignedNotificationsAsync(TaskItem taskItem, TaskItem taskItemBeforeUpdate, long currentUserId);
    Task SendTaskMarkedCompletedNotificationsAsync(TaskItem taskItem, long currentUserId);
    Task SendTaskMarkedIncompleteNotificationsAsync(TaskItem taskItem, long currentUserId);
    Task SendTaskProgressUpdatedNotificationsAsync(TaskItem taskItem, byte previousPercentComplete, long currentUserId);
    Task SendTaskMarkedActiveNotificationsAsync(TaskItem taskItem, long currentUserId);
    Task SendTaskMarkedInactiveNotificationsAsync(TaskItem taskItem, long currentUserId);
    Task SendTaskArchivedNotificationsAsync(TaskItem taskItem, long currentUserId);
    Task SendTaskUnarchivedNotificationsAsync(TaskItem taskItem, long currentUserId);
    Task SendTaskGroupChangedNotificationsAsync(TaskItem taskItem, string? previousValue, long currentUserId);
    Task SendTaskKindChangedNotificationsAsync(TaskItem taskItem, string? previousValue, long currentUserId);
    Task SendTaskCategoryChangedNotificationsAsync(TaskItem taskItem, string? previousValue, long currentUserId);
    Task SendTaskDetailsUpdatedNotificationsAsync(TaskItem taskItem, long currentUserId);
    Task SendTaskPriorityChangedNotificationsAsync(TaskItem taskItem, long currentUserId, TaskItemPriority previousValue = TaskItemPriority.None);
    Task SendTaskCreditsAssignedNotificationsAsync(TaskItem taskItem, long currentUserId);
    Task SendTaskCreditsRemovedNotificationsAsync(TaskItem taskItem, byte previousValue, long currentUserId);
    Task SendTaskCreditsChangedNotificationsAsync(TaskItem taskItem, byte previousValue, long currentUserId);
    Task SendTaskGradedNotificationsAsync(TaskItem taskItem, long currentUserId);
    Task SendTaskGradeChangedNotificationsAsync(TaskItem taskItem, string previousLetterGrade, long currentUserId);
    Task SendTaskGradeRemovedNotificationsAsync(TaskItem taskItem, string previousLetterGrade, long currentUserId);

    Task SendBonusAssignedNotificationsAsync(TaskItem taskItem, long currentUserId);
    Task SendBonusRemovedNotificationsAsync(TaskItem taskItem, string previousValue, long currentUserId);
    Task SendBonusChangedNotificationsAsync(TaskItem taskItem, string previousValue, long currentUserId);

    Task SendBonusClaimedNotificationsAsync(TaskItem taskItem, long currentUserId);
    Task SendBonusApprovedNotificationsAsync(TaskItem taskItem, long currentUserId);
    Task SendBonusRejectedNotificationsAsync(TaskItem taskItem, long currentUserId);
    Task SendTaskAllowanceApprovedNotificationsAsync(TaskItem taskItem, bool isBusiness, long currentUserId);
    Task SendTaskAllowanceRejectedNotificationsAsync(TaskItem taskItem, bool isBusiness, long currentUserId);

    Task SendTaskCommentCreatedNotificationsAsync(TaskItem taskItem, TaskComment taskComment, long currentUserId);
    Task SendTaskCommentUpdatedNotificationsAsync(TaskItem taskItem, TaskComment taskComment, string previousValue, long currentUserId);
    Task SendTaskCommentDeletedNotificationsAsync(TaskItem taskItem, TaskComment taskComment, long currentUserId);

    Task SendAllowanceClaimedNotificationAsync(AllowanceHistory allowanceHistory, bool isBusiness, long currentUserId);
    Task SendAllowanceApprovedNotificationAsync(AllowanceHistory allowanceHistory, bool isBusiness, long currentUserId);
    Task SendAllowanceRejectedNotificationAsync(AllowanceHistory allowanceHistory, bool isBusiness, long currentUserId);
    Task SendTaskAllowanceIntervalRemovedNotificationsAsync(TaskItem existingEntityAfterUpdate, string existingEntityBeforeUpdateIntervalName, bool isBusiness, long currentUserId);
    Task SendTaskAllowanceIntervalAssignedNotificationsAsync(TaskItem existingEntityAfterUpdate, bool isBusiness, long currentUserId);
    Task SendTaskAllowanceIntervalChangedNotificationsAsync(TaskItem existingEntityAfterUpdate, long currentUserId, string? existingEntityBeforeUpdateIntervalName = null);

    // Periodic Task Notifications
    Task SendTasksDueSoonNotificationsAsync();
    Task SendTasksDueTodayNotificationsAsync();
    Task SendTasksStartingSoonNotificationsAsync();
    Task SendTasksStartedNotificationsAsync();
    Task SendTasksEndingSoonNotificationsAsync();
    Task SendTasksEndedNotificationsAsync();
    Task SendAllowanceDaySoonNotificationsAsync();
    Task SendAllowanceDayTodayNotificationsAsync();

    // Trial Notifications
    Task SendTrialWelcomeNotificationAsync(long userId, bool isBusiness, bool isGrandfathered, int trialDays);
    Task SendTrial3DayWarningNotificationAsync(long userId, bool isBusiness, bool isGrandfathered, int trialDays);
    Task SendTrial1DayWarningNotificationAsync(long userId, bool isBusiness, bool isGrandfathered, int trialDays);
    Task SendTrialExpiredNotificationAsync(long userId, bool isBusiness, bool isGrandfathered, int trialDays);
}

public class NotificationService : INotificationService
{
    private readonly IFirebaseService _firebaseService;
    private readonly IUserDevicesRepository _userDevicesRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly ITaskItemRepository _taskItemRepository;
    private readonly IAllowanceHistoryRepository _allowanceHistoryRepository;
    private readonly IUserNotificationRepository _userNotificationRepository;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ITeamRepository _teamRepository;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IFirebaseService firebaseService,
        IUserDevicesRepository userDevicesRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUser,
        ITaskItemRepository taskItemRepository,
        IAllowanceHistoryRepository allowanceHistoryRepository,
        IUserNotificationRepository userNotificationRepository,
        IDateTimeProvider dateTimeProvider,
        ITeamRepository teamRepository,
        ILogger<NotificationService> logger)
    {
        _firebaseService = firebaseService;
        _userDevicesRepository = userDevicesRepository;
        _userRepository = userRepository;
        _currentUser = currentUser;
        _taskItemRepository = taskItemRepository;
        _allowanceHistoryRepository = allowanceHistoryRepository;
        _userNotificationRepository = userNotificationRepository;
        _dateTimeProvider = dateTimeProvider;
        _teamRepository = teamRepository;
        _logger = logger;
    }

    private async Task SendToUserDevicesAsync(List<Db.Models.UserDevices> devices, string title, string body, Dictionary<string, string> data)
    {
        var tokens = devices.Select(d => d.FcmToken).ToList();

        try
        {
            // Callback to delete expired tokens
            async Task OnExpiredToken(string expiredToken)
            {
                try
                {
                    _logger.LogInformation($"Deleting expired device registration for token: {expiredToken}");
                    await _userDevicesRepository.DeleteByFcmTokenAsync(expiredToken);
                    devices.RemoveAll(d => d.FcmToken == expiredToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error deleting expired token: {expiredToken}");
                }
            }

            if (tokens.Count == 1)
            {
                await _firebaseService.SendNotificationAsync(tokens[0], title, body, data, OnExpiredToken);
            }
            else if (tokens.Count > 1)
            {
                await _firebaseService.SendMulticastNotificationAsync(tokens, title, body, data, OnExpiredToken);
            }

            foreach (var device in devices)
            {
                device.LastSeenAt = DateTimeOffset.UtcNow;
                device.UpdatedAt = DateTimeOffset.UtcNow;
            }
            if (devices.Count > 0)
                await _userDevicesRepository.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending notifications to {tokens.Count} devices");
        }
    }

    private async Task<List<long>> GetUsersToNotify(AllowanceHistory allowanceHistory, NotificationType notificationType, long currentUserId, bool excludeCurrentUser = true)
    {
        var admins = await _userRepository.GetAdminUsersToNotify(allowanceHistory.TeamId, notificationType);
        var optInUsers = await _userRepository.GetOptInUsersToNotify(allowanceHistory.TeamId, notificationType);

        var usersToNotify = admins.Union(optInUsers).ToList();

        if (!usersToNotify.Contains(allowanceHistory.UserId))
        {
            var notificationPreference = await _userRepository.GetNotificationPreferencesAsync(allowanceHistory.UserId, notificationType);
            if (notificationPreference.Count == 0 || notificationPreference.Any(p => p.IsEnabled))  // TODO: Notification channel?????
                usersToNotify.Add(allowanceHistory.UserId);
        }

        if (allowanceHistory.ApprovedBy != null && allowanceHistory.ApprovedBy > 0 && allowanceHistory.ApprovedBy != Defaults.SystemUserId && !usersToNotify.Contains(allowanceHistory.ApprovedBy.Value))
        {
            var notificationPreference = await _userRepository.GetNotificationPreferencesAsync(allowanceHistory.ApprovedBy.Value, notificationType);
            if (notificationPreference.Count == 0 || notificationPreference.Any(p => p.IsEnabled))
                usersToNotify.Add(allowanceHistory.ApprovedBy.Value);
        }

        if (allowanceHistory.CreatedBy != null && allowanceHistory.CreatedBy > 0 && allowanceHistory.CreatedBy != Defaults.SystemUserId && !usersToNotify.Contains(allowanceHistory.CreatedBy.Value))
        {
            var notificationPreference = await _userRepository.GetNotificationPreferencesAsync(allowanceHistory.CreatedBy.Value, notificationType);
            if (notificationPreference.Count == 0 || notificationPreference.Any(p => p.IsEnabled))
                usersToNotify.Add(allowanceHistory.CreatedBy.Value);
        }

        if (allowanceHistory.UpdatedBy != null && allowanceHistory.UpdatedBy > 0 && allowanceHistory.UpdatedBy != Defaults.SystemUserId && !usersToNotify.Contains(allowanceHistory.UpdatedBy.Value))
        {
            var notificationPreference = await _userRepository.GetNotificationPreferencesAsync(allowanceHistory.UpdatedBy.Value, notificationType);
            if (notificationPreference.Count == 0 || notificationPreference.Any(p => p.IsEnabled))
                usersToNotify.Add(allowanceHistory.UpdatedBy.Value);
        }

        if (excludeCurrentUser && usersToNotify.Contains(currentUserId))
            usersToNotify.Remove(currentUserId);

        return usersToNotify.Distinct().ToList();
    }

    private async Task<List<long>> GetUsersToNotify(TaskItem taskItem, NotificationType notificationType, long? previousAssignedTo, long currentUserId, bool excludeCurrentUser = true)
    {
        if (taskItem.TeamId == null || taskItem.IsPrivate)
            return new List<long>();

        var admins = await _userRepository.GetAdminUsersToNotify(taskItem.TeamId.Value, notificationType);
        var optInUsers = await _userRepository.GetOptInUsersToNotify(taskItem.TeamId.Value, notificationType);

        var usersToNotify = admins.Union(optInUsers).ToList();

        if (previousAssignedTo.HasValue && !usersToNotify.Contains(previousAssignedTo.Value))
        {
            var notificationPreference = await _userRepository.GetNotificationPreferencesAsync(previousAssignedTo.Value, notificationType);
            if (notificationPreference.Count == 0 || notificationPreference.Any(p => p.IsEnabled))  // TODO: Notification channel?????
                usersToNotify.Add(previousAssignedTo.Value);
        }

        if (taskItem.AssignedTo.HasValue && !usersToNotify.Contains(taskItem.AssignedTo.Value))
        {
            var notificationPreference = await _userRepository.GetNotificationPreferencesAsync(taskItem.AssignedTo ?? 0, notificationType);
            if (taskItem.AssignedTo.HasValue && (notificationPreference.Count == 0 || notificationPreference.Any(p => p.IsEnabled)))
                usersToNotify.Add(taskItem.AssignedTo.Value);
        }

        if (taskItem.AssignedBy.HasValue && !usersToNotify.Contains(taskItem.AssignedBy.Value))
        {
            var notificationPreference = await _userRepository.GetNotificationPreferencesAsync(taskItem.AssignedBy ?? 0, notificationType);
            if (taskItem.AssignedBy.HasValue && (notificationPreference.Count == 0 || notificationPreference.Any(p => p.IsEnabled)))
                usersToNotify.Add(taskItem.AssignedBy.Value);
        }

        if (!usersToNotify.Contains(taskItem.CreatedBy) && notificationType != NotificationType.TaskCreated)
        {
            var notificationPreference = await _userRepository.GetNotificationPreferencesAsync(taskItem.CreatedBy, notificationType);
            if (notificationPreference.Count == 0 || notificationPreference.Any(p => p.IsEnabled))
                usersToNotify.Add(taskItem.CreatedBy);
        }

        if (taskItem.UpdatedBy.HasValue && !usersToNotify.Contains(taskItem.UpdatedBy.Value))
        {
            var notificationPreference = await _userRepository.GetNotificationPreferencesAsync(taskItem.UpdatedBy ?? 0, notificationType);
            if (taskItem.UpdatedBy.HasValue && (notificationPreference.Count == 0 || notificationPreference.Any(p => p.IsEnabled)))
                usersToNotify.Add(taskItem.UpdatedBy.Value);
        }

        if (taskItem.GradedBy.HasValue && !usersToNotify.Contains(taskItem.GradedBy.Value))
        {
            var notificationPreference = await _userRepository.GetNotificationPreferencesAsync(taskItem.GradedBy ?? 0, notificationType);
            if (taskItem.GradedBy.HasValue && (notificationPreference.Count == 0 || notificationPreference.Any(p => p.IsEnabled)))
                usersToNotify.Add(taskItem.GradedBy.Value);
        }

        if (taskItem.ActiveBy.HasValue && !usersToNotify.Contains(taskItem.ActiveBy.Value))
        {
            var notificationPreference = await _userRepository.GetNotificationPreferencesAsync(taskItem.ActiveBy ?? 0, notificationType);
            if (taskItem.ActiveBy.HasValue && (notificationPreference.Count == 0 || notificationPreference.Any(p => p.IsEnabled)))
                usersToNotify.Add(taskItem.ActiveBy.Value);
        }

        if (taskItem.ArchivedBy.HasValue && !usersToNotify.Contains(taskItem.ArchivedBy.Value))
        {
            var notificationPreference = await _userRepository.GetNotificationPreferencesAsync(taskItem.ArchivedBy ?? 0, notificationType);
            if (taskItem.ArchivedBy.HasValue && (notificationPreference.Count == 0 || notificationPreference.Any(p => p.IsEnabled)))
                usersToNotify.Add(taskItem.ArchivedBy.Value);
        }

        if (taskItem.CompletedBy.HasValue && !usersToNotify.Contains(taskItem.CompletedBy.Value))
        {
            var notificationPreference = await _userRepository.GetNotificationPreferencesAsync(taskItem.CompletedBy ?? 0, notificationType);
            if (taskItem.CompletedBy.HasValue && (notificationPreference.Count == 0 || notificationPreference.Any(p => p.IsEnabled)))
                usersToNotify.Add(taskItem.CompletedBy.Value);
        }

        if (taskItem.BonusStatusBy.HasValue && !usersToNotify.Contains(taskItem.BonusStatusBy.Value))
        {
            var notificationPreference = await _userRepository.GetNotificationPreferencesAsync(taskItem.BonusStatusBy ?? 0, notificationType);
            if (taskItem.BonusStatusBy.HasValue && (notificationPreference.Count == 0 || notificationPreference.Any(p => p.IsEnabled)))
                usersToNotify.Add(taskItem.BonusStatusBy.Value);
        }

        if (taskItem.AllowanceApprovalStatusBy.HasValue && !usersToNotify.Contains(taskItem.AllowanceApprovalStatusBy.Value))
        {
            var notificationPreference = await _userRepository.GetNotificationPreferencesAsync(taskItem.AllowanceApprovalStatusBy ?? 0, notificationType);
            if (taskItem.AllowanceApprovalStatusBy.HasValue && (notificationPreference.Count == 0 || notificationPreference.Any(p => p.IsEnabled)))
                usersToNotify.Add(taskItem.AllowanceApprovalStatusBy.Value);
        }

        if (excludeCurrentUser && usersToNotify.Contains(currentUserId))
            usersToNotify.Remove(currentUserId);

        return usersToNotify.Distinct().ToList();
    }

    private async Task SendTaskItemNotificationsAsync(TaskItem taskItem, string title, string body, NotificationType notificationType, long currentUserId, long? previousAssignedTo = null)
    {
        try
        {
            if (taskItem.IsPrivate)
                return;

            var data = new Dictionary<string, string>
            {
                ["taskId"] = taskItem.Id.ToString(),
                ["type"] = ((int)notificationType).ToString()
            };

            var usersToNotify = await GetUsersToNotify(taskItem, notificationType, previousAssignedTo, currentUserId);
            if (usersToNotify.Contains(currentUserId))
            {
                usersToNotify.Remove(currentUserId);
            }

            foreach (var userId in usersToNotify)
            {
                var userDevices = await _userDevicesRepository.GetUserDevicesAsync(userId);
                userDevices = userDevices.Where(d => !string.IsNullOrEmpty(d.FcmToken)).ToList();
                if (userDevices.Any())
                {
                    await SendToUserDevicesAsync(userDevices, title, body, data);
                    // await _userDevicesRepository.SaveChangesAsync();
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending {NotificationType} notifications for task {TaskId}: {TaskName}", notificationType, taskItem.Id, taskItem.Name);
        }
    }

    public async Task SendTaskCreatedNotificationsAsync(TaskItem taskItem, long currentUserId)
    {
        var title = "Task Created";
        var body = $"New task created by {taskItem.CreatedByUser?.FirstName} {taskItem.CreatedByUser?.LastName}: {taskItem.Name}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskCreated, currentUserId);
    }

    public async Task SendTaskDeletedNotificationsAsync(TaskItem taskItem, long currentUserId)
    {
        var title = "Task Deleted";
        var body = $"'{taskItem.Name}' was deleted";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskDeleted, currentUserId);
    }

    public async Task SendTaskAssignedNotificationsAsync(TaskItem taskItem, long currentUserId)
    {
        var title = "Task Assigned";
        var body = $"{taskItem.Name} was assigned to {taskItem.AssignedToUser?.FirstName} {taskItem.AssignedToUser?.LastName}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskAssigned, currentUserId);
    }
    public async Task SendTaskUnassignedNotificationsAsync(TaskItem taskItemBeforeUpdate, long currentUserId)
    {
        var title = "Task Unassigned";
        var body = $"{taskItemBeforeUpdate.Name} was unassigned from {taskItemBeforeUpdate.AssignedToUser?.FirstName} {taskItemBeforeUpdate.AssignedToUser?.LastName}";
        await SendTaskItemNotificationsAsync(taskItemBeforeUpdate, title, body, NotificationType.TaskUnassigned, currentUserId);
    }

    public async Task SendTaskReassignedNotificationsAsync(TaskItem taskItem, TaskItem taskItemBeforeUpdate, long currentUserId)
    {
        var title = "Task Reassigned";
        var body = $"{taskItem.Name} was reassigned from {taskItemBeforeUpdate.AssignedToUser?.FirstName} {taskItemBeforeUpdate.AssignedToUser?.LastName} to {taskItem.AssignedToUser?.FirstName} {taskItem.AssignedToUser?.LastName}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskReassigned, currentUserId, taskItemBeforeUpdate.AssignedTo);
    }

    public async Task SendTaskMarkedCompletedNotificationsAsync(TaskItem taskItem, long currentUserId)
    {
        var title = "Task Completed";
        var body = $"{taskItem.Name} was completed by {taskItem.CompletedByUser?.FirstName} {taskItem.CompletedByUser?.LastName}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskMarkedCompleted, currentUserId);
    }

    public async Task SendTaskMarkedIncompleteNotificationsAsync(TaskItem taskItem, long currentUserId)
    {
        var title = "Task Marked Incomplete";
        var body = $"{taskItem.Name} was marked incomplete by {taskItem.UpdatedByUser?.FirstName} {taskItem.UpdatedByUser?.LastName}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskMarkedIncomplete, currentUserId);
    }

    public async Task SendTaskProgressUpdatedNotificationsAsync(TaskItem taskItem, byte previousPercentComplete, long currentUserId)
    {
        var title = "Task Progress Updated";
        var body = $"{taskItem.Name}: task progress updated from {previousPercentComplete}% to {taskItem.PercentComplete}%";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskProgressUpdated, currentUserId);
    }

    public async Task SendTaskMarkedActiveNotificationsAsync(TaskItem taskItem, long currentUserId)
    {
        var title = "Task Marked Active";
        var body = $"{taskItem.Name} was marked active by {taskItem.UpdatedByUser?.FirstName} {taskItem.UpdatedByUser?.LastName}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskMarkedActive, currentUserId);
    }

    public async Task SendTaskMarkedInactiveNotificationsAsync(TaskItem taskItem, long currentUserId)
    {
        var title = "Task Marked Inactive";
        var body = $"{taskItem.Name} was marked inactive by {taskItem.UpdatedByUser?.FirstName} {taskItem.UpdatedByUser?.LastName}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskMarkedInactive, currentUserId);
    }

    public async Task SendTaskArchivedNotificationsAsync(TaskItem taskItem, long currentUserId)
    {
        var title = "Task Archived";
        var body = $"{taskItem.Name} was archived by {taskItem.UpdatedByUser?.FirstName} {taskItem.UpdatedByUser?.LastName}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskArchived, currentUserId);
    }

    public async Task SendTaskUnarchivedNotificationsAsync(TaskItem taskItem, long currentUserId)
    {
        var title = "Task Unarchived";
        var body = $"{taskItem.Name} was unarchived by {taskItem.UpdatedByUser?.FirstName} {taskItem.UpdatedByUser?.LastName}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskUnarchived, currentUserId);
    }

    public async Task SendTaskGroupChangedNotificationsAsync(TaskItem taskItem, string? previousValue, long currentUserId)
    {
        var title = "Task Group Changed";
        var body = $"{taskItem.Name}: task group ";
        if (!string.IsNullOrWhiteSpace(taskItem.Group?.Name))
        {
            if (!string.IsNullOrWhiteSpace(previousValue))
            {
                body += $"changed from {previousValue} to {taskItem.Group.Name}";
            }
            else
            {
                body += $"changed to {taskItem.Group.Name}";
            }
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(previousValue))
            {
                body += $"assignment removed. Previous value: {previousValue}";
            }
            else
            {
                _logger.LogError("Both current and previous group values are null or empty for task {TaskId}", taskItem.Id);
                return;
            }
        }

        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskGroupChanged, currentUserId);
    }

    public async Task SendTaskKindChangedNotificationsAsync(TaskItem taskItem, string? previousValue, long currentUserId)
    {
        var title = "Task Kind Changed";
        var body = $"{taskItem.Name}: Task kind ";

        if (!string.IsNullOrWhiteSpace(taskItem.Kind?.Name))
        {
            if (!string.IsNullOrWhiteSpace(previousValue))
            {
                body += $"changed from {previousValue} to {taskItem.Kind.Name}";
            }
            else
            {
                body += $"changed to {taskItem.Kind.Name}";
            }
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(previousValue))
            {
                body += $"assignment removed. Previous value: {previousValue}";
            }
            else
            {
                _logger.LogError("Both current and previous kind values are null or empty for task {TaskId}", taskItem.Id);
                return;
            }
        }
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskKindChanged, currentUserId);
    }

    public async Task SendTaskCategoryChangedNotificationsAsync(TaskItem taskItem, string? previousValue, long currentUserId)
    {
        var title = "Task Category Changed";
        var body = $"{taskItem.Name}: Task category ";
        if (!string.IsNullOrWhiteSpace(taskItem.Category?.Name))
        {
            if (!string.IsNullOrWhiteSpace(previousValue))
            {
                body += $"changed from {previousValue} to {taskItem.Category.Name}";
            }
            else
            {
                body += $"changed to {taskItem.Category.Name}";
            }
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(previousValue))
            {
                body += $"assignment removed. Previous value: {previousValue}";
            }
            else
            {
                _logger.LogError("Both current and previous category values are null or empty for task {TaskId}", taskItem.Id);
                return;
            }
        }
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskCategoryChanged, currentUserId);
    }

    public async Task SendTaskDetailsUpdatedNotificationsAsync(TaskItem taskItem, long currentUserId)
    {
        var title = "Task Details Updated";
        var body = $"{taskItem.Name}: task details updated by {taskItem.UpdatedByUser?.FirstName} {taskItem.UpdatedByUser?.LastName}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskDetailsUpdated, currentUserId);
    }

    public async Task SendTaskPriorityChangedNotificationsAsync(TaskItem taskItem, long currentUserId, TaskItemPriority previousValue = TaskItemPriority.None)
    {
        var title = "Task Priority Changed";
        var body = $"{taskItem.Name}: Task priority ";
        if (taskItem.Priority != TaskItemPriority.None)
        {
            if (previousValue != TaskItemPriority.None)
            {
                body += $"changed from {previousValue.ToDescription()} to {taskItem.Priority.ToDescription()}";
            }
            else
            {
                body += $"changed to {taskItem.Priority.ToDescription()}";
            }
        }
        else
        {
            if (previousValue != TaskItemPriority.None)
            {
                body += $"assignment removed. Previous value: {previousValue.ToDescription()}";
            }
            else
            {
                _logger.LogError("Both current and previous priority values are {Priority} for task {TaskId}", TaskItemPriority.None.ToDescription(), taskItem.Id);
                return;
            }
        }
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskPriorityChanged, currentUserId);
    }

    public async Task SendTaskCreditsAssignedNotificationsAsync(TaskItem taskItem, long currentUserId)
    {
        var title = "Task Credits Assigned";
        var body = $"{taskItem.Name}: task credits assigned: {taskItem.Credits} by {taskItem.UpdatedByUser?.FirstName} {taskItem.UpdatedByUser?.LastName}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskCreditsAssigned, currentUserId);
    }

    public async Task SendTaskCreditsRemovedNotificationsAsync(TaskItem taskItem, byte previousValue, long currentUserId)
    {
        var title = "Task Credits Removed";
        var body = $"{taskItem.Name}: Task credits removed (was {previousValue}) by {taskItem.UpdatedByUser?.FirstName} {taskItem.UpdatedByUser?.LastName}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskCreditsRemoved, currentUserId);
    }

    public async Task SendTaskCreditsChangedNotificationsAsync(TaskItem taskItem, byte previousValue, long currentUserId)
    {
        var title = "Task Credits Changed";
        var body = $"{taskItem.Name}: Task credits changed from {previousValue} to {taskItem.Credits} by {taskItem.UpdatedByUser?.FirstName} {taskItem.UpdatedByUser?.LastName}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskCreditsChanged, currentUserId);
    }

    public async Task SendTaskGradedNotificationsAsync(TaskItem taskItem, long currentUserId)
    {
        var title = "Task Graded";
        var body = $"{taskItem.Name}: Task grade assigned: {taskItem.Grade?.LetterGrade ?? "No Grade"} by {taskItem.UpdatedByUser?.FirstName} {taskItem.UpdatedByUser?.LastName}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskGraded, currentUserId);
    }

    public async Task SendTaskGradeChangedNotificationsAsync(TaskItem taskItem, string previousLetterGrade, long currentUserId)
    {
        var title = "Task Grade Changed";
        var currentLetterGrade = taskItem.Grade?.LetterGrade ?? "No Grade";
        var body = $"{taskItem.Name}: Task grade changed from {previousLetterGrade} to {currentLetterGrade} by {taskItem.UpdatedByUser?.FirstName} {taskItem.UpdatedByUser?.LastName}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskGradeChanged, currentUserId);
    }

    public async Task SendTaskGradeRemovedNotificationsAsync(TaskItem taskItem, string previousLetterGrade, long currentUserId)
    {
        var title = "Task Grade Removed";
        var body = $"{taskItem.Name}: Task grade removed (was {previousLetterGrade})";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskGradeRemoved, currentUserId);
    }

    public async Task SendBonusAssignedNotificationsAsync(TaskItem taskItem, long currentUserId)
    {
        var title = "Bonus Assigned";
        var body = $"{taskItem.AssignedToUser?.FirstName} {taskItem.AssignedToUser?.LastName} was assigned a bonus of {taskItem.MaxBonus} for task '{taskItem.Name}'.";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.BonusAssigned, currentUserId);
    }

    public async Task SendBonusRemovedNotificationsAsync(TaskItem taskItem, string previousValue, long currentUserId)
    {
        var title = "Bonus Removed";
        var body = $"{taskItem.AssignedToUser?.FirstName} {taskItem.AssignedToUser?.LastName} had a bonus removed (was {previousValue}) for task '{taskItem.Name}'.";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.BonusRemoved, currentUserId);
    }

    public async Task SendBonusChangedNotificationsAsync(TaskItem taskItem, string previousValue, long currentUserId)
    {
        var title = "Bonus Changed";
        var body = $"{taskItem.AssignedToUser?.FirstName} {taskItem.AssignedToUser?.LastName} had a bonus changed from {previousValue} to {taskItem.MaxBonus} for task '{taskItem.Name}'.";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.BonusChanged, currentUserId);
    }

    public async Task SendBonusClaimedNotificationsAsync(TaskItem taskItem, long currentUserId)
    {
        var title = "Bonus Claimed";
        var body = $"{taskItem.AssignedToUser?.FirstName} {taskItem.AssignedToUser?.LastName} claimed bonus {taskItem.MaxBonus} for task '{taskItem.Name}'.";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.BonusClaimed, currentUserId);
    }

    public async Task SendBonusApprovedNotificationsAsync(TaskItem taskItem, long currentUserId)
    {
        try
        {
            var title = "Bonus Approved";
            var body = $"{taskItem.BonusStatusByUser?.FirstName} {taskItem.BonusStatusByUser?.LastName} approved bonus {taskItem.ApprovedBonus} for task '{taskItem.Name}'"
                    + $" for {taskItem.AssignedToUser?.FirstName} {taskItem.AssignedToUser?.LastName}.";
            var data = new Dictionary<string, string>
            {
                ["taskId"] = taskItem.Id.ToString(),
                ["type"] = ((int)NotificationType.BonusApproved).ToString(),
                ["approvedUserId"] = taskItem.AssignedToUser?.Id.ToString() ?? string.Empty,
                ["approvedBonus"] = taskItem.ApprovedBonus ?? string.Empty,
            };

            var usersToNotify = await GetUsersToNotify(taskItem, NotificationType.BonusApproved, null, currentUserId);
            foreach (var userId in usersToNotify)
            {
                var userDevices = await _userDevicesRepository.GetUserDevicesAsync(userId);
                userDevices = userDevices.Where(d => !string.IsNullOrEmpty(d.FcmToken)).ToList();
                if (userDevices.Any())
                {
                    await SendToUserDevicesAsync(userDevices, title, body, data);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending bonus approved notification for task {TaskId}: {TaskName}", taskItem.Id, taskItem.Name);
        }
    }

    public async Task SendBonusRejectedNotificationsAsync(TaskItem taskItem, long currentUserId)
    {
        var title = "Bonus Rejected";
        var body = $"{taskItem.BonusStatusByUser?.FirstName} {taskItem.BonusStatusByUser?.LastName} rejected bonus {taskItem.MaxBonus} for task '{taskItem.Name}'"
                + $" for {taskItem.AssignedToUser?.FirstName} {taskItem.AssignedToUser?.LastName}.";

        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.BonusRejected, currentUserId);
    }

    private (string rewardWordCapital, string rewardWordLower) GetRewardWords(bool isBusiness)
    {
        try
        {
            string rewardWordLower = string.Empty; 
            string rewardWordCapital = string.Empty;

            rewardWordCapital = isBusiness ? "Incentive" : "Allowance";
            rewardWordLower = rewardWordCapital.ToLowerInvariant();

            return (rewardWordCapital, rewardWordLower);

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving reward words for team ID {TeamId}", _currentUser.TeamId);
            throw;
        }
    }

    public async Task SendTaskAllowanceApprovedNotificationsAsync(TaskItem taskItem, bool isBusiness, long currentUserId)
    {
        (var rewardWordCapital, var rewardWordLower) = GetRewardWords(isBusiness);
        try
        {
            var title = $"Task {rewardWordCapital}-Approved";
            var body = $"{taskItem.CreatedByUser?.FirstName} {taskItem.CreatedByUser?.LastName}'s task {taskItem.Name} was {rewardWordLower}-approved by {taskItem.AllowanceApprovalStatusByUser?.FirstName} {taskItem.AllowanceApprovalStatusByUser?.LastName}.";
            var data = new Dictionary<string, string>
            {
                ["taskId"] = taskItem.Id.ToString(),
                ["type"] = ((int)NotificationType.TaskAllowanceApproved).ToString(),
                ["approvedUserId"] = taskItem.AssignedToUser?.Id.ToString() ?? string.Empty,
            };

            var usersToNotify = await GetUsersToNotify(taskItem, NotificationType.TaskAllowanceApproved, null, currentUserId);
            foreach (var userId in usersToNotify)
            {
                var userDevices = await _userDevicesRepository.GetUserDevicesAsync(userId);
                userDevices = userDevices.Where(d => !string.IsNullOrEmpty(d.FcmToken)).ToList();
                if (userDevices.Any())
                {
                    await SendToUserDevicesAsync(userDevices, title, body, data);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending {rewardWordLower} approved notification for task {taskItem.Id}: {taskItem.Name}");
        }
    }

    public async Task SendTaskAllowanceRejectedNotificationsAsync(TaskItem taskItem, bool isBusiness, long currentUserId)
    {
        (var rewardWordCapital, var rewardWordLower) = GetRewardWords(isBusiness);
        var title = $"Task {rewardWordCapital}-Rejected";
        var body = $"{taskItem.CreatedByUser?.FirstName} {taskItem.CreatedByUser?.LastName}'s task {taskItem.Name} was {rewardWordLower}-rejected by {taskItem.AllowanceApprovalStatusByUser?.FirstName} {taskItem.AllowanceApprovalStatusByUser?.LastName}.";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskAllowanceRejected, currentUserId);
    }

    public async Task SendTaskCommentCreatedNotificationsAsync(TaskItem taskItem, TaskComment taskComment, long currentUserId)
    {
        var title = "New Task Comment";
        var body = $"{taskComment.CreatedByUser?.FirstName} {taskComment.CreatedByUser?.LastName} commented on task '{taskItem.Name}': {taskComment.Content}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskCommentCreated, currentUserId);
    }

    public async Task SendTaskCommentUpdatedNotificationsAsync(TaskItem taskItem, TaskComment taskComment, string previousValue, long currentUserId)
    {
        var title = "Task Comment Updated";
        var body = $"{taskComment.CreatedByUser?.FirstName} {taskComment.CreatedByUser?.LastName} updated their comment on task '{taskItem.Name}': {taskComment.Content}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskCommentUpdated, currentUserId);
    }

    public async Task SendTaskCommentDeletedNotificationsAsync(TaskItem taskItem, TaskComment taskComment, long currentUserId)
    {
        var title = "Task Comment Deleted";
        var body = $"{taskComment.CreatedByUser?.FirstName} {taskComment.CreatedByUser?.LastName} deleted their comment on task '{taskItem.Name}': {taskComment.Content}";
        await SendTaskItemNotificationsAsync(taskItem, title, body, NotificationType.TaskCommentDeleted, currentUserId);
    }

    private (DateTime localStartAt, DateTime localEndAt) GetUserLocalAllowanceDates(string timezone, DateTimeOffset startAt, DateTimeOffset endAt)
    {
        var localStartAt = startAt.DateTime;
        var localEndAt = endAt.DateTime;
        if (!(string.IsNullOrEmpty(timezone) || timezone == "UTC"))
        {
            var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(timezone);
            localStartAt = TimeZoneInfo.ConvertTimeFromUtc(startAt.DateTime, timeZoneInfo);
            localEndAt = TimeZoneInfo.ConvertTimeFromUtc(endAt.DateTime, timeZoneInfo);
        }

        return (localStartAt, localEndAt);
    }

    public async Task SendAllowanceClaimedNotificationAsync(AllowanceHistory allowanceHistory, bool isBusiness, long currentUserId)
    {
        (var rewardWordCapital, var rewardWordLower) = GetRewardWords(isBusiness);
        try
        {
            var title = $"{rewardWordCapital} Claimed";
            var data = new Dictionary<string, string>
            {
                ["allowanceHistoryId"] = allowanceHistory.Id.ToString(),
                ["type"] = ((int)NotificationType.AllowanceClaimed).ToString()
            };

            var usersToNotify = await GetUsersToNotify(allowanceHistory, NotificationType.AllowanceClaimed, currentUserId);
            if (usersToNotify.Contains(_currentUser.UserId))
            {
                usersToNotify.Remove(_currentUser.UserId);
            }

            foreach (var userId in usersToNotify)
            {
                var userDevices = await _userDevicesRepository.GetUserDevicesAsync(userId);
                userDevices = userDevices.Where(d => !string.IsNullOrEmpty(d.FcmToken)).ToList();
                if (userDevices.Any())
                {
                    // TODO: should really do this per device in this and subsequent methods and should factor this out into a helper method
                    var timezone = userDevices.Where(d => !string.IsNullOrEmpty(d.Timezone)).Select(d => d.Timezone).FirstOrDefault();
                    if (string.IsNullOrEmpty(timezone))
                    {
                        // timezone not set for any device, so user has never logged in yet - no registered device to notify, so skip notification
                        return;
                    }

                    (DateTime localStartAt, DateTime localEndAt) = GetUserLocalAllowanceDates(timezone, allowanceHistory.CalculatedStartAt, allowanceHistory.CalculatedEndAt);
                    var body = $"{allowanceHistory.User?.FirstName} {allowanceHistory.User?.LastName} claimed {rewardWordLower} for ${allowanceHistory.CalculatedAmount}"
                                + $" for {rewardWordLower} interval {localStartAt.Date:d} - {localEndAt.Date:d}.";
                    await SendToUserDevicesAsync(userDevices, title, body, data);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending {rewardWordLower} claimed notification for allowance history id: {allowanceHistory.Id}");
        }
    }

    public async Task SendAllowanceApprovedNotificationAsync(AllowanceHistory allowanceHistory, bool isBusiness, long currentUserId)
    {
        (var rewardWordCapital, var rewardWordLower) = GetRewardWords(isBusiness);
        try
        {
            var title = $"{rewardWordCapital} Approved";
            var data = new Dictionary<string, string>
            {
                ["allowanceHistoryId"] = allowanceHistory.Id.ToString(),
                ["type"] = ((int)NotificationType.AllowanceApproved).ToString(),
                ["approvedUserId"] = allowanceHistory.UserId.ToString(),
                ["approvedAmount"] = allowanceHistory.ApprovedAmount?.ToString() ?? "0",
            };

            var usersToNotify = await GetUsersToNotify(allowanceHistory, NotificationType.AllowanceApproved, currentUserId);
            if (usersToNotify.Contains(_currentUser.UserId))
            {
                usersToNotify.Remove(_currentUser.UserId);
            }

            foreach (var userId in usersToNotify)
            {
                var userDevices = await _userDevicesRepository.GetUserDevicesAsync(userId);
                userDevices = userDevices.Where(d => !string.IsNullOrEmpty(d.FcmToken)).ToList();
                if (userDevices.Any())
                {
                    var timezone = userDevices.Where(d => !string.IsNullOrEmpty(d.Timezone)).Select(d => d.Timezone).FirstOrDefault();
                    if (string.IsNullOrEmpty(timezone))
                    {
                        // timezone not set for any device, so user has never logged in yet - no registered device to notify, so skip notification
                        return;
                    }

                    (DateTime localStartAt, DateTime localEndAt) = GetUserLocalAllowanceDates(timezone, allowanceHistory.CalculatedStartAt, allowanceHistory.CalculatedEndAt);
                    var body = $"{allowanceHistory.ApprovedByUser?.FirstName} {allowanceHistory.ApprovedByUser?.LastName} approved {rewardWordLower} ${allowanceHistory.ApprovedAmount}"
                            + $" for {allowanceHistory.User?.FirstName} {allowanceHistory.User?.LastName} for {rewardWordLower} interval {allowanceHistory.AllowanceInterval?.Name} ({localStartAt.Date:d} - {localEndAt.Date:d}).";
                    await SendToUserDevicesAsync(userDevices, title, body, data);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending {rewardWordLower} approved notification for allowance history id: {allowanceHistory.Id}");
        }
    }

    public async Task SendAllowanceRejectedNotificationAsync(AllowanceHistory allowanceHistory, bool isBusiness, long currentUserId)
    {
        (var rewardWordCapital, var rewardWordLower) = GetRewardWords(isBusiness);
        try
        {
            var title = $"{rewardWordCapital} Rejected";
            var data = new Dictionary<string, string>
            {
                ["allowanceHistoryId"] = allowanceHistory.Id.ToString(),
                ["type"] = ((int)NotificationType.AllowanceRejected).ToString()
            };

            var usersToNotify = await GetUsersToNotify(allowanceHistory, NotificationType.AllowanceRejected, currentUserId);
            if (usersToNotify.Contains(_currentUser.UserId))
            {
                usersToNotify.Remove(_currentUser.UserId);
            }

            foreach (var userId in usersToNotify)
            {
                var userDevices = await _userDevicesRepository.GetUserDevicesAsync(userId);
                userDevices = userDevices.Where(d => !string.IsNullOrEmpty(d.FcmToken)).ToList();
                if (userDevices.Any())
                {
                    var timezone = userDevices.Where(d => !string.IsNullOrEmpty(d.Timezone)).Select(d => d.Timezone).FirstOrDefault();
                    if (string.IsNullOrEmpty(timezone))
                    {
                        // timezone not set for any device, so user has never logged in yet - no registered device to notify, so skip notification
                        return;
                    }

                    (DateTime localStartAt, DateTime localEndAt) = GetUserLocalAllowanceDates(timezone, allowanceHistory.CalculatedStartAt, allowanceHistory.CalculatedEndAt);
                    var body = $"{allowanceHistory.ApprovedByUser?.FirstName} {allowanceHistory.ApprovedByUser?.LastName} rejected {rewardWordLower} ${allowanceHistory.CalculatedAmount}"
                            + $" for {allowanceHistory.User?.FirstName} {allowanceHistory.User?.LastName} for {rewardWordLower} interval {allowanceHistory.AllowanceInterval?.Name} ({localStartAt.Date:d} - {localEndAt.Date:d}).";
                    await SendToUserDevicesAsync(userDevices, title, body, data);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending {rewardWordLower} rejected notification for allowance history id: {allowanceHistory.Id}");
        }
    }

    public async Task SendTaskAllowanceIntervalRemovedNotificationsAsync(TaskItem existingEntityAfterUpdate, string existingEntityBeforeUpdateIntervalName, bool isBusiness, long currentUserId)
    {

        (var rewardWordCapital, var rewardWordLower) = GetRewardWords(isBusiness);
        var title = $"Task {rewardWordCapital} Interval Removed";
        var body = $"{rewardWordCapital} interval unassigned for task {existingEntityAfterUpdate.Name}. (Previous: {existingEntityBeforeUpdateIntervalName})";
        await SendTaskItemNotificationsAsync(existingEntityAfterUpdate, title, body, NotificationType.TaskAllowanceIntervalRemoved, currentUserId);
    }

    public async Task SendTaskAllowanceIntervalAssignedNotificationsAsync(TaskItem existingEntityAfterUpdate, bool isBusiness, long currentUserId)
    {
        if (existingEntityAfterUpdate.TeamAllowanceInterval == null)
        {
            _logger.LogWarning("TeamAllowanceInterval navigation property is null for TaskItem {TaskItemId} with TeamAllowanceIntervalId {IntervalId}. Skipping notification.", 
                existingEntityAfterUpdate.Id, existingEntityAfterUpdate.TeamAllowanceIntervalId);
            return;
        }

        (var rewardWordCapital, var rewardWordLower) = GetRewardWords(isBusiness);
        var title = $"Task {rewardWordCapital} Interval Assigned";
        var body = $"Task {existingEntityAfterUpdate.Name} was assigned to {rewardWordLower} interval {existingEntityAfterUpdate.TeamAllowanceInterval.Name}";
        await SendTaskItemNotificationsAsync(existingEntityAfterUpdate, title, body, NotificationType.TaskAllowanceIntervalAssigned, currentUserId);
    }

    public async Task SendTaskAllowanceIntervalChangedNotificationsAsync(TaskItem existingEntityAfterUpdate, long currentUserId, string? existingEntityBeforeUpdateIntervalName = null)
    {

        if (existingEntityAfterUpdate.TeamAllowanceInterval == null)
        {
            _logger.LogWarning("TeamAllowanceInterval navigation property is null for TaskItem {TaskItemId} with TeamAllowanceIntervalId {IntervalId}. Skipping notification.", 
                existingEntityAfterUpdate.Id, existingEntityAfterUpdate.TeamAllowanceIntervalId);
            return;
        }

        bool isBusiness = await _teamRepository.IsBusiness(_currentUser.TeamId);
        (var rewardWordCapital, var rewardWordLower) = GetRewardWords(isBusiness);
        var title = $"Task {rewardWordCapital} Interval Changed";
        var body = $"Task {existingEntityAfterUpdate.Name} {rewardWordLower} interval changed to {existingEntityAfterUpdate.TeamAllowanceInterval.Name} (Previous: {existingEntityBeforeUpdateIntervalName})";
        await SendTaskItemNotificationsAsync(existingEntityAfterUpdate, title, body, NotificationType.TaskAllowanceIntervalChanged, currentUserId);
    }

    private string GetNotificationBody(TaskItem taskItem, NotificationType notificationType)
    {
        string body = string.Empty;
        switch (notificationType)
        {
            case NotificationType.TaskDueSoon:
                body = $"{taskItem.Name} is due on {taskItem.DueAt?.Date:d}.";
                break;
            case NotificationType.TaskDue:
                body = $"{taskItem.Name} is due today.";
                break;
            case NotificationType.TaskStartingSoon:
                body = $"{taskItem.Name} is starting on {taskItem.StartAt?.Date:d}.";
                break;
            case NotificationType.TaskStarted:
                body = $"{taskItem.Name} starts today.";
                break;
            case NotificationType.TaskEndingSoon:
                body = $"{taskItem.Name} is ending on {taskItem.EndAt?.Date:d}.";
                break;
            case NotificationType.TaskEnded:
                body = $"{taskItem.Name} ended today.";
                break;
            default:
                _logger.LogError("Unsupported notification type {NotificationType} for task {TaskId}", notificationType, taskItem.Id);
                break;
        }

        return body;
    }

    private async Task SendTaskNotificationsAsync(Func<int, int, Task<List<TaskItem>>> getBatchFunc, Func<Task<int>> getCountFunc, NotificationType notificationType, string title, long currentUserId)
    {
        var totalCount = await getCountFunc();
        _logger.LogInformation($"Processing {totalCount} task items for {notificationType.ToDescription()} notifications in batches of {Defaults.DEFAULT_BATCH_SIZE}");
        
        if (totalCount == 0)
        {
            _logger.LogInformation("No task items to process.");
            return;
        }

        for (int skip = 0; skip < totalCount; skip += Defaults.DEFAULT_BATCH_SIZE)
        {
            var batch = await getBatchFunc(skip, Defaults.DEFAULT_BATCH_SIZE);
            var batchNumber = (skip / Defaults.DEFAULT_BATCH_SIZE) + 1;
            var totalBatches = (int)Math.Ceiling((double)totalCount / Defaults.DEFAULT_BATCH_SIZE);

            _logger.LogInformation($"Processing batch {batchNumber}/{totalBatches} with {batch.Count} items");
            
            // Collect all database changes for this batch to save at once
            var notificationsToAdd = new List<UserNotification>();
            var notificationsToUpdate = new List<UserNotification>();
            
            foreach (var taskItem in batch)
            {
                // don't exclude current user for periodic task notifications
                var excludeCurrentUser = notificationType != NotificationType.TaskDueSoon &&
                                         notificationType != NotificationType.TaskDue &&
                                         notificationType != NotificationType.TaskStartingSoon &&
                                         notificationType != NotificationType.TaskStarted &&
                                         notificationType != NotificationType.TaskEndingSoon &&
                                         notificationType != NotificationType.TaskEnded;

                var taskUsersToNotify = await GetUsersToNotify(taskItem, notificationType, null, currentUserId, excludeCurrentUser);
                foreach (var userId in taskUsersToNotify)
                {
                    var existingNotification = await _userNotificationRepository.GetExistingTaskItemNotificationAsync(userId, taskItem.Id, notificationType, new DateTimeOffset(_dateTimeProvider.UtcNow.Date, TimeSpan.Zero));
                    if (existingNotification != null && existingNotification.SentAt.HasValue)
                        continue;

                    var userDevices = await _userDevicesRepository.GetUserDevicesAsync(userId);
                    userDevices = userDevices.Where(d => !string.IsNullOrEmpty(d.FcmToken)).ToList();
                    if (userDevices.Any())
                    {
                        var data = new Dictionary<string, string>
                        {
                            ["taskId"] = taskItem.Id.ToString(),
                            ["type"] = ((int)notificationType).ToString()
                        };

                        bool isSent = false;
                        var body = GetNotificationBody(taskItem, notificationType);
                        if (string.IsNullOrEmpty(body))
                        {
                            _logger.LogWarning($"Skipping notification for unsupported type {notificationType.ToDescription()} for task {taskItem.Id}");
                            continue;
                        }

                        try
                        {
                            await SendToUserDevicesAsync(userDevices, title, body, data);
                            isSent = true;
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Error sending {notificationType.ToDescription()} notification for task {taskItem.Id} to user {userId}");
                        }

                        if (existingNotification == null)
                        {
                            notificationsToAdd.Add(new UserNotification
                            {
                                UserId = userId,
                                TaskItemId = taskItem.Id,
                                NotificationType = notificationType,
                                NotificationDate = new DateTimeOffset(_dateTimeProvider.UtcNow.Date, TimeSpan.Zero),
                                Title = title,
                                Body = body,
                                Data = System.Text.Json.JsonSerializer.Serialize(data),
                                SentAt = isSent ? _dateTimeProvider.UtcNow : null
                            });
                        }
                        else
                        {
                            existingNotification.SentAt = isSent ? _dateTimeProvider.UtcNow : null;
                            notificationsToUpdate.Add(existingNotification);
                        }
                    }
                }
            }
            
            // Batch database operations - save all changes at once
            try
            {
                if (notificationsToAdd.Any())
                {
                    await _userNotificationRepository.AddRangeAsync(notificationsToAdd);
                }
                
                if (notificationsToUpdate.Any())
                {
                    await _userNotificationRepository.UpdateRangeAsync(notificationsToUpdate);
                }
                
                // Single save operations for the entire batch
                if (notificationsToAdd.Any() || notificationsToUpdate.Any())
                {
                    await _userNotificationRepository.SaveChangesAsync();
                    _logger.LogInformation($"Saved {notificationsToAdd.Count} new and {notificationsToUpdate.Count} updated notifications for batch {batchNumber}");
                }
                
                // Also save device timestamp updates (separate context)
                await _userDevicesRepository.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error saving notification batch {batchNumber}");
            }
            
            // Add a small delay between batches to prevent overwhelming the system
            if (skip + Defaults.DEFAULT_BATCH_SIZE < totalCount)
            {
                await Task.Delay(100);
            }
        }

        _logger.LogInformation($"Completed processing {totalCount} task items for {notificationType.ToDescription()} notifications");
    }

    private async Task SendAllowanceHistoryNotificationsAsync(Func<int, int, Task<List<AllowanceHistory>>> getBatchFunc, Func<Task<int>> getCountFunc, NotificationType notificationType, long currentUserId)
    {
        var totalCount = await getCountFunc();
        _logger.LogInformation($"Processing {totalCount} allowance histories for {notificationType.ToDescription()} notifications in batches of {Defaults.DEFAULT_BATCH_SIZE}");
        
        if (totalCount == 0)
        {
            _logger.LogInformation("No allowance histories to process.");
            return;
        }

        for (int skip = 0; skip < totalCount; skip += Defaults.DEFAULT_BATCH_SIZE)
        {
            var batch = await getBatchFunc(skip, Defaults.DEFAULT_BATCH_SIZE);
            var batchNumber = (skip / Defaults.DEFAULT_BATCH_SIZE) + 1;
            var totalBatches = (int)Math.Ceiling((double)totalCount / Defaults.DEFAULT_BATCH_SIZE);

            _logger.LogInformation($"Processing batch {batchNumber}/{totalBatches} with {batch.Count} items");
            
            foreach (var allowanceHistory in batch)
            {
                var usersToNotify = await GetUsersToNotify(allowanceHistory, notificationType, currentUserId, false);
                foreach (var userId in usersToNotify)
                {
                    var user = await _userRepository.GetAsync(userId);
                    if (user == null)
                    {
                        _logger.LogWarning($"User with ID {userId} not found. Skipping notification for allowance history ID {allowanceHistory.Id}.");
                        continue;
                    }
                    bool isBusiness = await _teamRepository.IsBusiness(user.TeamId);
                    var existingNotification = await _userNotificationRepository.GetExistingAllowanceNotificationAsync(userId, allowanceHistory.Id, notificationType, new DateTimeOffset(_dateTimeProvider.UtcNow.Date, TimeSpan.Zero));
                    if (existingNotification != null && existingNotification.SentAt.HasValue)
                        continue;

                    var userDevices = await _userDevicesRepository.GetUserDevicesAsync(userId);
                    userDevices = userDevices.Where(d => !string.IsNullOrEmpty(d.FcmToken)).ToList();
                    if (userDevices.Any())
                    {
                        var data = new Dictionary<string, string>
                        {
                            ["allowanceHistoryId"] = allowanceHistory.Id.ToString(),
                            ["type"] = ((int)notificationType).ToString()
                        };

                        var timezone = userDevices.Where(d => !string.IsNullOrEmpty(d.Timezone)).Select(d => d.Timezone).FirstOrDefault();
                        if (string.IsNullOrEmpty(timezone))
                        {
                            // timezone not set for any device, so user has never logged in yet - no registered device to notify, so skip notification
                            return;
                        }

                        bool isSent = false;
                        (DateTime localStartAt, DateTime localEndAt) = GetUserLocalAllowanceDates(timezone, allowanceHistory.CalculatedStartAt, allowanceHistory.CalculatedEndAt);

                        (var rewardWordCapital, var rewardWordLower) = GetRewardWords(isBusiness);
                        var body = string.Empty;
                        var title = string.Empty;
                        switch (notificationType)
                        {
                            case NotificationType.AllowanceDaySoon:
                                body = $"{rewardWordCapital} interval {localStartAt.Date:d} - {localEndAt.Date:d}: {rewardWordCapital} day is in {localEndAt.Date - _dateTimeProvider.UtcNow.Date} days!";
                                title = $"{rewardWordCapital} Day Soon";
                                break;
                            case NotificationType.AllowanceDay:
                                body = $"{rewardWordCapital} interval {localStartAt.Date:d} - {localEndAt.Date:d}: Today is {rewardWordLower} day!";
                                title = $"{rewardWordCapital} Day Today";
                                break;
                            default:
                                throw new InvalidOperationException("Unsupported bulk allowance history notification type");
                        }

                        try
                        {
                            await SendToUserDevicesAsync(userDevices, title, body, data);
                            isSent = true;
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Error sending {notificationType.ToDescription()} notification for allowance history id {allowanceHistory.Id} to user {userId}");
                        }

                        if (existingNotification == null)
                        {
                            await _userNotificationRepository.AddAsync(new UserNotification
                            {
                                UserId = userId,
                                AllowanceHistoryId = allowanceHistory.Id,
                                NotificationType = notificationType,
                                NotificationDate = new DateTimeOffset(_dateTimeProvider.UtcNow.Date, TimeSpan.Zero),
                                Title = title,
                                Body = body,
                                Data = System.Text.Json.JsonSerializer.Serialize(data),
                                SentAt = isSent ? _dateTimeProvider.UtcNow : null,
                                CreatedAt = _dateTimeProvider.UtcNow,
                                LastSentAttemptAt = _dateTimeProvider.UtcNow,
                            });
                            await _userNotificationRepository.SaveChangesAsync();
                        }
                        else
                        {
                            existingNotification.SentAt = isSent ? _dateTimeProvider.UtcNow : null;
                            existingNotification.LastSentAttemptAt = _dateTimeProvider.UtcNow;
                            await _userNotificationRepository.UpdateAsync(existingNotification);
                            await _userNotificationRepository.SaveChangesAsync();
                        }
                    }
                }
            }
            
            // Add a small delay between batches to prevent overwhelming the system
            if (skip + Defaults.DEFAULT_BATCH_SIZE < totalCount)
            {
                await Task.Delay(100);
            }
        }

        _logger.LogInformation($"Completed processing {totalCount} allowance histories for {notificationType.ToDescription()} notifications");
    }

    public async Task SendTasksDueSoonNotificationsAsync()
    {
        try
        {
            await SendTaskNotificationsAsync(
                _taskItemRepository.GetTasksDueSoonBatchAsync,
                _taskItemRepository.GetTasksDueSoonCountAsync,
                NotificationType.TaskDueSoon,
                "Task Due Soon",
                Defaults.SystemUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending tasks due soon notifications");
        }
    }

    public async Task SendTasksDueTodayNotificationsAsync()
    {
        try
        {
            await SendTaskNotificationsAsync(
                _taskItemRepository.GetTasksDueTodayBatchAsync,
                _taskItemRepository.GetTasksDueTodayCountAsync,
                NotificationType.TaskDue,
                "Task Due Today",
                Defaults.SystemUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending tasks due today notifications");
        }
    }

    public async Task SendTasksStartingSoonNotificationsAsync()
    {
        try
        {
            await SendTaskNotificationsAsync(
                _taskItemRepository.GetTasksStartingSoonBatchAsync,
                _taskItemRepository.GetTasksStartingSoonCountAsync,
                NotificationType.TaskStartingSoon,
                "Task Starting Soon",
                Defaults.SystemUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending tasks starting soon notifications");
        }
    }

    public async Task SendTasksStartedNotificationsAsync()
    {
        try
        {
            await SendTaskNotificationsAsync(
                _taskItemRepository.GetTasksStartingTodayBatchAsync,
                _taskItemRepository.GetTasksStartingTodayCountAsync,
                NotificationType.TaskStarted,
                "Task Starting Today",
                Defaults.SystemUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending tasks started notifications");
        }
    }

    public async Task SendTasksEndingSoonNotificationsAsync()
    {
        try
        {
            await SendTaskNotificationsAsync(
                _taskItemRepository.GetTasksEndingSoonBatchAsync,
                _taskItemRepository.GetTasksEndingSoonCountAsync,
                NotificationType.TaskEndingSoon,
                "Task Ending Soon",
                Defaults.SystemUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending tasks ending soon notifications");
        }
    }

    public async Task SendTasksEndedNotificationsAsync()
    {
        try
        {
            await SendTaskNotificationsAsync(
                _taskItemRepository.GetTasksEndingTodayBatchAsync,
                _taskItemRepository.GetTasksEndingTodayCountAsync,
                NotificationType.TaskEnded,
                "Task Ending Today",
                Defaults.SystemUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending tasks ended notifications");
        }
    }

    public async Task SendAllowanceDaySoonNotificationsAsync()
    {
        try
        {
            await SendAllowanceHistoryNotificationsAsync(
                _allowanceHistoryRepository.GetHistoriesWithAllowanceDaySoonBatchAsync,
                _allowanceHistoryRepository.GetHistoriesWithAllowanceDaySoonCountAsync,
                NotificationType.AllowanceDaySoon,
                Defaults.SystemUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending allowance day soon notifications");
        }
    }

    public async Task SendAllowanceDayTodayNotificationsAsync()
    {
        try
        {
            await SendAllowanceHistoryNotificationsAsync(
                _allowanceHistoryRepository.GetHistoriesWithAllowanceDayTodayBatchAsync,
                _allowanceHistoryRepository.GetHistoriesWithAllowanceDayTodayCountAsync,
                NotificationType.AllowanceDay,
                Defaults.SystemUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending allowance day today notifications");
        }
    }

    public async Task SendTrialWelcomeNotificationAsync(long userId, bool isBusiness, bool isGrandfathered, int trialDays)
    {
        try
        {
            var userDevices = await _userDevicesRepository.GetUserDevicesAsync(userId);
            userDevices = userDevices.Where(d => !string.IsNullOrEmpty(d.FcmToken)).ToList();
            if (userDevices.Any())
            {
                var teamOrFamily = isBusiness ? "team" : "family";
                var title = "Welcome to DoDone PRO FREE Trial!";
                var body = isGrandfathered 
                    ? $"Thanks for being an early adopter! We've now launched DoDone PRO subscriptions. As our valued founding member, you'll get an exclusive {trialDays}-day grace period to continue enjoying all features FREE before needing to subscribe. We hope you and your {teamOrFamily} stay motivated, organized and productive with DoDone!"
                    : $"Try DoDone PRO FREE for {trialDays} days. Enjoy exploring all the features we offer to help you and your {teamOrFamily} stay motivated, organized and productive!";
    
                var data = new Dictionary<string, string>
                {
                    ["type"] = ((int)NotificationType.TrialWelcome).ToString()
                };
                await SendToUserDevicesAsync(userDevices, title, body, data);
            }
            else
            {
                _logger.LogWarning("No user devices with FCM tokens found for user {UserId}. Skipping trial welcome notification.", userId);
            }

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending trial welcome notification for user {UserId}", userId);
        }
    }

    public async Task SendTrial3DayWarningNotificationAsync(long userId, bool isBusiness, bool isGrandfathered, int trialDays)
    {
        try
        {
            var userDevices = await _userDevicesRepository.GetUserDevicesAsync(userId);
            userDevices = userDevices.Where(d => !string.IsNullOrEmpty(d.FcmToken)).ToList();
            if (userDevices.Any())
            {
                var teamOrFamily = isBusiness ? "team" : "family";
                var title = "DoDone PRO Trial Ending Soon!";
                var body = isGrandfathered 
                    ? $"Your exclusive {trialDays}-day grace period ends in 3 days. Subscribe now to keep all DoDone PRO features and continue staying productive with your {teamOrFamily}. Thanks for being a valued founding member!"
                    : $"Your FREE trial ends in 3 days! Subscribe now to keep all DoDone PRO features and continue staying productive with your {teamOrFamily}.";
    
                var data = new Dictionary<string, string>
                {
                    ["type"] = ((int)NotificationType.Trial3DayWarning).ToString()
                };
                await SendToUserDevicesAsync(userDevices, title, body, data);
            }
            else
            {
                _logger.LogWarning("No user devices with FCM tokens found for user {UserId}. Skipping trial 3-day warning notification.", userId);  
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending trial 3-day warning notification for user {UserId}", userId);
        }
    }

    public async Task SendTrial1DayWarningNotificationAsync(long userId, bool isBusiness, bool isGrandfathered, int trialDays)
    {
        try
        {
            var userDevices = await _userDevicesRepository.GetUserDevicesAsync(userId);
            userDevices = userDevices.Where(d => !string.IsNullOrEmpty(d.FcmToken)).ToList();
            if (userDevices.Any())
            {
                var teamOrFamily = isBusiness ? "team" : "family";
                var title = "DoDone PRO Trial Ends Tomorrow!";
                var body = isGrandfathered 
                    ? $"Your exclusive {trialDays}-day grace period ends tomorrow! Subscribe today to maintain uninterrupted access to all DoDone PRO features. We appreciate your loyalty as a founding member!"
                    : $"Your FREE trial ends tomorrow! Subscribe today to maintain uninterrupted access to all DoDone PRO features and keep your {teamOrFamily} productive.";
    
                var data = new Dictionary<string, string>
                {
                    ["type"] = ((int)NotificationType.Trial1DayWarning).ToString()
                };
                await SendToUserDevicesAsync(userDevices, title, body, data);
            }
            else
            {
                _logger.LogWarning("No user devices with FCM tokens found for user {UserId}. Skipping trial 3-day warning notification.", userId);  
            }

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending trial 1-day warning notification for user {UserId}", userId);
        }
    }

    public async Task SendTrialExpiredNotificationAsync(long userId, bool isBusiness, bool isGrandfathered, int trialDays)
    {
        try
        {
            var userDevices = await _userDevicesRepository.GetUserDevicesAsync(userId);
            userDevices = userDevices.Where(d => !string.IsNullOrEmpty(d.FcmToken)).ToList();
            if (userDevices.Any())
            {
                var teamOrFamily = isBusiness ? "team" : "family";
                var title = "DoDone PRO Trial Expired";
                var body = isGrandfathered 
                    ? $"Your exclusive {trialDays}-day grace period has ended. Subscribe now to restore full access to DoDone PRO features and keep your {teamOrFamily} motivated, organized and productive. Thank you for being a founding member!"
                    : $"Your FREE {trialDays}-day trial has expired. Subscribe now to restore full access to DoDone PRO features and keep your {teamOrFamily} motivated, organized and productive.";
    
                var data = new Dictionary<string, string>
                {
                    ["type"] = ((int)NotificationType.TrialEndedWarning).ToString()
                };
                await SendToUserDevicesAsync(userDevices, title, body, data);
            }
            else
            {
                _logger.LogWarning("No user devices with FCM tokens found for user {UserId}. Skipping trial expired notification.", userId);  
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending trial expired notification for user {UserId}", userId);
        }
    }
}

