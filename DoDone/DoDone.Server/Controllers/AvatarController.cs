/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DoDone.Server.Services;
using DoDone.Server.Extensions;

namespace DoDone.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AvatarController : ControllerBase
{
    private readonly IAvatarService _avatarService;
    private readonly ILogger<AvatarController> _logger;

    public AvatarController(IAvatarService avatarService, ILogger<AvatarController> logger)
    {
        _avatarService = avatarService;
        _logger = logger;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            // Validate file type
            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
            {
                return BadRequest("Only image files (JPEG, PNG, GIF) are allowed");
            }

            // Validate file size (e.g., 5MB max)
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest("File size must be less than 5MB");
            }

            var currentUserId = User.GetUserId();
            var result = await _avatarService.UploadAvatarAsync(currentUserId, file);

            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            _logger.LogInformation("Avatar uploaded successfully for user {UserId}", currentUserId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading avatar");
            return StatusCode(500, "An error occurred while uploading the avatar");
        }
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteAvatar()
    {
        try
        {
            var currentUserId = User.GetUserId();
            var result = await _avatarService.DeleteAvatarAsync(currentUserId);

            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            _logger.LogInformation("Avatar deleted successfully for user {UserId}", currentUserId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting avatar");
            return StatusCode(500, "An error occurred while deleting the avatar");
        }
    }

    [HttpGet("{fileName}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvatar(string fileName)
    {
        try
        {
            var result = await _avatarService.GetAvatarAsync(fileName);
            
            if (result.FileStream == null)
            {
                return NotFound();
            }

            return File(result.FileStream, result.ContentType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving avatar {FileName}", fileName);
            return NotFound();
        }
    }
}
