/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Db.Dtos;
using DoDone.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using DoDone.Shared;

namespace DoDone.Db.Repositories;

public interface IUserRepository
{
    Task<List<User>> GetAllActiveAsync();
    Task<User?> GetAsync(long userId);
    Task CreateAsync(User user);
    Task<User> UpdateAsync(User user);
    Task<(bool isTeamDeleted, List<DeletedUserInfo> deletedUsers)> DeleteAsync(long userId);
    Task<bool> UserExistsAsync(string username);
    Task<User?> GetByUsernameAsync(string username);
    Task<List<User>> GetTeamAsync(long teamId);
    IQueryable<User> GetTeamQueryable(long teamId);
    Task<int> AdminCount(long teamId);
    Task SaveChangesAsync();
    Task<User?> GetByEmailAsync(string email);
    Task AddNotificationPreferencesAsync(List<UserNotificationPreference> preferences);
    Task<List<UserNotificationPreference>> GetNotificationPreferencesAsync(long userId);
    Task<List<UserNotificationPreference>> GetNotificationPreferencesAsync(long userId, NotificationType notificationType);
    Task<List<long>> GetAdminUsersToNotify(long teamId, NotificationType notificationType);
    Task<List<long>> GetOptInUsersToNotify(long teamId, NotificationType notificationType);
    Task<UserNotificationPreference?> GetNotificationPreferenceAsync(long preferenceId);
    Task UpdateNotificationPreferenceAsync(UserNotificationPreference preference);
    Task UpdateNotificationPreferencesAsync(List<UserNotificationPreference> preferences);

    Task<int> GetGrandfatheredUsersForTrialWelcomeNotificationsCountAsync(DateTimeOffset iosMonetizationStartDate, DateTimeOffset androidMonetizationStartDate);
    Task<List<UserForTrialNotifications>> GetGrandfatheredUsersForTrialWelcomeNotificationsBatchAsync(DateTimeOffset iosMonetizationStartDate, DateTimeOffset androidMonetizationStartDate, int skip, int dEFAULT_BATCH_SIZE);

    Task<int> GetGrandfatheredUsersForTrial3DayWarningNotificationsCountAsync(DateTimeOffset iosMonetizationStartDate, DateTimeOffset androidMonetizationStartDate, int gracePeriodDays);
    Task<List<UserForTrialNotifications>> GetGrandfatheredUsersForTrial3DayWarningNotificationsBatchAsync(DateTimeOffset iosMonetizationStartDate, DateTimeOffset androidMonetizationStartDate, int gracePeriodDays, int skip, int batchSize);

    Task<int> GetGrandfatheredUsersForTrial1DayWarningNotificationsCountAsync(DateTimeOffset iosMonetizationStartDate, DateTimeOffset androidMonetizationStartDate, int gracePeriodDays);
    Task<List<UserForTrialNotifications>> GetGrandfatheredUsersForTrial1DayWarningNotificationsBatchAsync(DateTimeOffset iosMonetizationStartDate, DateTimeOffset androidMonetizationStartDate, int gracePeriodDays, int skip, int batchSize);

    Task<int> GetGrandfatheredUsersForTrialEndedWarningNotificationsCountAsync(DateTimeOffset iosMonetizationStartDate, DateTimeOffset androidMonetizationStartDate, int gracePeriodDays);
    Task<List<UserForTrialNotifications>> GetGrandfatheredUsersForTrialEndedWarningNotificationsBatchAsync(DateTimeOffset iosMonetizationStartDate, DateTimeOffset androidMonetizationStartDate, int gracePeriodDays, int skip, int batchSize);

    Task<int> GetUsersForTrial3DayWarningNotificationsCountAsync();
    Task<List<UserForTrialNotifications>> GetUsersForTrial3DayWarningNotificationsBatchAsync(int skip, int batchSize);
    Task<int> GetUsersForTrial1DayWarningNotificationsCountAsync();
    Task<List<UserForTrialNotifications>> GetUsersForTrial1DayWarningNotificationsBatchAsync(int skip, int batchSize);
    Task<int> GetUsersForTrialEndedWarningNotificationsCountAsync();
    Task<List<UserForTrialNotifications>> GetUsersForTrialEndedWarningNotificationsBatchAsync(int skip, int batchSize);


    Task MarkTrialWelcomeSentAsync(long id);
    Task Mark3DayWarningSentAsync(long id);
    Task Mark1DayWarningSentAsync(long userId);
    Task MarkTrialEndedWarningSentAsync(long userId);
}

public class UserRepository : IUserRepository
{
    private readonly DoDoneDbContext _db;
    private readonly ILogger<UserRepository> _logger;

