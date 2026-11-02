/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Microsoft.AspNetCore.Mvc;
using DoDone.Server.Services.Common;

namespace DoDone.Server.Controllers;

[Route("api/[controller]")]
public class DiagnosticsController : ControllerBase
{
    private readonly IConnectionPoolMonitorService _connectionMonitor;
    private readonly ILogger<DiagnosticsController> _logger;

    public DiagnosticsController(IConnectionPoolMonitorService connectionMonitor, ILogger<DiagnosticsController> logger)
    {
        _connectionMonitor = connectionMonitor;
        _logger = logger;
    }

    [HttpGet("connection-pool")]
    public async Task<IActionResult> GetConnectionPoolStats()
    {
        try
        {
            var stats = await _connectionMonitor.GetConnectionPoolStatsAsync();
            return Ok(new
            {
                timestamp = stats.Timestamp,
                connections = new
                {
                    active = stats.ActiveConnections,
                    idle = stats.IdleConnections,
                    total = stats.TotalConnections,
                    maxPoolSize = stats.MaxPoolSize,
                    minPoolSize = stats.MinPoolSize,
                    utilizationPercentage = Math.Round(stats.PoolUtilizationPercentage, 2)
                },
                status = stats.PoolUtilizationPercentage > 90 ? "Critical" :
                        stats.PoolUtilizationPercentage > 70 ? "Warning" : "Healthy"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get connection pool stats");
            return StatusCode(500, new { error = "Failed to retrieve connection pool statistics" });
        }
    }

    [HttpGet("health")]
    public IActionResult GetHealth()
    {
        return Ok(new
        {
            status = "Healthy",
            timestamp = DateTime.UtcNow,
            version = System.Reflection.Assembly.GetExecutingAssembly().GetName().Version?.ToString(),
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
        });
    }
}