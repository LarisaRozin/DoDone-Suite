/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Server.Dtos;

namespace DoDone.Server.Extensions;

public static class TaskItemExtensions
{

    public static TaskItemResponse ToDto(this TaskItem item, long userId)
    {
        if (item == null)
            throw new ArgumentNullException(nameof(item), "TaskItem cannot be null");

        return new TaskItemResponse
        {
            Id = item.Id,
            TeamId = item.TeamId,
            GroupId = item.GroupId,
            KindId = item.KindId,
            CategoryId = item.CategoryId,
            IsActive = item.IsActive,
            IsComplete = item.PercentComplete == 100,
            IsPinned = item.UserPins.Any(p => p.UserId == userId && p.TaskItemId == item.Id),
            IsArchived = item.IsArchived,
            IsPrivate = item.IsPrivate,
            Priority = item.Priority,
            CompletedAt = item.CompletedAt,
            CompletedBy = item.CompletedBy,
            Name = item.Name,
            Description = item.Description,
            Credits = item.Credits,
            GradeId = item.GradeId,
            MaxBonus = item.MaxBonus,
            ApprovedBonus = item.ApprovedBonus,
            IsBonusRejected = item.IsBonusRejected,
            BonusStatusBy = item.BonusStatusBy,
            BonusStatusAt = item.BonusStatusAt,
            BonusStatusComment = item.BonusStatusComment,
            BonusClaimedAt = item.BonusClaimedAt,
            IsApprovedForAllowance = item.IsApprovedForAllowance,
            AllowanceApprovalStatusAt = item.AllowanceApprovalStatusAt,
            AllowanceApprovalStatusBy = item.AllowanceApprovalStatusBy,
            AllowanceApprovalStatusComment = item.AllowanceApprovalStatusComment,
            PercentComplete = item.PercentComplete,
            Details = item.Details,
            DueAt = item.DueAt,
            StartAt = item.StartAt,
            EndAt = item.EndAt,
            AssignedTo = item.AssignedTo,
            AssignedBy = item.AssignedBy,
            AssignedAt = item.AssignedAt,
            CreatedBy = item.CreatedBy,
            CreatedAt = item.CreatedAt,
            UpdatedBy = item.UpdatedBy,
            UpdatedAt = item.UpdatedAt,
            ActiveBy = item.ActiveBy,
            ActiveAt = item.ActiveAt,
            ArchivedAt = item.ArchivedAt,
            ArchivedBy = item.ArchivedBy,
            GradedAt = item.GradedAt,
            GradedBy = item.GradedBy,
            TeamAllowanceIntervalId = item.TeamAllowanceIntervalId,
        };
    }
    public static TaskItemDetailsResponse ToDetailsDto(this TaskItem item, long userId)
    {
        if (item == null)
            throw new ArgumentNullException(nameof(item), "TaskItem cannot be null");

        return new TaskItemDetailsResponse
        {
            Id = item.Id,
            TeamId = item.TeamId,
            GroupId = item.GroupId,
            KindId = item.KindId,
            CategoryId = item.CategoryId,
            IsActive = item.IsActive,
            IsComplete = item.PercentComplete == 100,
            IsPinned = item.UserPins.Any(p => p.UserId == userId && p.TaskItemId == item.Id),
            IsArchived = item.IsArchived,
            IsPrivate = item.IsPrivate,
            Priority = item.Priority,
            CompletedAt = item.CompletedAt,
            CompletedBy = item.CompletedBy,
            Name = item.Name,
            Description = item.Description,
            Credits = item.Credits,
            GradeId = item.GradeId,
            MaxBonus = item.MaxBonus,
            ApprovedBonus = item.ApprovedBonus,
            IsBonusRejected = item.IsBonusRejected,
            BonusStatusBy = item.BonusStatusBy,
            BonusStatusAt = item.BonusStatusAt,
            BonusStatusComment = item.BonusStatusComment,
            BonusClaimedAt = item.BonusClaimedAt,
            TeamAllowanceIntervalId = item.TeamAllowanceIntervalId,
            IsApprovedForAllowance = item.IsApprovedForAllowance,
            AllowanceApprovalStatusAt = item.AllowanceApprovalStatusAt,
            AllowanceApprovalStatusBy = item.AllowanceApprovalStatusBy,
            AllowanceApprovalStatusComment = item.AllowanceApprovalStatusComment,
            PercentComplete = item.PercentComplete,
            Details = item.Details,
            DueAt = item.DueAt,
            StartAt = item.StartAt,
            EndAt = item.EndAt,
            AssignedTo = item.AssignedTo,
            AssignedBy = item.AssignedBy,
            AssignedAt = item.AssignedAt,
            CreatedBy = item.CreatedBy,
            CreatedAt = item.CreatedAt,
            UpdatedBy = item.UpdatedBy,
            UpdatedAt = item.UpdatedAt,
            ActiveBy = item.ActiveBy,
            ActiveAt = item.ActiveAt,
            ArchivedAt = item.ArchivedAt,
            ArchivedBy = item.ArchivedBy,
            GradedAt = item.GradedAt,
            GradedBy = item.GradedBy,
            TeamAllowanceIntervalName = item.TeamAllowanceInterval?.Name ?? string.Empty,
            Group = item.Group?.ToDto(),
            Kind = item.Kind?.ToDto(),
            Category = item.Category?.ToDto(),
            Grade = item.Grade?.ToDto(),
            // AssignedToUser = item.AssignedToUser?.ToDto(),
            // AssignedByUser = item.AssignedByUser?.ToDto(),
            // CreatedByUser = item.CreatedByUser.ToDto(),
            // UpdatedByUser = item.UpdatedByUser?.ToDto(),
            // ArchivedByUser = item.ArchivedByUser?.ToDto(),
            // ActiveByUser = item.ActiveByUser?.ToDto(),
            // GradedByUser = item.GradedByUser?.ToDto(),
            // BonusStatusByUser = item.BonusStatusByUser?.ToDto(),
            // CompletedByUser = item.CompletedByUser?.ToDto(),
        };
    }

