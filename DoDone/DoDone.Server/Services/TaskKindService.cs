/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Server.Dtos;
using DoDone.Db.Repositories;
using DoDone.Server.Extensions;
using DoDone.Server.Services.Common;
using Org.BouncyCastle.Ocsp;

namespace DoDone.Server.Services;

public interface ITaskKindService :
    IGenericService<TaskKind, TaskKindResponse, TaskKindDetailsResponse, TaskKindCreateRequest, TaskKindUpdateRequest>
{ }

public class TaskKindService :
    BaseService<TaskKind, TaskKindResponse, TaskKindDetailsResponse, TaskKindCreateRequest, TaskKindUpdateRequest>,
    ITaskKindService
{
    public TaskKindService(ITaskKindRepository taskKinds, ICurrentUserService currentUser, IQueryableProcessorService queryProcessor)
        : base(taskKinds, currentUser, queryProcessor)
    {
    }

    protected override Task<TaskKind> MapCreateRequestToEntity(TaskKindCreateRequest request)
    {
        return Task.FromResult(new TaskKind
        {
            GroupId = request.GroupId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IsActive = request.IsActive,
            CreatedBy = _currentUser.UserId,
            CreatedAt = DateTimeOffset.UtcNow,
        });
    }

    protected override Task MapUpdateRequestToEntity(TaskKindUpdateRequest request, TaskKind entity)
    {
        entity.Name = request.Name.Trim();
        entity.Description = request.Description?.Trim();
        entity.IsActive = request.IsActive;
        entity.UpdatedBy = _currentUser.UserId;
        entity.UpdatedAt = DateTimeOffset.UtcNow;

        return Task.CompletedTask;
    }

    protected override Task<TaskKindResponse> MapEntityToResponse(TaskKind entity)
    {
    
        return Task.FromResult(entity.ToDto());
    }

    protected override Task<TaskKindDetailsResponse> MapEntityToDetailsResponse(TaskKind entity)
    {
        return Task.FromResult(entity.ToDetailsDto());
    }

    protected override Task<string?> ValidateCreateRequest(TaskKindCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Task.FromResult<string?>("TaskKind name is required");

        if (request.Name.Length > 100)
            return Task.FromResult<string?>("TaskKind name must be less than 100 characters");

        return Task.FromResult<string?>(null);
    }
}

