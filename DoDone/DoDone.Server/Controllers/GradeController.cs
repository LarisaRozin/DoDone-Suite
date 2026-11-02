/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoDone.Server.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public partial class GradeController : ControllerBase
{
    private readonly IGradesService _gradesService;
    private readonly ILogger<GradeController> _logger;

    public GradeController(IGradesService gradesService, ILogger<GradeController> logger)
    {
        _gradesService = gradesService;
        _logger = logger;
    }

    [HttpGet("list")]
    public async Task<IActionResult> GetGradesList()
    {
        var response = await _gradesService.GetListAsync();
        if (response.Success)
        {
            return Ok(response);
        }
        _logger.LogError("Failed to retrieve grades list: {Message}", response.Message);
        return BadRequest(response.Message);
    }
}
