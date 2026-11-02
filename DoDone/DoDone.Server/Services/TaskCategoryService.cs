/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Db.Repositories;
using DoDone.Server.Dtos;
using DoDone.Server.Extensions;
using DoDone.Server.Services.Common;

namespace DoDone.Server.Services;

public interface ITaskCategoryService : 
    IGenericService<TaskCategory, TaskCategoryResponse, TaskCategoryDetailsResponse, TaskCategoryCreateRequest, TaskCategoryUpdateRequest>
{ }

public class TaskCategoryService : 
    BaseService<TaskCategory, TaskCategoryResponse, TaskCategoryDetailsResponse, TaskCategoryCreateRequest, TaskCategoryUpdateRequest>,
    ITaskCategoryService
{
    public TaskCategoryService(ITaskCategoryRepository taskCategorys, ICurrentUserService currentUser, IQueryableProcessorService queryProcessor)
        : base(taskCategorys, currentUser, queryProcessor)
    { }

    protected override Task<TaskCategory> MapCreateRequestToEntity(TaskCategoryCreateRequest request)
    {
        return Task.FromResult(new TaskCategory
        {
            KindId = request.KindId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IsActive = request.IsActive,
            CreatedBy = _currentUser.UserId,
            CreatedAt = DateTimeOffset.UtcNow,
        });
    }

    protected override Task MapUpdateRequestToEntity(TaskCategoryUpdateRequest request, TaskCategory entity)
    {
        entity.KindId = request.KindId;
        entity.Name = request.Name.Trim();
        entity.Description = request.Description?.Trim();
        entity.IsActive = request.IsActive;
        entity.UpdatedBy = _currentUser.UserId;
        entity.UpdatedAt = DateTimeOffset.UtcNow;

        return Task.CompletedTask;
    }

    protected override Task<TaskCategoryResponse> MapEntityToResponse(TaskCategory entity)
    {
        return Task.FromResult(new TaskCategoryResponse
        {
            Id = entity.Id,
            KindId = entity.KindId,
            Name = entity.Name,
            Description = entity.Description,
            IsActive = entity.IsActive,
            CreatedBy = entity.CreatedBy,
            CreatedAt = entity.CreatedAt,
            UpdatedBy = entity.UpdatedBy,
            UpdatedAt = entity.UpdatedAt,
        });
    }

    protected override Task<TaskCategoryDetailsResponse> MapEntityToDetailsResponse(TaskCategory entity)
    {
        return Task.FromResult(new TaskCategoryDetailsResponse
        {
            Id = entity.Id,
            KindId = entity.KindId,
            Name = entity.Name,
            Description = entity.Description,
            IsActive = entity.IsActive,
            CreatedBy = entity.CreatedBy,
            CreatedAt = entity.CreatedAt,
            UpdatedBy = entity.UpdatedBy,
            UpdatedAt = entity.UpdatedAt,
            CreatedByUser = entity.CreatedByUser.ToDto(),
            UpdatedByUser = entity.UpdatedByUser?.ToDto()
        });
    }


    protected override Task<string?> ValidateCreateRequest(TaskCategoryCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Task.FromResult<string?>("TaskCategory name is required");

        if (request.Name.Length > 100)
            return Task.FromResult<string?>("TaskCategory name must be less than 100 characters");

        return Task.FromResult<string?>(null);
    }
}