    public static List<TaskItemResponse> ToDtoList(this IEnumerable<TaskItem> items, long userId)
    {
        return items.Select(i => i.ToDto(userId)).ToList();
    }

    public static List<TaskItemDetailsResponse> ToDetailsDtoList(this IEnumerable<TaskItem> items, long userId)
    {
        return items.Select(i => i.ToDetailsDto(userId)).ToList();
    }

    public static TaskItem Clone(this TaskItem item)
    {
        if (item == null)
            throw new ArgumentNullException(nameof(item), "TaskItem cannot be null");

        return new TaskItem
        {
            Id = item.Id,
            TeamId = item.TeamId,
            GroupId = item.GroupId,
            KindId = item.KindId,
            CategoryId = item.CategoryId,
            Name = item.Name,
            Description = item.Description,
            Priority = item.Priority,
            IsActive = item.IsActive,
            IsPrivate = item.IsPrivate,
            IsArchived = item.IsArchived,
            PercentComplete = item.PercentComplete,
            Credits = item.Credits,
            GradeId = item.GradeId,
            MaxBonus = item.MaxBonus,
            IsBonusRejected = item.IsBonusRejected,
            BonusStatusBy = item.BonusStatusBy,
            BonusStatusAt = item.BonusStatusAt,
            BonusStatusComment = item.BonusStatusComment,
            BonusClaimedAt = item.BonusClaimedAt,
            IsApprovedForAllowance = item.IsApprovedForAllowance,
            AllowanceApprovalStatusAt = item.AllowanceApprovalStatusAt,
            AllowanceApprovalStatusBy = item.AllowanceApprovalStatusBy,
            AllowanceApprovalStatusComment = item.AllowanceApprovalStatusComment,
            Details = item.Details,
            DueAt = item.DueAt,
            StartAt = item.StartAt,
            EndAt = item.EndAt,
            ActiveAt = item.ActiveAt,
            ActiveBy = item.ActiveBy,
            CompletedAt = item.CompletedAt,
            CompletedBy = item.CompletedBy,
            ArchivedAt = item.ArchivedAt,
            ArchivedBy = item.ArchivedBy,
            AssignedTo = item.AssignedTo,
            AssignedBy = item.AssignedBy,
            AssignedAt = item.AssignedAt,
            GradedAt = item.GradedAt,
            GradedBy = item.GradedBy,
            CreatedBy = item.CreatedBy,
            CreatedAt = item.CreatedAt,
            UpdatedBy = item.UpdatedBy,
            UpdatedAt = item.UpdatedAt,
            RowVersion = item.RowVersion,
            TeamAllowanceIntervalId = item.TeamAllowanceIntervalId,
            CreatedByUser = item.CreatedByUser != null ? new User
            {
                Id = item.CreatedByUser.Id,
                UserName = item.CreatedByUser.UserName,
                FirstName = item.CreatedByUser.FirstName,
                LastName = item.CreatedByUser.LastName,
                MiddleName = item.CreatedByUser.MiddleName,
                TeamId = item.CreatedByUser.TeamId,
            } : null!,
            UpdatedByUser = item.UpdatedByUser != null ? new User
            {
                Id = item.UpdatedByUser.Id,
                UserName = item.UpdatedByUser.UserName,
                FirstName = item.UpdatedByUser.FirstName,
                LastName = item.UpdatedByUser.LastName,
                MiddleName = item.UpdatedByUser.MiddleName,
                TeamId = item.UpdatedByUser.TeamId,
            } : null!,
            GradedByUser = item.GradedByUser != null ? new User
            {
                Id = item.GradedByUser.Id,
                UserName = item.GradedByUser.UserName,
                FirstName = item.GradedByUser.FirstName,
                LastName = item.GradedByUser.LastName,
                MiddleName = item.GradedByUser.MiddleName,
                TeamId = item.GradedByUser.TeamId,
            } : null!,
            BonusStatusByUser = item.BonusStatusByUser != null ? new User
            {
                Id = item.BonusStatusByUser.Id,
                UserName = item.BonusStatusByUser.UserName,
                FirstName = item.BonusStatusByUser.FirstName,
                LastName = item.BonusStatusByUser.LastName,
                MiddleName = item.BonusStatusByUser.MiddleName,
                TeamId = item.BonusStatusByUser.TeamId,
            } : null!,
            AllowanceApprovalStatusByUser = item.AllowanceApprovalStatusByUser != null ? new User
            {
                Id = item.AllowanceApprovalStatusByUser.Id,
                UserName = item.AllowanceApprovalStatusByUser.UserName,
                FirstName = item.AllowanceApprovalStatusByUser.FirstName,
                LastName = item.AllowanceApprovalStatusByUser.LastName,
                MiddleName = item.AllowanceApprovalStatusByUser.MiddleName,
                TeamId = item.AllowanceApprovalStatusByUser.TeamId,
            } : null!,
            AssignedByUser = item.AssignedByUser != null ? new User
            {
                Id = item.AssignedByUser.Id,
                UserName = item.AssignedByUser.UserName,
                FirstName = item.AssignedByUser.FirstName,
                LastName = item.AssignedByUser.LastName,
                MiddleName = item.AssignedByUser.MiddleName,
                TeamId = item.AssignedByUser.TeamId,
            } : null!,
            AssignedToUser = item.AssignedToUser != null ? new User
            {
                Id = item.AssignedToUser.Id,    
                UserName = item.AssignedToUser.UserName,
                FirstName = item.AssignedToUser.FirstName,
                LastName = item.AssignedToUser.LastName,
                MiddleName = item.AssignedToUser.MiddleName,
                TeamId = item.AssignedToUser.TeamId,
            } : null!,
            ActiveByUser = item.ActiveByUser != null ? new User
            {
                Id = item.ActiveByUser.Id,
                UserName = item.ActiveByUser.UserName,
                FirstName = item.ActiveByUser.FirstName,
                LastName = item.ActiveByUser.LastName,
                MiddleName = item.ActiveByUser.MiddleName,
                TeamId = item.ActiveByUser.TeamId,
            } : null!,
            ArchivedByUser = item.ArchivedByUser != null ? new User
            {
                Id = item.ArchivedByUser.Id,
                UserName = item.ArchivedByUser.UserName,
                FirstName = item.ArchivedByUser.FirstName,
                LastName = item.ArchivedByUser.LastName,
                MiddleName = item.ArchivedByUser.MiddleName,
                TeamId = item.ArchivedByUser.TeamId,
            } : null!,
            CompletedByUser = item.CompletedByUser != null ? new User
            {
                Id = item.CompletedByUser.Id,
                UserName = item.CompletedByUser.UserName,
                FirstName = item.CompletedByUser.FirstName,
                LastName = item.CompletedByUser.LastName,
                MiddleName = item.CompletedByUser.MiddleName,
                TeamId = item.CompletedByUser.TeamId,
            } : null!,
            Grade = item.Grade != null ? new Grade
            {
                Id = item.Grade.Id,
                LetterGrade = item.Grade.LetterGrade,
            } : null,
            Group = item.Group != null ? new TaskGroup
            {
                Id = item.Group.Id,
                Name = item.Group.Name,
            } : null,
            Kind = item.Kind != null ? new TaskKind
            {
                Id = item.Kind.Id,
                Name = item.Kind.Name,
            } : null,
            Category = item.Category != null ? new TaskCategory
            {
                Id = item.Category.Id,
                Name = item.Category.Name,
            } : null,
            TeamAllowanceInterval = item.TeamAllowanceInterval != null ? new TeamAllowanceInterval
            {
                Id = item.TeamAllowanceInterval.Id,
                Name = item.TeamAllowanceInterval.Name,
                TeamId = item.TeamAllowanceInterval.TeamId,
                Description = item.TeamAllowanceInterval.Description,
                MaxAllowanceAmount = item.TeamAllowanceInterval.MaxAllowanceAmount,
                MinCreditsForAllowance = item.TeamAllowanceInterval.MinCreditsForAllowance,
                IntervalType = item.TeamAllowanceInterval.IntervalType,
                IntervalValue = item.TeamAllowanceInterval.IntervalValue,
                StartDayOfWeek = item.TeamAllowanceInterval.StartDayOfWeek,
                StartMonthOfYear = item.TeamAllowanceInterval.StartMonthOfYear,
                IsActive = item.TeamAllowanceInterval.IsActive,
                ResetGradesOnIntervalEnd = item.TeamAllowanceInterval.ResetGradesOnIntervalEnd,
                CreatedBy = item.TeamAllowanceInterval.CreatedBy,
                CreatedAt = item.TeamAllowanceInterval.CreatedAt,
                UpdatedBy = item.TeamAllowanceInterval.UpdatedBy,
                UpdatedAt = item.TeamAllowanceInterval.UpdatedAt,
                RowVersion = item.TeamAllowanceInterval.RowVersion,
            } : null,
        };
    }
}