    public UserRepository(DoDoneDbContext db, ILogger<UserRepository> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<User>> GetAllActiveAsync()
        => await _db.Users
                    .Include(u => u.DeviceRegistrations)
                    .Where(u => u.IsActive)
                    .ToListAsync();

    public async Task<bool> UserExistsAsync(string username)
    {
        var usernameLower = username?.ToLower()?.Trim() ?? string.Empty;
        return await _db.Users.AnyAsync(u => u.UserName != null && u.UserName.ToLower() == usernameLower);
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        var usernameLower = username?.ToLower()?.Trim() ?? string.Empty;
        return await _db.Users
            .AsNoTracking() // Don't track changes for read-only login query
            .Where(u => u.UserName != null && u.UserName.ToLower() == usernameLower)
            .FirstOrDefaultAsync();
    }

    public async Task CreateAsync(User user)
        => await _db.Users.AddAsync(user);

    public async Task<List<User>> GetTeamAsync(long teamId)
        => await _db.Users.Where(x => x.TeamId == teamId).ToListAsync();

    public IQueryable<User> GetTeamQueryable(long teamId)
        => _db.Users.Where(x => x.TeamId == teamId);

    public async Task SaveChangesAsync()
        => await _db.SaveChangesAsync();

    public Task<User?> GetAsync(long userId)
        => _db.Users.Where(u => u.Id == userId).FirstOrDefaultAsync();

    public async Task<(bool isTeamDeleted, List<DeletedUserInfo> deletedUsers)> DeleteAsync(long userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
        {
            return (false, new List<DeletedUserInfo>());
        }

        // Prevent new notifications while deletion is in progress
        var userActiveStatus = user.IsActive;
        user.IsActive = false;
        await _db.SaveChangesAsync();

        // TODO: Consider grace period for data recovery

        var teamId = user.TeamId;
        var isBusiness = await _db.Teams.Where(t => t.Id == teamId).Select(t => t.IsBusiness).FirstOrDefaultAsync();
        var teamAdminCount = await _db.Users.Where(u => u.TeamId == user.TeamId && u.IsAdmin).CountAsync();
        var deleteTeam = teamAdminCount == 1 && user.IsAdmin;

        var deletedUserInfo = new List<DeletedUserInfo>();
        if (deleteTeam)
        {
            // Check for active subscription
            var team = await _db.Teams.FindAsync(user.TeamId);
            var hasActiveSubscription = team?.SubscriptionTier == SubscriptionTier.Pro 
                && team.SubscriptionExpiresAt.HasValue 
                && team.SubscriptionExpiresAt.Value > DateTimeOffset.UtcNow;

            if (hasActiveSubscription)
            {
                // restore user active status if can't delete
                user.IsActive = userActiveStatus;
                await _db.SaveChangesAsync();

                // Get most recent purchase to determine platform
                var latestPurchase = await _db.PurchaseHistories
                    .Where(p => p.TeamId == user.TeamId && p.IsActive)
                    .OrderByDescending(p => p.PurchaseDate)
                    .FirstOrDefaultAsync();


                // Return error with specific guidance
                throw new InvalidOperationException(
                    $"Cannot delete account while team has an active subscription. " +
                    $"Please cancel your subscription first in {(latestPurchase?.Platform == "ios" ? "App Store" : "Google Play Store")} settings. " +
                    $"Your subscription expires on {team!.SubscriptionExpiresAt:MMM dd, yyyy}.");
            }

            var teamUserIds = await _db.Users.Where(u => u.TeamId == teamId && u.Id != userId).Select(x => x.Id).ToListAsync();
            foreach (var teamUserId in teamUserIds)
            {
                var teamUser = await _db.Users.FindAsync(teamUserId);
                if (teamUser != null)
                {
                    deletedUserInfo.Add(new DeletedUserInfo
                    {
                        UserId = teamUser.Id,
                        UserName = teamUser.UserName!,
                        DisplayName = teamUser.FirstName!,
                        Email = teamUser.Email!,
                        TeamId = teamUser.TeamId,
                        IsBusiness = isBusiness,
                        IsAdmin = teamUser.IsAdmin
                    });
                }
                await DeleteUserData(teamUserId, deleteTeam);
            }
        }

        await DeleteUserData(userId, deleteTeam);
        deletedUserInfo.Add(new DeletedUserInfo
        {
            UserId = user.Id,
            UserName = user.UserName!,
            DisplayName = user.FirstName!,
            Email = user.Email!,
            TeamId = user.TeamId,
            IsBusiness = isBusiness,
            IsAdmin = user.IsAdmin
        });

        if (deleteTeam)
        {
            await _db.Teams.Where(x => x.Id == teamId).ExecuteUpdateAsync(t => t.SetProperty(x => x.Name, Defaults.DeletedTeamName).SetProperty(x => x.Description, Defaults.DeletedTeamDescription));
        }

        await _db.SaveChangesAsync();

        return (isTeamDeleted: deleteTeam, deletedUsers: deletedUserInfo);
    }

    private async Task DeleteUserData(long userId, bool deletingTeam)
    {
        await _db.DeviceRegistrations.Where(d => d.UserId == userId).ExecuteDeleteAsync();
        await _db.UserNotificationPreferences.Where(p => p.UserId == userId).ExecuteDeleteAsync();
        await _db.UserNotifications.Where(n => n.UserId == userId).ExecuteDeleteAsync();
        await _db.UserTaskItemPins.Where(p => p.UserId == userId).ExecuteDeleteAsync();

        if (deletingTeam)
        {
            await _db.TaskComments.Where(c => c.CreatedBy == userId).ExecuteDeleteAsync();
        }
        else
        {
            await _db.TaskComments
                .Where(c => c.CreatedBy == userId)
                .ExecuteUpdateAsync(c => c.SetProperty(tc => tc.CreatedBy, Defaults.DeletedUserId));
        }

        if (deletingTeam)
        {
            var userTaskGroupIds = await _db.TaskGroups
                .Where(g => g.CreatedBy == userId)
                .Select(g => g.Id)
                .ToListAsync();

            var userTaskKindIds = await _db.TaskKinds
                .Where(k => k.CreatedBy == userId)
                .Select(k => k.Id)
                .ToListAsync();

            var userTaskCategoryIds = await _db.TaskCategories
                .Where(c => c.CreatedBy == userId)
                .Select(c => c.Id)
                .ToListAsync();


            await _db.TaskItems.Where(t => t.CategoryId != null && userTaskCategoryIds.Contains(t.CategoryId.Value)).ExecuteUpdateAsync(t => t.SetProperty(ti => ti.CategoryId, (long?)null));
            await _db.TaskItems.Where(t => t.KindId != null && userTaskKindIds.Contains(t.KindId.Value)).ExecuteUpdateAsync(t => t.SetProperty(ti => ti.KindId, (long?)null));
            await _db.TaskItems.Where(t => t.GroupId != null && userTaskGroupIds.Contains(t.GroupId.Value)).ExecuteUpdateAsync(t => t.SetProperty(ti => ti.GroupId, (long?)null));

            await _db.TaskCategories.Where(c => c.CreatedBy == userId).ExecuteDeleteAsync();
            await _db.TaskKinds.Where(k => k.CreatedBy == userId).ExecuteDeleteAsync();
            await _db.TaskGroups.Where(g => g.CreatedBy == userId).ExecuteDeleteAsync();

            await _db.TaskCategories.Where(c => c.UpdatedBy == userId).ExecuteUpdateAsync(t => t.SetProperty(x => x.UpdatedBy, Defaults.DeletedUserId));
            await _db.TaskKinds.Where(c => c.UpdatedBy == userId).ExecuteUpdateAsync(t => t.SetProperty(x => x.UpdatedBy, Defaults.DeletedUserId));
            await _db.TaskGroups.Where(c => c.UpdatedBy == userId).ExecuteUpdateAsync(t => t.SetProperty(x => x.UpdatedBy, Defaults.DeletedUserId));
        }
        else
        {
            var privateTaskGroupIds = _db.TaskGroups.Where(c => c.CreatedBy == userId && c.TeamId == null).Select(c => c.Id).ToList();
            var privateTaskKindIds = _db.TaskKinds.Where(k => privateTaskGroupIds.Contains(k.GroupId)).Select(k => k.Id).ToList();

            await _db.TaskCategories.Where(c => c.CreatedBy == userId && privateTaskKindIds.Contains(c.KindId)).ExecuteDeleteAsync();
            await _db.TaskKinds.Where(k => k.CreatedBy == userId && privateTaskKindIds.Contains(k.Id)).ExecuteDeleteAsync();
            await _db.TaskGroups.Where(g => g.CreatedBy == userId && privateTaskGroupIds.Contains(g.Id)).ExecuteDeleteAsync();

            await _db.TaskCategories.Where(c => c.CreatedBy == userId).ExecuteUpdateAsync(t => t.SetProperty(x => x.CreatedBy, Defaults.DeletedUserId));
            await _db.TaskKinds.Where(c => c.CreatedBy == userId).ExecuteUpdateAsync(t => t.SetProperty(x => x.CreatedBy, Defaults.DeletedUserId));
            await _db.TaskGroups.Where(c => c.CreatedBy == userId).ExecuteUpdateAsync(t => t.SetProperty(x => x.CreatedBy, Defaults.DeletedUserId));

            await _db.TaskCategories.Where(c => c.UpdatedBy == userId).ExecuteUpdateAsync(t => t.SetProperty(x => x.UpdatedBy, Defaults.DeletedUserId));
            await _db.TaskKinds.Where(c => c.UpdatedBy == userId).ExecuteUpdateAsync(t => t.SetProperty(x => x.UpdatedBy, Defaults.DeletedUserId));
            await _db.TaskGroups.Where(c => c.UpdatedBy == userId).ExecuteUpdateAsync(t => t.SetProperty(x => x.UpdatedBy, Defaults.DeletedUserId));
        }

        var userAllowanceHistoryIds = await _db.AllowanceHistories
            .Where(h => h.UserId == userId)
            .Select(h => h.Id)
            .ToListAsync();

        if (deletingTeam)
        {
            await _db.UserNotifications.Where(n => n.AllowanceHistoryId != null && userAllowanceHistoryIds.Contains(n.AllowanceHistoryId.Value)).ExecuteDeleteAsync();
            // await _db.AllowanceHistoryTaskItems.Where(t => userAllowanceHistoryIds.Contains(t.AllowanceHistoryId)).ExecuteDeleteAsync();
            await _db.AllowanceHistories.Where(h => h.UserId == userId).ExecuteDeleteAsync();

            await _db.AllowanceIntervalGradeConfigs.Where(c => c.CreatedBy == userId).ExecuteDeleteAsync();
            await _db.AllowanceIntervalGradeConfigs.Where(c => c.UpdatedBy == userId).ExecuteUpdateAsync(c => c.SetProperty(ci => ci.UpdatedBy, Defaults.DeletedUserId));
        }
        else
        {
            // Unique constrain is preventing updating UserId to Defaults.DeletedUserId when there is already a deleted user
            //  for the same interval, as when a 2nd user gets deleted
            // await _db.AllowanceHistories.Where(h => h.UserId == userId).ExecuteUpdateAsync(h => h.SetProperty(hi => hi.UserId, Defaults.DeletedUserId));

            // await _db.AllowanceHistoryTaskItems.Where(t => userAllowanceHistoryIds.Contains(t.AllowanceHistoryId)).ExecuteDeleteAsync();
            await _db.AllowanceHistories.Where(h => h.UserId == userId).ExecuteDeleteAsync();

            await _db.AllowanceIntervalGradeConfigs.Where(c => c.CreatedBy == userId).ExecuteUpdateAsync(c => c.SetProperty(ci => ci.CreatedBy, Defaults.DeletedUserId));
            await _db.AllowanceIntervalGradeConfigs.Where(c => c.UpdatedBy == userId).ExecuteUpdateAsync(c => c.SetProperty(ci => ci.UpdatedBy, Defaults.DeletedUserId));
        }

        if (deletingTeam)
        {
            var userAllowanceIntervalIds = await _db.TeamAllowanceIntervals
                .Where(i => i.CreatedBy == userId)
                .Select(i => i.Id)
                .ToListAsync();

            await _db.TaskItems.Where(t => t.TeamAllowanceIntervalId != null && userAllowanceIntervalIds.Contains(t.TeamAllowanceIntervalId.Value)).ExecuteUpdateAsync(t => t.SetProperty(ti => ti.TeamAllowanceIntervalId, (long?)null));
            await _db.AllowanceHistories.Where(h => userAllowanceIntervalIds.Contains(h.TeamAllowanceIntervalId)).ExecuteDeleteAsync();

            await _db.AllowanceHistories.Where(h => h.CreatedBy == userId).ExecuteUpdateAsync(h => h.SetProperty(hi => hi.CreatedBy, Defaults.DeletedUserId));
            await _db.AllowanceHistories.Where(h => h.UpdatedBy == userId).ExecuteUpdateAsync(h => h.SetProperty(hi => hi.UpdatedBy, Defaults.DeletedUserId));

            await _db.TeamAllowanceIntervals.Where(i => i.CreatedBy == userId).ExecuteDeleteAsync();
            await _db.TeamAllowanceIntervals.Where(i => i.UpdatedBy == userId).ExecuteUpdateAsync(x => x.SetProperty(p => p.UpdatedBy, Defaults.DeletedUserId));
        }
        else
        {
            await _db.AllowanceHistories.Where(h => h.CreatedBy == userId).ExecuteUpdateAsync(h => h.SetProperty(hi => hi.CreatedBy, Defaults.DeletedUserId));
            await _db.AllowanceHistories.Where(h => h.UpdatedBy == userId).ExecuteUpdateAsync(h => h.SetProperty(hi => hi.UpdatedBy, Defaults.DeletedUserId));

            await _db.TeamAllowanceIntervals.Where(i => i.CreatedBy == userId).ExecuteUpdateAsync(x => x.SetProperty(p => p.CreatedBy, Defaults.DeletedUserId));
            await _db.TeamAllowanceIntervals.Where(i => i.UpdatedBy == userId).ExecuteUpdateAsync(x => x.SetProperty(p => p.UpdatedBy, Defaults.DeletedUserId));
        }

        await _db.TaskItems.Where(t => t.AssignedTo == userId).ExecuteUpdateAsync(t => t.SetProperty(ti => ti.AssignedTo, Defaults.DeletedUserId));
        await _db.TaskItems.Where(t => t.BonusStatusBy == userId).ExecuteUpdateAsync(t => t.SetProperty(ti => ti.BonusStatusBy, Defaults.DeletedUserId));
        await _db.TaskItems.Where(t => t.CompletedBy == userId).ExecuteUpdateAsync(t => t.SetProperty(ti => ti.CompletedBy, Defaults.DeletedUserId));
        await _db.TaskItems.Where(t => t.ActiveBy == userId).ExecuteUpdateAsync(t => t.SetProperty(ti => ti.ActiveBy, Defaults.DeletedUserId));
        await _db.TaskItems.Where(t => t.ArchivedBy == userId).ExecuteUpdateAsync(t => t.SetProperty(ti => ti.ArchivedBy, Defaults.DeletedUserId));
        await _db.TaskItems.Where(t => t.AssignedBy == userId).ExecuteUpdateAsync(t => t.SetProperty(ti => ti.AssignedBy, Defaults.DeletedUserId));
        await _db.TaskItems.Where(t => t.GradedBy == userId).ExecuteUpdateAsync(t => t.SetProperty(ti => ti.GradedBy, Defaults.DeletedUserId));
        await _db.TaskItems.Where(t => t.UpdatedBy == userId).ExecuteUpdateAsync(t => t.SetProperty(ti => ti.UpdatedBy, Defaults.DeletedUserId));

        var userTaskItemIds = await _db.TaskItems.Where(x => x.CreatedBy == userId).Select(x => x.Id).ToListAsync();
        if (deletingTeam)
        {
            await _db.UserNotifications.Where(x => x.TaskItemId != null && userTaskItemIds.Contains(x.TaskItemId.Value)).ExecuteDeleteAsync();
            await _db.TaskItems.Where(t => t.CreatedBy == userId).ExecuteDeleteAsync();
        }
        else
        {
            await _db.UserTaskItemPins.Where(x => userTaskItemIds.Contains(x.TaskItemId)).ExecuteDeleteAsync();
            await _db.TaskItems.Where(t => t.CreatedBy == userId && t.IsPrivate).ExecuteDeleteAsync();
            await _db.TaskItems.Where(t => t.CreatedBy == userId).ExecuteUpdateAsync(t => t.SetProperty(ti => ti.CreatedBy, Defaults.DeletedUserId));
        }

        await _db.Users.Where(u => u.Id == userId).ExecuteDeleteAsync();
    }

    public Task<User> UpdateAsync(User user)
    {
        _db.Users.Update(user);
        return Task.FromResult(user);
    }

    public Task<User?> GetByEmailAsync(string email)
    {
        var emailLower = email?.ToLower()?.Trim() ?? string.Empty;
        return _db.Users.FirstOrDefaultAsync(u => u.Email != null && u.Email.ToLower() == emailLower);
    }

    public async Task AddNotificationPreferencesAsync(List<UserNotificationPreference> preferences)
    {
        await _db.UserNotificationPreferences.AddRangeAsync(preferences);
        await _db.SaveChangesAsync();
    }

    public async Task<List<UserNotificationPreference>> GetNotificationPreferencesAsync(long userId)
    {
        return await _db.UserNotificationPreferences
            .Where(p => p.UserId == userId)
            .OrderBy(p => p.Channel)
            .ThenBy(p => p.NotificationType)
            .ToListAsync();
    }

    public async Task<List<UserNotificationPreference>> GetNotificationPreferencesAsync(long userId, NotificationType notificationType)
    {
        return await _db.UserNotificationPreferences
            .Where(p => p.UserId == userId && p.NotificationType == notificationType)
            .OrderBy(p => p.Channel)
            .ToListAsync();
    }

    public async Task<UserNotificationPreference?> GetNotificationPreferenceAsync(long preferenceId)
    {
        return await _db.UserNotificationPreferences
            .FirstOrDefaultAsync(p => p.Id == preferenceId);
    }

    public async Task UpdateNotificationPreferenceAsync(UserNotificationPreference preference)
    {
        preference.UpdatedAt = DateTimeOffset.UtcNow;
        _db.UserNotificationPreferences.Update(preference);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateNotificationPreferencesAsync(List<UserNotificationPreference> preferences)
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var preference in preferences)
        {
            preference.UpdatedAt = now;
        }

        _db.UserNotificationPreferences.UpdateRange(preferences);
        await _db.SaveChangesAsync();
    }

