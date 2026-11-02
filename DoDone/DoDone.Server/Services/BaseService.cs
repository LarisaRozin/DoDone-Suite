/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Repositories;
using DoDone.Shared.Abstractions;
using DoDone.Server.Dtos;
using DoDone.Server.Dtos.Common;
using DoDone.Server.Services.Common;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Server.Services;

/// <summary>
/// Abstract base service providing common CRUD operations
/// Works with existing DTO patterns using reflection for property access
/// </summary>
/// <typeparam name="TEntity">The entity type</typeparam>
/// <typeparam name="TResponse">The response DTO type</typeparam>
/// <typeparam name="TDetailsResponse">The detailed response DTO type</typeparam>
/// <typeparam name="TCreateRequest">The create request DTO type</typeparam>
/// <typeparam name="TUpdateRequest">The update request DTO type</typeparam>
public abstract class BaseService<TEntity, TResponse, TDetailsResponse, TCreateRequest, TUpdateRequest> : 
    IGenericService<TEntity, TResponse, TDetailsResponse, TCreateRequest, TUpdateRequest>
    where TEntity : class, IEntity
    where TResponse : class
    where TDetailsResponse : class
    where TCreateRequest : class
    where TUpdateRequest : class
{
    protected readonly IRepositoryBase<TEntity> _repository;
    protected readonly ICurrentUserService _currentUser;
    protected readonly IQueryableProcessorService _queryProcessor;

    protected BaseService(IRepositoryBase<TEntity> repository, ICurrentUserService currentUser, IQueryableProcessorService queryProcessor)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _currentUser = currentUser ?? throw new ArgumentNullException(nameof(currentUser));
        _queryProcessor = queryProcessor ?? throw new ArgumentNullException(nameof(queryProcessor));
    }

    public virtual async Task<DataResponse<TResponse>> CreateAsync(TCreateRequest request)
    {
        if (request == null)
            throw new ArgumentException($"Invalid {typeof(TEntity).Name} data");

        // Custom validation hook
        var customValidationError = await ValidateCreateRequest(request);
        if (!string.IsNullOrEmpty(customValidationError))
        {
            return new DataResponse<TResponse>
            {
                Success = false,
                Message = customValidationError
            };
        }

        var entity = await MapCreateRequestToEntity(request);
        SetCreationAuditFields(entity);

        await _repository.CreateAsync(entity);
        await _repository.SaveChangesAsync();

        return new DataResponse<TResponse> 
        { 
            Data = await MapEntityToResponse(entity), 
            Success = true, 
            Message = $"{typeof(TEntity).Name} created successfully" 
        };
    }

    public virtual async Task<DataResponse<TResponse>> UpdateAsync(TUpdateRequest request)
    {
        if (request == null)
            throw new ArgumentException($"Invalid {typeof(TEntity).Name} data");

        // Use reflection to get the Id property
        var idProperty = typeof(TUpdateRequest).GetProperty("Id");
        if (idProperty == null)
            throw new InvalidOperationException($"{typeof(TUpdateRequest).Name} must have an Id property");

        var id = (long)idProperty.GetValue(request)!;
        var existingEntity = await _repository.GetAsync(id);
        if (existingEntity == null)
            throw new ArgumentException($"{typeof(TEntity).Name} not found");

        // Custom validation hook
        var customValidationError = await ValidateUpdateRequest(request, existingEntity);
        if (!string.IsNullOrEmpty(customValidationError))
        {
            return new DataResponse<TResponse>
            {
                Success = false,
                Message = customValidationError
            };
        }

        await MapUpdateRequestToEntity(request, existingEntity);
        SetUpdateAuditFields(existingEntity);

        await _repository.UpdateAsync(existingEntity);
        await _repository.SaveChangesAsync();

        return new DataResponse<TResponse> 
        { 
            Data = await MapEntityToResponse(existingEntity), 
            Success = true, 
            Message = $"{typeof(TEntity).Name} updated successfully" 
        };
    }

    public virtual async Task<DataResponse<TResponse>> GetAsync(long id)
    {
        var entity = await _repository.GetAsync(id);
        if (entity == null)
            throw new ArgumentException($"{typeof(TEntity).Name} not found");

        return new DataResponse<TResponse> 
        { 
            Data = await MapEntityToResponse(entity), 
            Success = true, 
            Message = $"{typeof(TEntity).Name} retrieved successfully" 
        };
    }

    public virtual async Task<DataResponse<TDetailsResponse>> GetDetailsAsync(long id)
    {
        var entity = await _repository.GetTaskItemEntityDetailsAsync(id);
        if (entity == null)
            throw new ArgumentException($"{typeof(TEntity).Name} not found");

        return new DataResponse<TDetailsResponse> 
        { 
            Data = await MapEntityToDetailsResponse(entity), 
            Success = true, 
            Message = $"{typeof(TEntity).Name} details retrieved successfully" 
        };
    }

    public virtual async Task<DataResponse<List<TResponse>>> GetListAsync(long parentId)
    {
        var entities = await _repository.GetListAsync(parentId);
        var responseDtos = new List<TResponse>();
        
        foreach (var entity in entities)
        {
            responseDtos.Add(await MapEntityToResponse(entity));
        }

        return new DataResponse<List<TResponse>> 
        { 
            Data = responseDtos, 
            Success = true, 
            Message = $"{typeof(TEntity).Name} list retrieved successfully" 
        };
    }

    public virtual async Task<DataResponse<List<TDetailsResponse>>> GetListDetailsAsync(long parentId)
    {
        var entities = await _repository.GetListDetailsAsync(parentId);
        var responseDtos = new List<TDetailsResponse>();
        
        foreach (var entity in entities)
        {
            responseDtos.Add(await MapEntityToDetailsResponse(entity));
        }

        return new DataResponse<List<TDetailsResponse>> 
        { 
            Data = responseDtos, 
            Success = true, 
            Message = $"{typeof(TEntity).Name} details list retrieved successfully" 
        };
    }

    public virtual async Task<PagedListResponse<TResponse>> GetPagedListAsync(PagedListRequest request)
    {
        try
        {
            // Get base query from repository
            var query = _repository.GetBaseQuery(request.ParentId);
            
            // Apply search term filter using QueryableProcessorService
            query = _queryProcessor.ApplySearchTermFilter(query, request.Filtering.SearchTerm);
            
            // Apply default sorting using QueryableProcessorService
            query = _queryProcessor.ApplyDefaultSorting(query);
            
            // Get total count before paging
            var totalCount = await _queryProcessor.GetTotalCountAsync(query);
            
            // Apply paging using QueryableProcessorService
            query = _queryProcessor.ApplyPaging(query, request.Paging);
            
            // Execute query and map to DTOs
            var entities = await query.ToListAsync();
            var responseDtos = new List<TResponse>();
            foreach (var entity in entities)
            {
                responseDtos.Add(await MapEntityToResponse(entity));
            }

            var pagingInfo = new PagingInfo
            {
                CurrentPage = request.Paging.Page,
                PageSize = request.Paging.ValidatedPageSize,
                TotalItems = totalCount
            };

            return PagedListResponse<TResponse>.CreateSuccess(responseDtos, pagingInfo);
        }
        catch (Exception ex)
        {
            return PagedListResponse<TResponse>.CreateFailure($"Error retrieving {typeof(TEntity).Name} list: {ex.Message}");
        }
    }

    public virtual async Task<PagedListResponse<TDetailsResponse>> GetPagedListDetailsAsync(PagedListRequest request)
    {
        try
        {
            // Get base query from repository
            var query = _repository.GetBaseDetailsQuery(request.ParentId);
            
            // Apply search term filter using QueryableProcessorService
            query = _queryProcessor.ApplySearchTermFilter(query, request.Filtering.SearchTerm);
            
            // Apply default sorting using QueryableProcessorService
            query = _queryProcessor.ApplyDefaultSorting(query);
            
            // Get total count before paging
            var totalCount = await _queryProcessor.GetTotalCountAsync(query);
            
            // Apply paging using QueryableProcessorService
            query = _queryProcessor.ApplyPaging(query, request.Paging);
            
            // Execute query and map to DTOs
            var entities = await query.ToListAsync();
            var responseDtos = new List<TDetailsResponse>();
            foreach (var entity in entities)
            {
                responseDtos.Add(await MapEntityToDetailsResponse(entity));
            }

            var pagingInfo = new PagingInfo
            {
                CurrentPage = request.Paging.Page,
                PageSize = request.Paging.ValidatedPageSize,
                TotalItems = totalCount
            };

            return PagedListResponse<TDetailsResponse>.CreateSuccess(responseDtos, pagingInfo);
        }
        catch (Exception ex)
        {
            return PagedListResponse<TDetailsResponse>.CreateFailure($"Error retrieving {typeof(TEntity).Name} details list: {ex.Message}");
        }
    }

    // Abstract methods that must be implemented by derived classes
    protected abstract Task<TEntity> MapCreateRequestToEntity(TCreateRequest request);
    protected abstract Task MapUpdateRequestToEntity(TUpdateRequest request, TEntity entity);
    protected abstract Task<TResponse> MapEntityToResponse(TEntity entity);
    protected abstract Task<TDetailsResponse> MapEntityToDetailsResponse(TEntity entity);

    // Virtual methods that can be overridden for custom behavior
    protected virtual void SetCreationAuditFields(TEntity entity)
    {
        entity.CreatedBy = _currentUser.UserId;
        entity.CreatedAt = DateTime.UtcNow;
    }

    protected virtual void SetUpdateAuditFields(TEntity entity)
    {
        entity.UpdatedBy = _currentUser.UserId;
        entity.UpdatedAt = DateTime.UtcNow;
    }

    // Helper method for additional validation
    protected virtual async Task<string?> ValidateCreateRequest(TCreateRequest request)
    {
        return await Task.FromResult<string?>(null);
    }

    protected virtual async Task<string?> ValidateUpdateRequest(TUpdateRequest request, TEntity entity)
    {
        if (!_currentUser.IsAdmin && entity.CreatedBy != _currentUser.UserId)
        {
            throw new UnauthorizedAccessException("You do not have permission to update this item.");
        }
        return await Task.FromResult<string?>(null);
    }

    public async Task<ResponseBase> DeleteAsync(long id)
    {
        var entity = await _repository.GetAsync(id);
        if (entity == null)
            throw new ArgumentException($"{typeof(TEntity).Name} not found");

        await _repository.DeleteAsync(id);
        await _repository.SaveChangesAsync();

        return new ResponseBase 
        { 
            Success = true, 
            Message = $"{typeof(TEntity).Name} deleted successfully" 
        };
    }
}
