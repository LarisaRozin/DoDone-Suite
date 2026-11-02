/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace DoDone.Server.Controllers;

[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet("simple")]
    [AllowAnonymous]
    public IActionResult Simple()
    {
        try
        {
            return Ok(new { 
                Message = "Simple test working!", 
                Timestamp = DateTime.UtcNow,
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                MachineName = Environment.MachineName
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { 
                Error = ex.Message, 
                StackTrace = ex.StackTrace
            });
        }
    }

    [HttpGet("ping")]
    [AllowAnonymous]
    public IActionResult Ping()
    {
        return Ok("pong");
    }
}