    public async Task<List<long>> GetAdminUsersToNotify(long teamId, NotificationType notificationType)
    {
        var admins = await _db.Users
            .Where(u => u.TeamId == teamId && u.IsAdmin && u.IsActive)
            .Where(u => !_db.UserNotificationPreferences.Any(p => 
                p.UserId == u.Id && 
                p.NotificationType == notificationType && 
                !p.IsEnabled))
            .Select(u => u.Id)
            .Distinct()
            .ToListAsync();

        return admins;
    }

    public async Task<List<long>> GetOptInUsersToNotify(long teamId, NotificationType notificationType)
    {
        var optInUsers = await _db.Users
            .Where(u => u.TeamId == teamId && u.IsActive)
            .Where(u => !_db.UserNotificationPreferences.Any(p => p.UserId == u.Id)
                || _db.UserNotificationPreferences.Any(p => p.UserId == u.Id && p.NotificationType == NotificationType.OptInToTeamEventNotifications && p.IsEnabled))
            .Select(u => u.Id)
            .Distinct()
            .ToListAsync();

        List<long> usersToNotify = new List<long>();
        foreach (var userId in optInUsers)
        {
            bool hasNotificationPreferences = await _db.UserNotificationPreferences.AnyAsync(p => p.UserId == userId);
            if (hasNotificationPreferences)
            {
                bool optedInForThisNotificationType = await _db.UserNotificationPreferences.AnyAsync(x => x.UserId == userId && x.NotificationType == notificationType && x.IsEnabled);
                if (optedInForThisNotificationType)
                    usersToNotify.Add(userId);
            }
            else
            {
                usersToNotify.Add(userId);
            }
        }

        return usersToNotify;
    }

