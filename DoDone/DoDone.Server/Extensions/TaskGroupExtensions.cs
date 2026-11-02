/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Server.Dtos;

namespace DoDone.Server.Extensions;

public static class TaskGroupExtensions
{
    public static TaskGroupResponse ToDto(this TaskGroup group)
    {
        if (group == null)
            throw new ArgumentNullException(nameof(group), "TaskGroup cannot be null");

        return new TaskGroupResponse
        {
            Id = group.Id,
            IsPrivate = group.TeamId == null,
            UserId = group.UserId,
            Name = group.Name,
            Description = group.Description,
            IsActive = group.IsActive,
            CreatedBy = group.CreatedBy,
            CreatedAt = group.CreatedAt,
            UpdatedBy = group.UpdatedBy,
            UpdatedAt = group.UpdatedAt,
        };
    }

    public static List<TaskGroupResponse> ToDtoList(this IEnumerable<TaskGroup> groups)
    {
        return groups.Select(g => g.ToDto()).ToList();
    }
    public static TaskGroupDetailsResponse ToDetailsDto(this TaskGroup group)
    {
        if (group == null)
            throw new ArgumentNullException(nameof(group), "TaskGroup cannot be null");

        return new TaskGroupDetailsResponse
        {
            Id = group.Id,
            UserId = group.UserId,
            IsPrivate = group.TeamId == null,
            Name = group.Name,
            Description = group.Description,
            IsActive = group.IsActive,
            CreatedBy = group.CreatedBy,
            CreatedAt = group.CreatedAt,
            UpdatedBy = group.UpdatedBy,
            UpdatedAt = group.UpdatedAt,
            Kinds = group.Kinds?.ToDetailsDtoList() ?? new List<TaskKindDetailsResponse>(),
            CreatedByUser = group.CreatedByUser?.ToDto() ?? throw new ArgumentNullException(nameof(group.CreatedByUser), "CreatedByUser cannot be null"),
            UpdatedByUser = group.UpdatedByUser?.ToDto() ?? null
        };
    }

    public static List<TaskGroupDetailsResponse> ToDetailsDtoList(this IEnumerable<TaskGroup> groups)
    {
        return groups.Select(g => g.ToDetailsDto()).ToList();
    }
}