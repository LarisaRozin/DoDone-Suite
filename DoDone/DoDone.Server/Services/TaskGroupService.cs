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

public interface ITaskGroupService : 
    IGenericService<TaskGroup, TaskGroupResponse, TaskGroupDetailsResponse, TaskGroupCreateRequest, TaskGroupUpdateRequest>
{ }

public class TaskGroupService : 
    BaseService<TaskGroup, TaskGroupResponse, TaskGroupDetailsResponse, TaskGroupCreateRequest, TaskGroupUpdateRequest>, 
    ITaskGroupService
{
    public TaskGroupService(ITaskGroupRepository repository, ICurrentUserService currentUser, IQueryableProcessorService queryProcessor)
        : base(repository, currentUser, queryProcessor)
    {
    }

    protected override Task<TaskGroup> MapCreateRequestToEntity(TaskGroupCreateRequest request)
    {
        return Task.FromResult(new TaskGroup
        {
            UserId = _currentUser.UserId,
            TeamId = request.IsPrivate ? null : _currentUser.TeamId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IsActive = request.IsActive,
            CreatedBy = _currentUser.UserId,
            CreatedAt = DateTimeOffset.UtcNow,
        });
    }

    protected override Task MapUpdateRequestToEntity(TaskGroupUpdateRequest request, TaskGroup entity)
    {
        entity.TeamId = request.IsPrivate ? null : _currentUser.TeamId;
        entity.Name = request.Name?.Trim() ?? entity.Name;
        entity.Description = request.Description?.Trim() ?? entity.Description;
        entity.IsActive = request.IsActive;
        entity.UpdatedBy = _currentUser.UserId;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        
        return Task.CompletedTask;
    }

    protected override Task<TaskGroupResponse> MapEntityToResponse(TaskGroup entity)
    {
        return Task.FromResult(entity.ToDto());
    }

    protected override Task<TaskGroupDetailsResponse> MapEntityToDetailsResponse(TaskGroup entity)
    {
        return Task.FromResult(entity.ToDetailsDto());
    }

    protected override Task<string?> ValidateCreateRequest(TaskGroupCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Task.FromResult<string?>("TaskGroup name is required");
            
        if (request.Name.Length > 100)
            return Task.FromResult<string?>("TaskGroup name must be less than 100 characters");
            
        return Task.FromResult<string?>(null);
    }
}