    public IQueryable<User> GetGrandfatheredBaseCountQuery(DateTimeOffset iosMonetizationStartDate, DateTimeOffset androidMonetizationStartDate)
    {
        return _db.Users
            .Where(u => u.IsActive && u.IsAdmin)
            .Where(u => _db.DeviceRegistrations.Any(ud => ud.UserId == u.Id && _db.Teams.Any(t => t.Id == u.TeamId && t.SubscriptionTier == SubscriptionTier.Free 
                && ((ud.Platform == Constants.IOS_PLATFORM && t.CreatedAt < iosMonetizationStartDate) || (ud.Platform == Constants.ANDROID_PLATFORM && t.CreatedAt < androidMonetizationStartDate)))))
            .Distinct();
    }

    public async Task<int> GetGrandfatheredUsersForTrialWelcomeNotificationsCountAsync(DateTimeOffset iosMonetizationStartDate, DateTimeOffset androidMonetizationStartDate)
    {
        return await GetGrandfatheredBaseCountQuery(iosMonetizationStartDate, androidMonetizationStartDate)
            .Where(x => x.TrialWelcomeSentAt == null)
            .CountAsync();
    }

    public async Task<List<UserForTrialNotifications>> GetGrandfatheredUsersForTrialWelcomeNotificationsBatchAsync(DateTimeOffset iosMonetizationStartDate, DateTimeOffset androidMonetizationStartDate, int skip, int batchSize)
    {
        return await _db.Users
            .Join(_db.Teams,
                u => u.TeamId,
                t => t.Id,
                (u, t) => new { User = u, Team = t })
            .Where(ut => ut.User.IsActive && ut.User.IsAdmin && ut.Team.SubscriptionTier == SubscriptionTier.Free
                && ut.User.TrialWelcomeSentAt == null)
            .Where(ut => _db.DeviceRegistrations.Any(ud => ud.UserId == ut.User.Id
                && ((ud.Platform == Constants.IOS_PLATFORM && ut.Team.CreatedAt < iosMonetizationStartDate) || (ud.Platform == Constants.ANDROID_PLATFORM && ut.Team.CreatedAt < androidMonetizationStartDate))))
            .Distinct()
            .OrderBy(ut => ut.User.Id)
            .Skip(skip)
            .Take(batchSize)
            .Select(ut => new UserForTrialNotifications
            {
                Id = ut.User.Id,
                IsBusiness = ut.Team.IsBusiness,
                Email = ut.User.Email!,
                FirstName = ut.User.FirstName,
                LastName = ut.User.LastName,
                TrialEndsAt = ut.Team.TrialEndsAt
            })
            .Distinct()
            .ToListAsync();
    }

