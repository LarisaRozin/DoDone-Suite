/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DoDone.Server.Services;
using System.Security.Claims;

namespace DoDone.Server.Examples;

/// <summary>
/// Example controller showing different ways to validate JWT tokens
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class JwtValidationExampleController : ControllerBase
{
    private readonly IJwtService _jwtService;

    public JwtValidationExampleController(IJwtService jwtService)
    {
        _jwtService = jwtService;
    }

    /// <summary>
    /// Method 1: Automatic validation using [Authorize] attribute
    /// This is the most common and recommended approach
    /// </summary>
    [HttpGet("protected-endpoint")]
    [Authorize] // This automatically validates the JWT token
    public IActionResult GetProtectedData()
    {
        // Token is automatically validated by ASP.NET Core middleware
        // You can access user claims through HttpContext.User
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var isAdmin = User.FindFirst("IsAdmin")?.Value;
        
        return Ok(new
        {
            Message = "Access granted",
            UserId = userId,
            UserName = userName,
            IsAdmin = isAdmin
        });
    }

    /// <summary>
    /// Method 2: Manual token validation using IJwtService
    /// Use this when you need custom validation logic
    /// </summary>
    [HttpPost("manual-validation")]
    public IActionResult ValidateTokenManually([FromBody] TokenValidationRequest request)
    {
        // Extract token from Authorization header or request body
        var token = request.Token ?? GetTokenFromHeader();
        
        if (string.IsNullOrEmpty(token))
        {
            return BadRequest("Token is required");
        }

        // Manual validation
        var isValid = _jwtService.ValidateToken(token, request.UserId);
        
        if (!isValid)
        {
            return Unauthorized("Invalid token");
        }

        // Get claims from token
        var principal = _jwtService.GetPrincipalFromToken(token);
        if (principal != null)
        {
            var claims = principal.Claims.ToDictionary(c => c.Type, c => c.Value);
            return Ok(new
            {
                Message = "Token is valid",
                Claims = claims
            });
        }

        return BadRequest("Could not extract claims from token");
    }

    /// <summary>
    /// Method 3: Check if token is expired
    /// </summary>
    [HttpPost("check-expiration")]
    public IActionResult CheckTokenExpiration([FromBody] TokenRequest request)
    {
        var token = request.Token ?? GetTokenFromHeader();
        
        if (string.IsNullOrEmpty(token))
        {
            return BadRequest("Token is required");
        }

        var isExpired = _jwtService.IsTokenExpired(token);
        
        return Ok(new
        {
            Token = token[..20] + "...", // Show first 20 chars for security
            IsExpired = isExpired,
            Message = isExpired ? "Token has expired" : "Token is still valid"
        });
    }

    /// <summary>
    /// Method 4: Role-based authorization
    /// </summary>
    [HttpGet("admin-only")]
    [Authorize]
    public IActionResult AdminOnlyEndpoint()
    {
        // Check if user is admin using claims
        var isAdminClaim = User.FindFirst("IsAdmin")?.Value;
        if (!bool.TryParse(isAdminClaim, out var isAdmin) || !isAdmin)
        {
            return Forbid("Admin access required");
        }

        return Ok(new { Message = "Welcome, admin!" });
    }

    /// <summary>
    /// Helper method to extract token from Authorization header
    /// </summary>
    private string? GetTokenFromHeader()
    {
        var authHeader = Request.Headers.Authorization.FirstOrDefault();
        if (authHeader != null && authHeader.StartsWith("Bearer "))
        {
            return authHeader.Substring("Bearer ".Length).Trim();
        }
        return null;
    }
}

/// <summary>
/// Request models for the example endpoints
/// </summary>
public class TokenValidationRequest
{
    public string? Token { get; set; }
    public long UserId { get; set; }
}

public class TokenRequest
{
    public string? Token { get; set; }
}
