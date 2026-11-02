/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Server.Attributes;
using DoDone.Server.Dtos;
using DoDone.Server.Dtos.Common;
using DoDone.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoDone.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TeamController : ControllerBase
{
    private readonly ITeamService _teamService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<TeamController> _logger;

    public TeamController(ITeamService teamService, ICurrentUserService currentUserService, ILogger<TeamController> logger)
    {
        _teamService = teamService;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    [HttpGet()]
    public async Task<IActionResult> Get()
    {
        try
        {
            var result = await _teamService.GetTeamDetailsAsync();

            return Ok(result.ToTeamDetailsResponse());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving team {TeamId}", _currentUserService.TeamId);
            return StatusCode(500, "An error occurred while processing your request.");
        }
    }

    [HttpPut()]
    [RequireAdmin]
    public async Task<IActionResult> Update([FromBody] TeamDetailsUpdateRequest request)
    {
        try
        {
            request.Id = _currentUserService.TeamId;  // Admin user can only update their own team

            var result = await _teamService.UpdateAsync(request);

            _logger.LogInformation("Team {TeamId} updated successfully", request.Id);
            return Ok(result.ToTeamDetailsResponse());
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error while updating team {TeamId}", _currentUserService.TeamId);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating team {TeamId}", _currentUserService.TeamId);
            return StatusCode(500, "An error occurred while processing your request.");
        }
    }

    [HttpPost("members")]
    public async Task<IActionResult> GetTeam([FromBody] PagedListRequest request)
    {
        try
        {
            var result = await _teamService.GetTeamMembersAsync(request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error while getting paged team list");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Exception during team retrieval");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpGet("allowance-intervals")]
    public async Task<IActionResult> GetAllowanceIntervals()
    {
        try
        {
            var result = await _teamService.GetTeamAllowanceIntervalsForEditAsync();
            return Ok(result.ToDtoListResponse());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving allowance intervals for team {TeamId}", _currentUserService.TeamId);
            return StatusCode(500, "An error occurred while processing your request.");
        }
    }

    [HttpGet("allowance-intervals/{intervalId:long}")]
    public async Task<IActionResult> GetAllowanceInterval(long intervalId)
    {
        try
        {
            var result = await _teamService.GetTeamAllowanceIntervalAsync(intervalId);
            return Ok(result?.ToDto());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving allowance interval {IntervalId} for team {TeamId}", intervalId, _currentUserService.TeamId);
            return StatusCode(500, "An error occurred while processing your request.");
        }
    }

    [HttpPost("allowance-intervals")]
    public async Task<IActionResult> CreateAllowanceInterval([FromBody] TeamAllowanceIntervalCreateRequest request)
    {
        try
        {
            request.TeamId = _currentUserService.TeamId;
            request.CreatedBy = _currentUserService.UserId;

            var result = await _teamService.CreateTeamAllowanceIntervalAsync(request);
            _logger.LogInformation("Allowance interval {IntervalName} created for team {TeamId}", request.Name, request.TeamId);
            return Ok(result.ToDto());
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error while creating allowance interval for team {TeamId}", _currentUserService.TeamId);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Error creating allowance interval for team {TeamId}", _currentUserService.TeamId);
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPut("allowance-intervals")]
    public async Task<IActionResult> UpdateAllowanceInterval([FromBody] TeamAllowanceIntervalUpdateRequest request)
    {
        try
        {
            request.TeamId = _currentUserService.TeamId;
            request.UpdatedBy = _currentUserService.UserId;

            var result = await _teamService.UpdateTeamAllowanceIntervalAsync(request);
            _logger.LogInformation("Allowance interval {IntervalId} updated for team {TeamId}", request.Id, request.TeamId);
            return Ok(result.ToDto());
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error while updating allowance interval {IntervalId} for team {TeamId}", request.Id, _currentUserService.TeamId);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Error updating allowance interval {IntervalId} for team {TeamId}", request.Id, _currentUserService.TeamId);
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpDelete("allowance-intervals/{intervalId:long}")]
    public async Task<IActionResult> DeleteAllowanceInterval(long intervalId)
    {
        try
        {
            await _teamService.DeleteTeamAllowanceIntervalAsync(intervalId);

            _logger.LogInformation("Allowance interval {IntervalId} deleted for team {TeamId}", intervalId, _currentUserService.TeamId);
            return Ok(new ResponseBase { Success = true, Message = "Allowance interval deleted successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error while deleting allowance interval {IntervalId} for team {TeamId}", intervalId, _currentUserService.TeamId);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Error deleting allowance interval {IntervalId} for team {TeamId}", intervalId, _currentUserService.TeamId);
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

}
