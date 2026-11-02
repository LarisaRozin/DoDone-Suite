/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Server.Attributes;
using DoDone.Server.Dtos;
using DoDone.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace DoDone.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public partial class AuthController : ControllerBase
{
    private readonly IAuthService _service;
    private readonly ILogger<AuthController> _logger;
    private readonly ICurrentUserService _currentUserService;

    public AuthController(IAuthService service, ILogger<AuthController> logger, ICurrentUserService currentUserService)
    {
        _service = service;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest dto)
    {
        try
        {
            var response = await _service.RegisterAsync(dto);
            if (!response.Success)
            {
                _logger.LogWarning("Registration failed for user {UserName}: {Message}", dto?.UserName, response.Message);
                return BadRequest(response);
            }

            _logger.LogInformation("User {UserName} registered.", dto?.UserName);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception during registration for user {UserName}", dto?.UserName);
            return StatusCode(500, new ResponseBase { Success = false, Message = $"An error occurred while processing your request. {ex.Message}" });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _service.LoginAsync(request);
            if (!response.Success)
            {
                _logger.LogWarning("Login failed for user {UserName}: {Message}", request?.UserName, response.Message);
                return Unauthorized(response);
            }

            _logger.LogInformation("User {UserName} login success.", request?.UserName);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception during login for user {UserName}", request?.UserName);
            return StatusCode(500, new ResponseBase { Success = false, Message = $"An error occurred during login. {ex.Message}" });
        }
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            var response = await _service.ForgotPasswordAsync(request);
            if (!response.Success)
            {
                _logger.LogWarning("Password reset initiation failed for email {Email}: {Message}", request?.Email, response.Message);
                return BadRequest(response);
            }

            _logger.LogInformation("Password reset initiated for email {Email}.", request?.Email);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception during password reset for email {Email}", request?.Email);
            return StatusCode(500, new ResponseBase { Success = false, Message = $"An error occurred during password reset. {ex.Message}" });
        }
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            var response = await _service.ResetPasswordAsync(request);
            if (!response.Success)
            {
                _logger.LogWarning("Password reset failed for user {UserName}: {Message}", _currentUserService.UserName, response.Message);
                return BadRequest(response);
            }

            _logger.LogInformation("Password reset successful for user {UserName}.", _currentUserService.UserName);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception during password reset for user {UserName}", _currentUserService.UserName);
            return StatusCode(500, new ResponseBase { Success = false, Message = $"An error occurred during password reset. {ex.Message}" });
        }
    }

    [HttpPost("send-password-reset-email")]
    [RequireAdmin]
    public async Task<IActionResult> SendPasswordResetEmailForUser([FromBody] SendPasswordResetEmailRequestForUser request)
    {
        try
        {
            var response = await _service.SendPasswordResetEmailForUserAsync(request);
            if (!response.Success)
            {
                _logger.LogWarning("Password reset email sending failed for user {UserName}: {Message}", _currentUserService.UserName, response.Message);
                return BadRequest(response);
            }

            _logger.LogInformation("Password reset email sent to user {UserName}.", _currentUserService.UserName);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception during sending password reset email for user {UserName}", _currentUserService.UserName);
            return StatusCode(500, new ResponseBase { Success = false, Message = $"An error occurred during sending password reset email. {ex.Message}" });
        }
    }
}