    public async Task<int> GetGrandfatheredUsersForTrial3DayWarningNotificationsCountAsync(DateTimeOffset iosMonetizationStartDate, DateTimeOffset androidMonetizationStartDate, int gracePeriodDays)
    {
        return await GetGrandfatheredBaseCountQuery(iosMonetizationStartDate, androidMonetizationStartDate)
            .Where(x => x.TrialWelcomeSentAt != null && x.Trial3DayWarningSentAt == null && x.TrialWelcomeSentAt.Value.AddDays(gracePeriodDays-3).Date <= DateTimeOffset.UtcNow.Date)
            .CountAsync();
    }

    public async Task<List<UserForTrialNotifications>> GetGrandfatheredUsersForTrial3DayWarningNotificationsBatchAsync(DateTimeOffset iosMonetizationStartDate, DateTimeOffset androidMonetizationStartDate, int gracePeriodDays, int skip, int batchSize)
    {
        return await _db.Users
            .Join(_db.Teams,
                u => u.TeamId,
                t => t.Id,
                (u, t) => new { User = u, Team = t })
            .Where(ut => ut.User.IsActive && ut.User.IsAdmin && ut.Team.SubscriptionTier == SubscriptionTier.Free 
                && ut.User.TrialWelcomeSentAt != null && ut.User.Trial3DayWarningSentAt == null && ut.User.TrialWelcomeSentAt.Value.AddDays(gracePeriodDays-3).Date <= DateTimeOffset.UtcNow.Date)
            .Where(ut => _db.DeviceRegistrations.Any(ud => ud.UserId == ut.User.Id 
                    && ((ud.Platform == Constants.IOS_PLATFORM && ut.Team.CreatedAt < iosMonetizationStartDate) || (ud.Platform == Constants.ANDROID_PLATFORM && ut.Team.CreatedAt < androidMonetizationStartDate))))
            .Distinct()
            .OrderBy(ut => ut.User.Id)
            .Skip(skip)
            .Take(batchSize)
            .Select(ut => new UserForTrialNotifications
            {
                Id = ut.User.Id,
                IsBusiness = ut.Team.IsBusiness,
                Email = ut.User.Email!,
                FirstName = ut.User.FirstName,
                LastName = ut.User.LastName,
                TrialEndsAt = ut.Team.TrialEndsAt
            })
            .Distinct()
            .ToListAsync();
    }

