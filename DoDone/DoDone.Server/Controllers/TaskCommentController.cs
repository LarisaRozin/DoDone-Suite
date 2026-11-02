/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DoDone.Server.Dtos;
using DoDone.Server.Services;

namespace DoDone.Server.Controllers;

[Route("api/[controller]")]
[Authorize]
public class TaskCommentController : ControllerBase
{
    protected readonly ITaskCommentService _service;
    protected readonly ILogger _logger;

    public TaskCommentController(ITaskCommentService service, ILogger<TaskCommentController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpPost("paged-list")]
    public virtual async Task<IActionResult> GetList([FromBody] PagedTaskCommentListRequest request)
    {
        try
        {
            var result = await _service.GetPagedListAsync(request);
            return Ok(new DataResponse<PagedTaskCommentListResponse>
            {
                Data = result,
                Success = result.Success,
                Message = result.Message
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while getting TaskComment list with request {request}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskComment list retrieval with request {request}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("add")]
    public virtual async Task<IActionResult> Add([FromBody] TaskCommentCreateRequest request)
    {
        try
        {
            var result = await _service.AddAsync(request);
            if (result == null || result.Data == null)
            {
                return StatusCode(500, "Failed to create TaskComment. No data returned from service.");
            }
            return CreatedAtAction(nameof(GetList), new DataResponse<TaskCommentResponse> { Data = result?.Data, Success = result?.Success ?? false, Message = result?.Message });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while adding TaskComment with request {request}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskComment addition with request {request}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPut("update")]
    public virtual async Task<IActionResult> Update([FromBody] TaskCommentUpdateRequest request)
    {
        try
        {
            var result = await _service.UpdateAsync(request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while updating TaskComment with request {request}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskComment update with request {request}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpDelete("delete/{id}")]
    public virtual async Task<IActionResult> Delete(long id)
    {
        try
        {
            await _service.DeleteAsync(id);
            return Ok(new { Success = true, Message = "TaskComment deleted successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while deleting TaskComment with id {id}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskComment deletion with id {id}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }   
}