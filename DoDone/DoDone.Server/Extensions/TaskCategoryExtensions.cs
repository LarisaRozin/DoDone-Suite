/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Server.Dtos;

namespace DoDone.Server.Extensions;

public static class TaskCategoryExtensions
{
    public static TaskCategoryResponse ToDto(this TaskCategory category)
    {
        if (category == null)
            throw new ArgumentNullException(nameof(category), "TaskCategory cannot be null");

        return new TaskCategoryResponse
        {
            Id = category.Id,
            KindId = category.KindId,
            Name = category.Name,
            Description = category.Description,
            IsActive = category.IsActive,
            CreatedBy = category.CreatedBy,
            CreatedAt = category.CreatedAt,
            UpdatedBy = category.UpdatedBy,
            UpdatedAt = category.UpdatedAt
        };
    }

    public static TaskCategoryDetailsResponse ToDetailsDto(this TaskCategory category)
    {
        if (category == null)
            throw new ArgumentNullException(nameof(category), "TaskCategory cannot be null");

        return new TaskCategoryDetailsResponse
        {
            Id = category.Id,
            KindId = category.KindId,
            Name = category.Name,
            Description = category.Description,
            IsActive = category.IsActive,
            CreatedBy = category.CreatedBy,
            CreatedAt = category.CreatedAt,
            UpdatedBy = category.UpdatedBy,
            UpdatedAt = category.UpdatedAt,
            CreatedByUser = category.CreatedByUser?.ToDto() ?? throw new ArgumentNullException(nameof(category.CreatedByUser), "CreatedByUser cannot be null"),
            UpdatedByUser = category.UpdatedByUser?.ToDto() ?? null
        };
    }

    public static List<TaskCategoryResponse> ToDtoList(this IEnumerable<TaskCategory> categories)
    {
        return categories.Select(c => c.ToDto()).ToList();
    }

    public static List<TaskCategoryDetailsResponse> ToDetailsDtoList(this IEnumerable<TaskCategory> categories)
    {
        return categories.Select(c => c.ToDetailsDto()).ToList();
    }

}