    public async Task<int> GetGrandfatheredUsersForTrial1DayWarningNotificationsCountAsync(DateTimeOffset iosMonetizationStartDate, DateTimeOffset androidMonetizationStartDate, int gracePeriodDays)
    {
        return await GetGrandfatheredBaseCountQuery(iosMonetizationStartDate, androidMonetizationStartDate)
            .Where(x => x.TrialWelcomeSentAt != null && x.Trial1DayWarningSentAt == null && x.TrialWelcomeSentAt.Value.AddDays(gracePeriodDays-1).Date <= DateTimeOffset.UtcNow.Date)
            .CountAsync();
    }

    public async Task<List<UserForTrialNotifications>> GetGrandfatheredUsersForTrial1DayWarningNotificationsBatchAsync(DateTimeOffset iosMonetizationStartDate, DateTimeOffset androidMonetizationStartDate, int gracePeriodDays, int skip, int batchSize)
    {
        return await _db.Users
            .Join(_db.Teams,
                u => u.TeamId,
                t => t.Id,
                (u, t) => new { User = u, Team = t })
            .Where(ut => ut.User.IsActive && ut.User.IsAdmin && ut.Team.SubscriptionTier == SubscriptionTier.Free
                && ut.User.TrialWelcomeSentAt != null && ut.User.Trial1DayWarningSentAt == null && ut.User.TrialWelcomeSentAt.Value.AddDays(gracePeriodDays-1).Date <= DateTimeOffset.UtcNow.Date)
            .Where(ut => _db.DeviceRegistrations.Any(ud => ud.UserId == ut.User.Id 
                    && ((ud.Platform == Constants.IOS_PLATFORM && ut.Team.CreatedAt < iosMonetizationStartDate) || (ud.Platform == Constants.ANDROID_PLATFORM && ut.Team.CreatedAt < androidMonetizationStartDate))))
            .OrderBy(ut => ut.User.Id)
            .Distinct()
            .Skip(skip)
            .Take(batchSize)
            .Select(ut => new UserForTrialNotifications
            {
                Id = ut.User.Id,
                IsBusiness = ut.Team.IsBusiness,
                Email = ut.User.Email!,
                FirstName = ut.User.FirstName,
                LastName = ut.User.LastName,
                TrialEndsAt = ut.Team.TrialEndsAt
            })
            .Distinct()
            .ToListAsync();
    }

