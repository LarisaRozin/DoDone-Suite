/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Microsoft.AspNetCore.Mvc;
using DoDone.Server.Services;
using DoDone.Server.Dtos.Common;
using DoDone.Shared.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Server.Controllers;

/// <summary>
/// Abstract base controller providing standard CRUD operations
/// Works with existing DTO patterns
/// </summary>
/// <typeparam name="TEntity">The entity type</typeparam>
/// <typeparam name="TResponse">The response DTO type</typeparam>
/// <typeparam name="TDetailsResponse">The detailed response DTO type</typeparam>
/// <typeparam name="TCreateRequest">The create request DTO type</typeparam>
/// <typeparam name="TUpdateRequest">The update request DTO type</typeparam>
/// <typeparam name="TService">The service type</typeparam>
[ApiController]
[Authorize]
public abstract class BaseController<TEntity, TResponse, TDetailsResponse, TCreateRequest, TUpdateRequest, TService> : ControllerBase
    where TEntity : class, IEntity
    where TResponse : class
    where TDetailsResponse : class
    where TCreateRequest : class
    where TUpdateRequest : class
    where TService : IGenericService<TEntity, TResponse, TDetailsResponse, TCreateRequest, TUpdateRequest>
{
    protected readonly TService _service;
    protected readonly ILogger _logger;

    protected BaseController(TService service, ILogger logger)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    // Helper method to safely get the Name property from request objects
    private string GetRequestName<T>(T request) where T : class
    {
        var nameProperty = typeof(T).GetProperty("Name");
        return nameProperty?.GetValue(request)?.ToString() ?? "Unknown";
    }

    [HttpPost]
    public virtual async Task<IActionResult> Create([FromBody] TCreateRequest request)
    {
        try
        {
            var result = await _service.CreateAsync(request);
            _logger.LogInformation($"{typeof(TEntity).Name} {GetRequestName(request)} created.");
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while creating {typeof(TEntity).Name} {GetRequestName(request)}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during {typeof(TEntity).Name} creation for {GetRequestName(request)}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPut]
    public virtual async Task<IActionResult> Update([FromBody] TUpdateRequest request)
    {
        try
        {
            var result = await _service.UpdateAsync(request);
            _logger.LogInformation($"{typeof(TEntity).Name} {GetRequestName(request)} updated.");
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while updating {typeof(TEntity).Name} {GetRequestName(request)}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during {typeof(TEntity).Name} update for {GetRequestName(request)}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpDelete("{id}")]
    public virtual async Task<IActionResult> Delete(long id)
    {
        try
        {
            var result = await _service.DeleteAsync(id);
            _logger.LogInformation($"{typeof(TEntity).Name} with ID {id} deleted.");
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while deleting {typeof(TEntity).Name} with ID {id}");
            return BadRequest(ex.Message);
        }
        catch (DbUpdateException dbEx)
        {
            _logger.LogWarning(dbEx, $"Database update error while deleting {typeof(TEntity).Name} with ID {id}");
            return StatusCode(409, $"{typeof(TEntity).Name} cannot be deleted as it is referenced by other records.");
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during {typeof(TEntity).Name} deletion for ID {id}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }



    [HttpGet("{id}")]
    public virtual async Task<IActionResult> Get(long id)
    {
        try
        {
            var result = await _service.GetAsync(id);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while getting {typeof(TEntity).Name} with ID {id}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during {typeof(TEntity).Name} retrieval for ID {id}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpGet("details/{id}")]
    public virtual async Task<IActionResult> GetDetails(long id)
    {
        try
        {
            var result = await _service.GetDetailsAsync(id);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while getting {typeof(TEntity).Name} details with ID {id}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during {typeof(TEntity).Name} details retrieval for ID {id}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpGet("list/{parentId}")]
    public virtual async Task<IActionResult> GetList(long parentId)
    {
        try
        {
            var result = await _service.GetListAsync(parentId);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while getting {typeof(TEntity).Name} list for parent ID {parentId}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during {typeof(TEntity).Name} list retrieval for parent ID {parentId}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpGet("list-details/{parentId}")]
    public virtual async Task<IActionResult> GetListDetails(long parentId)
    {
        try
        {
            var result = await _service.GetListDetailsAsync(parentId);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while getting {typeof(TEntity).Name} details list for parent ID {parentId}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during {typeof(TEntity).Name} details list retrieval for parent ID {parentId}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("paged-list")]
    public virtual async Task<IActionResult> GetPagedList([FromBody] PagedListRequest request)
    {
        try
        {
            var result = await _service.GetPagedListAsync(request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while getting paged {typeof(TEntity).Name} list");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during paged {typeof(TEntity).Name} list retrieval");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("paged-list-details")]
    public virtual async Task<IActionResult> GetPagedListDetails([FromBody] PagedListRequest request)
    {
        try
        {
            var result = await _service.GetPagedListDetailsAsync(request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while getting paged {typeof(TEntity).Name} details list");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during paged {typeof(TEntity).Name} details list retrieval");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }
}
