/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Server.Dtos;

namespace DoDone.Server.Extensions;

public static class TaskKindExtensions
{
    public static TaskKindResponse ToDto(this TaskKind kind)
    {
        if (kind == null)
            throw new ArgumentNullException(nameof(kind), "TaskKind cannot be null");

        return new TaskKindResponse
        {
            Id = kind.Id,
            GroupId = kind.GroupId,
            Name = kind.Name,
            Description = kind.Description,
            IsActive = kind.IsActive,
            CreatedBy = kind.CreatedBy,
            CreatedAt = kind.CreatedAt,
            UpdatedBy = kind.UpdatedBy,
            UpdatedAt = kind.UpdatedAt,
        };
    }
    public static TaskKindDetailsResponse ToDetailsDto(this TaskKind kind)
    {
        if (kind == null)
            throw new ArgumentNullException(nameof(kind), "TaskKind cannot be null");

        return new TaskKindDetailsResponse
        {
            Id = kind.Id,
            GroupId = kind.GroupId,
            Name = kind.Name,
            Description = kind.Description,
            IsActive = kind.IsActive,
            CreatedBy = kind.CreatedBy,
            CreatedAt = kind.CreatedAt,
            UpdatedBy = kind.UpdatedBy,
            UpdatedAt = kind.UpdatedAt,
            Categories = kind.Categories?.ToDtoList() ?? new List<TaskCategoryResponse>(),
            CreatedByUser = kind.CreatedByUser?.ToDto() ?? throw new ArgumentNullException(nameof(kind.CreatedByUser), "CreatedByUser cannot be null"),
            UpdatedByUser = kind.UpdatedByUser?.ToDto() ?? null
        };
    }
    public static List<TaskKindResponse> ToDtoList(this IEnumerable<TaskKind> kinds)
    {
        return kinds.Select(k => k.ToDto()).ToList();
    }

    public static List<TaskKindDetailsResponse> ToDetailsDtoList(this IEnumerable<TaskKind> kinds)
    {
        return kinds.Select(k => k.ToDetailsDto()).ToList();
    }
}