    public async Task<int> GetGrandfatheredUsersForTrialEndedWarningNotificationsCountAsync(DateTimeOffset iosMonetizationStartDate, DateTimeOffset androidMonetizationStartDate, int gracePeriodDays)
    {
        return await GetGrandfatheredBaseCountQuery(iosMonetizationStartDate, androidMonetizationStartDate)
            .Where(x => x.TrialWelcomeSentAt != null && x.TrialExpiredWarningSentAt == null && x.TrialWelcomeSentAt.Value.AddDays(gracePeriodDays).Date <= DateTimeOffset.UtcNow.Date)
            .CountAsync();
    }

    public async Task<List<UserForTrialNotifications>> GetGrandfatheredUsersForTrialEndedWarningNotificationsBatchAsync(DateTimeOffset iosMonetizationStartDate, DateTimeOffset androidMonetizationStartDate, int gracePeriodDays, int skip, int batchSize)
    {
        return await _db.Users
            .Join(_db.Teams,
                u => u.TeamId,
                t => t.Id,
                (u, t) => new { User = u, Team = t })
            .Where(ut => ut.User.IsActive && ut.User.IsAdmin && ut.Team.SubscriptionTier == SubscriptionTier.Free
                && ut.User.TrialWelcomeSentAt != null && ut.User.TrialExpiredWarningSentAt == null && ut.User.TrialWelcomeSentAt.Value.AddDays(gracePeriodDays).Date <= DateTimeOffset.UtcNow.Date)
            .Where(ut => _db.DeviceRegistrations.Any(ud => ud.UserId == ut.User.Id 
                    && ((ud.Platform == Constants.IOS_PLATFORM && ut.Team.CreatedAt < iosMonetizationStartDate) || (ud.Platform == Constants.ANDROID_PLATFORM && ut.Team.CreatedAt < androidMonetizationStartDate))))
            .OrderBy(ut => ut.User.Id)
            .Distinct()
            .Skip(skip)
            .Take(batchSize)
            .Select(ut => new UserForTrialNotifications
            {
                Id = ut.User.Id,
                IsBusiness = ut.Team.IsBusiness,
                Email = ut.User.Email!,
                FirstName = ut.User.FirstName,
                LastName = ut.User.LastName,
                TrialEndsAt = ut.Team.TrialEndsAt
            })
            .Distinct()
            .ToListAsync();
    }

    public IQueryable<User> GetTrialUsersBaseCountQuery(DateTimeOffset trialEndDate)
    {
        return _db.Users
            .Where(u => u.IsActive && u.IsAdmin)
            .Where(u => _db.Teams.Any(t => t.Id == u.TeamId && t.SubscriptionTier == SubscriptionTier.Free 
                && t.TrialEndsAt.HasValue && t.TrialEndsAt.Value.Date == trialEndDate.Date))
            .Distinct();
    }

    public async Task<int> GetUsersForTrial3DayWarningNotificationsCountAsync()
    {
        return await GetTrialUsersBaseCountQuery(DateTimeOffset.UtcNow.AddDays(-3))
            .Where(x => x.Trial3DayWarningSentAt == null)
            .CountAsync();
    }

    public async Task<List<UserForTrialNotifications>> GetUsersForTrial3DayWarningNotificationsBatchAsync(int skip, int batchSize)
    {
        return await _db.Users
            .Where(u => u.IsActive && u.IsAdmin)
            .Join(_db.Teams,
                u => u.TeamId,
                t => t.Id,
                (u, t) => new { User = u, Team = t })
            .Where(ut => ut.User.Trial3DayWarningSentAt == null && ut.Team.SubscriptionTier == SubscriptionTier.Free 
                && ut.Team.TrialEndsAt.HasValue 
                && ut.Team.TrialEndsAt.Value.Date == DateTimeOffset.UtcNow.AddDays(-3).Date)
            .OrderBy(ut => ut.User.Id)
            .Distinct()
            .Skip(skip)
            .Take(batchSize)
            .Select(ut => new UserForTrialNotifications
            {
                Id = ut.User.Id,
                IsBusiness = ut.Team.IsBusiness,
                Email = ut.User.Email!,
                FirstName = ut.User.FirstName,
                LastName = ut.User.LastName,
                TrialEndsAt = ut.Team.TrialEndsAt,
                TrialWelcomeShown = ut.User.TrialWelcomeSentAt.HasValue,
            })
            .Distinct()
            .ToListAsync();
    }

