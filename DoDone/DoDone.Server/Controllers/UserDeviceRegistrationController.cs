/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Server.Dtos;
using DoDone.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoDone.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] 
public class UserDeviceRegistrationController : ControllerBase
{
    private readonly IUserDeviceRegistrationService _userDeviceRegistrationService;
    private readonly ILogger<UserDeviceRegistrationController> _logger;

    public UserDeviceRegistrationController(
        IUserDeviceRegistrationService userDeviceRegistrationService,
        ILogger<UserDeviceRegistrationController> logger)
    {
        _userDeviceRegistrationService = userDeviceRegistrationService;
        _logger = logger;
    }

    [HttpPost("register-device")]
    public async Task<IActionResult> RegisterDevice([FromBody] DeviceRegistrationRequest request)
    {
        try
        {
            await _userDeviceRegistrationService.RegisterDeviceAsync(request);

            return Ok(new ResponseBase { Message = "Device registered successfully", Success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering device");
            return StatusCode(500, new ResponseBase { Message = "Error registering device", Success = false });
        }
    }

    [HttpPost("unregister-device/{fcmToken}")]
    public async Task<IActionResult> UnregisterDevice(string fcmToken)
    {
        try
        {
            await _userDeviceRegistrationService.UnregisterDeviceAsync(fcmToken);

            return Ok(new ResponseBase { Message = "Device unregistered successfully", Success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unregistering device");
            return StatusCode(500, new ResponseBase { Message = "Error unregistering device", Success = false });
        }
    }

    // [HttpPost("update-preferences")]
    // public async Task<IActionResult> UpdatePreferences([FromBody] NotificationPreferencesRequest request)
    // {
    //     try
    //     {
    //         var preferences = await _context.NotificationPreferences
    //             .FirstOrDefaultAsync(p => p.UserId == request.UserId);

    //         if (preferences == null)
    //         {
    //             preferences = new NotificationPreferences { UserId = request.UserId };
    //             _context.NotificationPreferences.Add(preferences);
    //         }

    //         preferences.TaskAssigned = request.TaskAssigned;
    //         preferences.TaskCompleted = request.TaskCompleted;
    //         preferences.TaskDueSoon = request.TaskDueSoon;
    //         preferences.TaskOverdue = request.TaskOverdue;
    //         preferences.TeamUpdates = request.TeamUpdates;
    //         preferences.WeeklyDigest = request.WeeklyDigest;
    //         preferences.UpdatedAt = DateTime.UtcNow;

    //         await _context.SaveChangesAsync();

    //         return Ok(new { message = "Preferences updated successfully" });
    //     }
    //     catch (Exception ex)
    //     {
    //         _logger.LogError(ex, "Error updating preferences");
    //         return StatusCode(500, new { message = "Error updating preferences" });
    //     }
    // }

    // [HttpGet("preferences/{userId}")]
    // public async Task<IActionResult> GetPreferences(string userId)
    // {
    //     try
    //     {
    //         var preferences = await _context.NotificationPreferences
    //             .FirstOrDefaultAsync(p => p.UserId == userId);

    //         if (preferences == null)
    //         {
    //             // Return default preferences
    //             preferences = new NotificationPreferences
    //             {
    //                 UserId = userId,
    //                 TaskAssigned = true,
    //                 TaskCompleted = true,
    //                 TaskDueSoon = true,
    //                 TaskOverdue = true,
    //                 TeamUpdates = true,
    //                 WeeklyDigest = true
    //             };
    //         }

    //         var response = new NotificationPreferencesResponse
    //         {
    //             UserId = preferences.UserId,
    //             TaskAssigned = preferences.TaskAssigned,
    //             TaskCompleted = preferences.TaskCompleted,
    //             TaskDueSoon = preferences.TaskDueSoon,
    //             TaskOverdue = preferences.TaskOverdue,
    //             TeamUpdates = preferences.TeamUpdates,
    //             WeeklyDigest = preferences.WeeklyDigest
    //         };

    //         return Ok(response);
    //     }
    //     catch (Exception ex)
    //     {
    //         _logger.LogError(ex, "Error getting preferences");
    //         return StatusCode(500, new { message = "Error getting preferences" });
    //     }
    // }
}

// [ApiController]
// [Authorize]
// [Route("api/[controller]")]
// public partial class NotificationsController : ControllerBase
// {
//     private readonly INotificationsService _notificationsService;

//     public NotificationsController(INotificationsService notificationsService)
//     {
//         _notificationsService = notificationsService;
//     }

//     [HttpPost("register-device")]
//     public async Task<IActionResult> RegisterDevice([FromBody] DeviceRegistrationRequest request)
//     {
//         if (request == null)
//         {
//             return BadRequest("Invalid device registration request");
//         }

//         var userId = User.GetUserId(); // Assuming you have an extension method to get user ID from claims
//         var response = await _notificationsService.RegisterDeviceAsync(request, userId);

//         if (response.Success)
//         {
//             return Ok(response);
//         }

//         return BadRequest(response.Message);
//     }

// }
