/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Abstractions;

namespace DoDone.Server.Extensions;

/// <summary>
/// Generic extension methods for common entity-to-DTO mapping patterns
/// </summary>
public static class GenericMappingExtensions
{
    /// <summary>
    /// Maps basic entity properties to a response DTO
    /// </summary>
    public static void MapBaseProperties<TEntity, TResponse>(this TEntity entity, TResponse dto)
        where TEntity : IEntity
        where TResponse : IResponseDto
    {
        dto.Id = entity.Id;
        dto.Name = entity.Name;
        dto.Description = entity.Description;
        dto.IsActive = entity.IsActive;
        dto.CreatedBy = entity.CreatedBy;
        dto.CreatedAt = entity.CreatedAt;
        dto.UpdatedBy = entity.UpdatedBy;
        dto.UpdatedAt = entity.UpdatedAt;
    }

    /// <summary>
    /// Converts a collection of entities to a list of DTOs using a mapping function
    /// </summary>
    public static List<TDto> ToList<TEntity, TDto>(this IEnumerable<TEntity> entities, Func<TEntity, TDto> mapper)
        where TEntity : class
        where TDto : class
    {
        return entities.Select(mapper).ToList();
    }

    /// <summary>
    /// Converts a collection of entities to a list of DTOs using async mapping
    /// </summary>
    public static async Task<List<TDto>> ToListAsync<TEntity, TDto>(this IEnumerable<TEntity> entities, Func<TEntity, Task<TDto>> mapper)
        where TEntity : class
        where TDto : class
    {
        var tasks = entities.Select(mapper);
        var results = await Task.WhenAll(tasks);
        return results.ToList();
    }
}