    public async Task<int> GetUsersForTrial1DayWarningNotificationsCountAsync()
    {
        return await GetTrialUsersBaseCountQuery(DateTimeOffset.UtcNow.AddDays(-1))
            .Where(x => x.Trial1DayWarningSentAt == null)
            .CountAsync();
    }

    public async Task<List<UserForTrialNotifications>> GetUsersForTrial1DayWarningNotificationsBatchAsync(int skip, int batchSize)
    {
        return await _db.Users
            .Where(u => u.IsActive && u.IsAdmin)
            .Join(_db.Teams,
                u => u.TeamId,
                t => t.Id,
                (u, t) => new { User = u, Team = t })
            .Where(ut => ut.User.Trial1DayWarningSentAt == null && ut.Team.SubscriptionTier == SubscriptionTier.Free 
                && ut.Team.TrialEndsAt.HasValue 
                && ut.Team.TrialEndsAt.Value.Date == DateTimeOffset.UtcNow.AddDays(-1).Date)
            .OrderBy(ut => ut.User.Id)
            .Distinct()
            .Skip(skip)
            .Take(batchSize)
            .Select(ut => new UserForTrialNotifications
            {
                Id = ut.User.Id,
                IsBusiness = ut.Team.IsBusiness,
                Email = ut.User.Email!,
                FirstName = ut.User.FirstName,
                LastName = ut.User.LastName,
                TrialEndsAt = ut.Team.TrialEndsAt,
                TrialWelcomeShown = ut.User.TrialWelcomeSentAt.HasValue,
            })
            .Distinct()
            .ToListAsync();
    }

    public async Task<int> GetUsersForTrialEndedWarningNotificationsCountAsync()
    {
        return await _db.Users
            .Where(u => u.IsActive && u.IsAdmin && u.TrialExpiredWarningSentAt == null)
            .Where(u => _db.Teams.Any(t => t.Id == u.TeamId && t.SubscriptionTier == SubscriptionTier.Free 
                && t.TrialEndsAt.HasValue && t.TrialEndsAt.Value.Date < DateTimeOffset.UtcNow.Date))
            .Distinct()
            .CountAsync();
    }

    public async Task<List<UserForTrialNotifications>> GetUsersForTrialEndedWarningNotificationsBatchAsync(int skip, int batchSize)
    {
        return await _db.Users
            .Where(u => u.IsActive && u.IsAdmin)
            .Join(_db.Teams,
                u => u.TeamId,
                t => t.Id,
                (u, t) => new { User = u, Team = t })
            .Where(ut => ut.User.TrialExpiredWarningSentAt == null && ut.Team.SubscriptionTier == SubscriptionTier.Free 
                && ut.Team.TrialEndsAt.HasValue 
                && ut.Team.TrialEndsAt.Value.Date < DateTimeOffset.UtcNow.Date)
            .OrderBy(ut => ut.User.Id)
            .Distinct()
            .Skip(skip)
            .Take(batchSize)
            .Select(ut => new UserForTrialNotifications
            {
                Id = ut.User.Id,
                IsBusiness = ut.Team.IsBusiness,
                Email = ut.User.Email!,
                FirstName = ut.User.FirstName,
                LastName = ut.User.LastName,
                TrialEndsAt = ut.Team.TrialEndsAt,
                TrialWelcomeShown = ut.User.TrialWelcomeSentAt.HasValue,
            })
            .Distinct()
            .ToListAsync();
    }

    public async Task MarkTrialWelcomeSentAsync(long id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
        {
            _logger.LogWarning("MarkTrialWelcomeSentAsync: User with ID {UserId} not found.", id);
            return;
        }

        user.TrialWelcomeSentAt = DateTimeOffset.UtcNow;
        _db.Users.Update(user);
        await _db.SaveChangesAsync();
    }

    public async Task Mark3DayWarningSentAsync(long id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
        {
            _logger.LogWarning("Mark3DayWarningSentAsync: User with ID {UserId} not found.", id);
            return;
        }

        user.Trial3DayWarningSentAt = DateTimeOffset.UtcNow;
        _db.Users.Update(user);
        await _db.SaveChangesAsync();
    }

    public async Task Mark1DayWarningSentAsync(long userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("Mark1DayWarningSentAsync: User with ID {UserId} not found.", userId);
            return;
        }

        user.Trial1DayWarningSentAt = DateTimeOffset.UtcNow;
        _db.Users.Update(user);
        await _db.SaveChangesAsync();
    }

    public async Task MarkTrialEndedWarningSentAsync(long userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("MarkTrialEndedWarningSentAsync: User with ID {UserId} not found.", userId);
            return;
        }

        user.TrialExpiredWarningSentAt = DateTimeOffset.UtcNow;
        _db.Users.Update(user);
        await _db.SaveChangesAsync();
    }

    public async Task<int> AdminCount(long teamId)
    {
        return await _db.Users
            .Where(u => u.TeamId == teamId && u.IsAdmin)
            .CountAsync();
    }
}