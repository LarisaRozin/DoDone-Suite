/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Server.Dtos;
using DoDone.Server.Extensions;
using DoDone.Server.Services;
using DoDone.Server.Attributes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoDone.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public partial class UserController : ControllerBase
{
    private readonly IUserService _service;
    private readonly ILogger<UserController> _logger;

    public UserController(IUserService service, ILogger<UserController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpPost()]
    [RequireAdmin]
    public async Task<IActionResult> Create([FromBody] UserCreateRequest dto)
    {
        try
        {
            var result = await _service.CreateAsync(dto);
            if (!result.Success)
            {
                _logger.LogWarning("Failed to create User with UserName {UserName}. Reason: {Reason}", dto?.UserName, result.Message);
                return BadRequest(result);
            }

            _logger.LogInformation("User {UserName} created.", dto?.UserName);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error while creating user {UserName}", dto?.UserName);
            return BadRequest(new ResponseBase { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Exception during user creation for user {UserName}", dto?.UserName);
            return StatusCode(500, new ResponseBase { Success = false, Message = $"An error occurred while processing your request. {errorMessage}" });
        }
    }

    [HttpPut]
    [RequireAdmin]
    public async Task<IActionResult> Update([FromBody] UserUpdateRequest dto)
    {
        try
        {
            var result = await _service.UpdateAsync(dto);
            if (!result.Success)
            {
                _logger.LogWarning("Failed to update User with UserName {UserName}. Reason: {Reason}", dto?.UserName, result.Message);
                return BadRequest(result);
            }

            _logger.LogInformation("User {UserName} updated.", dto?.UserName);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error while updating user {UserName}", dto?.UserName);
            return BadRequest(new ResponseBase { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Exception during user update for user {UserName}", dto?.UserName);
            return StatusCode(500, new ResponseBase { Success = false, Message = $"An error occurred while processing your request. {errorMessage}" });
        }
    }

    [HttpDelete("{id}")]
    [RequireAdmin]
    public async Task<IActionResult> Delete(long id)
    {
        try
        {
            var result = await _service.DeleteAsync(id);
            if (!result.Success)
            {
                _logger.LogWarning("Failed to delete User with ID {UserId}. Reason: {Reason}", id, result.Message);
                return BadRequest(result);
            }

            _logger.LogInformation("User with ID {UserId} deleted.", id);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error while deleting user with ID {UserId}", id);
            return BadRequest(new ResponseBase { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Exception during user deletion for user with ID {UserId}. Error: {ErrorMessage}", id, errorMessage);
            return StatusCode(500, new ResponseBase { Success = false, Message = $"Failed to delete user: {errorMessage}" });
        }
    }

    [HttpGet("{id}")]
    [RequireAdmin]
    public async Task<IActionResult> Get(long id)
    {
        try
        {
            var result = await _service.GetByIdAsync(id);
            if (!result.Success)
            {
                if (result.Message?.Contains("not found") == true)
                {
                    _logger.LogWarning("User with ID {UserId} not found.", id);
                    return NotFound(result);
                }
                else
                {
                    _logger.LogWarning("Failed to get User with ID {UserId}. Reason: {Reason}", id, result.Message);
                    return BadRequest(result);
                }
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Exception during user retrieval for user with ID {UserId}. Error: {ErrorMessage}", id, errorMessage);
            return StatusCode(500, new ResponseBase { Success = false, Message = $"An error occurred while processing your request. {errorMessage}" });
        }
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        try
        {
            var currentUserId = User.GetUserId();
            var result = await _service.GetByIdAsync(currentUserId);
            if (!result.Success)
            {
                _logger.LogWarning("Failed to get current user with ID {UserId}. Reason: {Reason}", currentUserId, result.Message);
                return BadRequest(result);
            }

            _logger.LogInformation("Current user with ID {UserId} retrieved.", currentUserId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Exception during current user retrieval. Error: {ErrorMessage}", errorMessage);
            return StatusCode(500, new ResponseBase { Success = false, Message = $"An error occurred while processing your request. {errorMessage}" });
        }
    }

    [HttpGet("me/team-id")]
    public async Task<IActionResult> GetCurrentUserTeamId()
    {
        try
        {
            var result = await _service.GetCurrentUserTeamIdAsync();
            if (!result.Success)
            {
                _logger.LogWarning("Failed to get current user team ID. Reason: {Reason}", result.Message);
                return BadRequest(result);
            }

            _logger.LogInformation("Current user team ID retrieved.");
            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Exception during current user team ID retrieval. Error: {ErrorMessage}", errorMessage);
            return StatusCode(500, new ResponseBase { Success = false, Message = $"An error occurred while processing your request. {errorMessage}" });
        }
    }

    [HttpGet("notification-preferences")]
    public async Task<IActionResult> GetNotificationPreferences()
    {
        try
        {
            var result = await _service.GetNotificationPreferencesAsync();
            if (!result.Success)
            {
                _logger.LogWarning("Failed to get notification preferences for user {UserId}. Reason: {Reason}", HttpContext.User.GetUserId(), result.Message);
                return BadRequest(result);
            }

            _logger.LogInformation("Notification preferences retrieved for user {UserId}.", HttpContext.User.GetUserId());
            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Exception while retrieving notification preferences for user {UserId}. Error: {ErrorMessage}", HttpContext.User.GetUserId(), errorMessage);
            return StatusCode(500, new ResponseBase { Success = false, Message = $"An error occurred while processing your request. {errorMessage}" });
        }
    }

    [HttpPut("update-notification-preferences/{preferenceId}")]
    public async Task<IActionResult> UpdateNotificationPreference(long preferenceId, [FromBody] bool isEnabled)
    {
        try
        {
            var result = await _service.UpdateNotificationPreferenceAsync(preferenceId, isEnabled);
            if (!result.Success)
            {
                _logger.LogWarning("Failed to update notification preferences for user {UserId}. Reason: {Reason}", HttpContext.User.GetUserId(), result.Message);
                return BadRequest(result);
            }

            _logger.LogInformation("Notification preference {PreferenceId} updated to {IsEnabled}.", preferenceId, isEnabled);
            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Exception while updating notification preference {PreferenceId}", preferenceId);
            return StatusCode(500, new ResponseBase { Success = false, Message = $"An error occurred while processing your request. {errorMessage}" });
        }
    }

    [HttpPut("update-notification-preferences/bulk")]
    public async Task<IActionResult> UpdateNotificationPreferences([FromBody] BulkNotificationPreferenceUpdateRequest request)
    {
        try
        {
            var result = await _service.UpdateNotificationPreferencesAsync(request);
            if (!result.Success)
            {
                _logger.LogWarning("Failed to update bulk notification preferences. Reason: {Reason}", result.Message);
                return BadRequest(result);
            }

            _logger.LogInformation("Bulk notification preferences updated for {Count} preferences.", request.Preferences?.Count ?? 0);
            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Exception while updating bulk notification preferences");
            return StatusCode(500, new ResponseBase { Success = false, Message = $"An error occurred while processing your request. {errorMessage}" });
        }
    }

    [HttpPost("create-notification-preferences/bulk")]
    public async Task<IActionResult> CreateNotificationPreferences([FromBody] BulkNotificationPreferenceCreateRequest request)
    {
        try
        {
            var result = await _service.CreateNotificationPreferencesAsync(request);
            if (!result.Success)
            {
                _logger.LogWarning("Failed to create bulk notification preferences. Reason: {Reason}", result.Message);
                return BadRequest(result);
            }

            _logger.LogInformation("Bulk notification preferences created for {Count} preferences.", request.Preferences?.Count ?? 0);
            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Exception while creating bulk notification preferences");
            return StatusCode(500, new ResponseBase { Success = false, Message = $"An error occurred while processing your request. {errorMessage}" });
        }
    }

    [HttpGet("is-last-team-admin")]
    public async Task<IActionResult> IsLastTeamAdmin()
    {
        try
        {
            var result = await _service.IsLastTeamAdmin();
            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Exception while checking if user is last team admin");
            return StatusCode(500, new ResponseBase { Success = false, Message = $"An error occurred while processing your request. {errorMessage}" });
        }
    }
}