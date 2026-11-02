/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Server.Dtos;
using DoDone.Server.Dtos.Common;
using DoDone.Shared.Abstractions;

namespace DoDone.Server.Services;

/// <summary>
/// Generic service interface for standard CRUD operations
/// Works with existing DTO patterns without requiring interface implementation
/// </summary>
/// <typeparam name="TEntity">The entity type</typeparam>
/// <typeparam name="TResponse">The response DTO type</typeparam>
/// <typeparam name="TDetailsResponse">The detailed response DTO type</typeparam>
/// <typeparam name="TCreateRequest">The create request DTO type</typeparam>
/// <typeparam name="TUpdateRequest">The update request DTO type</typeparam>
public interface IGenericService<TEntity, TResponse, TDetailsResponse, TCreateRequest, TUpdateRequest>
    where TEntity : class, IEntity
    where TResponse : class
    where TDetailsResponse : class
    where TCreateRequest : class
    where TUpdateRequest : class
{
    Task<DataResponse<TResponse>> CreateAsync(TCreateRequest request);
    Task<DataResponse<TResponse>> UpdateAsync(TUpdateRequest request);
    Task<ResponseBase> DeleteAsync(long id);
    Task<DataResponse<TResponse>> GetAsync(long id);
    Task<DataResponse<TDetailsResponse>> GetDetailsAsync(long id);
    Task<DataResponse<List<TResponse>>> GetListAsync(long parentId);
    Task<DataResponse<List<TDetailsResponse>>> GetListDetailsAsync(long parentId);
    
    // New paged methods
    Task<PagedListResponse<TResponse>> GetPagedListAsync(PagedListRequest request);
    Task<PagedListResponse<TDetailsResponse>> GetPagedListDetailsAsync(PagedListRequest request);
}
