/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DoDone.Server.Dtos;
using DoDone.Server.Services;
using DoDone.Server.Dtos.Common;

namespace DoDone.Server.Controllers;

[Route("api/[controller]")]
[Authorize]
public class AllowanceHistoryController : ControllerBase
{
    private readonly IAllowanceHistoryService _service;
    private readonly ILogger _logger;

    public AllowanceHistoryController(IAllowanceHistoryService service, ILogger<AllowanceHistoryController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpPost("paged-list")]
    public async Task<IActionResult> GetPagedAllowanceHistories([FromBody] PagedAllowanceHistoriesListRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Invalid request parameters.");
            }

            var result = await _service.GetPagedAllowanceHistoriesAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Error occurred while fetching allowance histories: {request}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("paged-task-items-list")]
    public async Task<IActionResult> GetPagedAllowanceHistoryTaskItems([FromBody] PagedAllowanceHistoryTaskItemsListRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Invalid request parameters.");
            }

            var result = await _service.GetPagedAllowanceHistoryTaskItemsAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Error occurred while fetching allowance history task items: {request}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("approve")]
    public async Task<IActionResult> ApproveAllowanceHistory([FromBody] AllowanceHistoryApprovalRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Invalid request parameters.");
            }

            var result = await _service.ApproveUserAllowanceAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Error occurred while approving allowance history: {request}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }
    
    [HttpPost("claim")]
    public async Task<IActionResult> ClaimAllowanceHistory([FromBody] AllowanceHistoryClaimRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Invalid request parameters.");
            }

            var result = await _service.ClaimUserAllowanceAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Error occurred while claiming allowance history for the user.");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }
}