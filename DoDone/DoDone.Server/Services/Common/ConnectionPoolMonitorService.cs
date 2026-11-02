/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Text.RegularExpressions;

namespace DoDone.Server.Services.Common;

public class ConnectionPoolMonitorService : IConnectionPoolMonitorService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ConnectionPoolMonitorService> _logger;
    private readonly string _connectionString;
    private DateTime _lastFailureTime = DateTime.MinValue;
    private int _consecutiveFailures = 0;
    private const int MAX_CONSECUTIVE_FAILURES = 3;
    private const int CIRCUIT_BREAKER_MINUTES = 2;

    public ConnectionPoolMonitorService(IConfiguration configuration, ILogger<ConnectionPoolMonitorService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _connectionString = _configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task LogConnectionPoolStatsAsync()
    {
        try
        {
            var stats = await GetConnectionPoolStatsAsync();
            
            if (stats.PoolUtilizationPercentage > 80)
            {
                _logger.LogWarning("High connection pool utilization: {Utilization:F1}% ({Total}/{Max} connections). Active: {Active}, Idle: {Idle}",
                    stats.PoolUtilizationPercentage, stats.TotalConnections, stats.MaxPoolSize, stats.ActiveConnections, stats.IdleConnections);
            }
            else if (stats.PoolUtilizationPercentage > 60)
            {
                _logger.LogInformation("Connection pool utilization: {Utilization:F1}% ({Total}/{Max} connections). Active: {Active}, Idle: {Idle}",
                    stats.PoolUtilizationPercentage, stats.TotalConnections, stats.MaxPoolSize, stats.ActiveConnections, stats.IdleConnections);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log connection pool stats");
        }
    }

    public async Task<ConnectionPoolStats> GetConnectionPoolStatsAsync()
    {
        var stats = new ConnectionPoolStats();
        
        // Circuit breaker: if we've had too many consecutive failures recently, skip this attempt
        if (_consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && 
            DateTime.UtcNow - _lastFailureTime < TimeSpan.FromMinutes(CIRCUIT_BREAKER_MINUTES))
        {
            _logger.LogDebug("Circuit breaker active - skipping connection pool stats query");
            
            // Return basic stats from connection string
            var connectionStringBuilder = new NpgsqlConnectionStringBuilder(_connectionString);
            stats.MaxPoolSize = connectionStringBuilder.MaxPoolSize;
            stats.MinPoolSize = connectionStringBuilder.MinPoolSize;
            stats.ActiveConnections = 0;
            stats.IdleConnections = 0;
            return stats;
        }
        
        try
        {
            // Parse connection string for pool settings
            var connectionStringBuilder = new NpgsqlConnectionStringBuilder(_connectionString);
            stats.MaxPoolSize = connectionStringBuilder.MaxPoolSize;
            stats.MinPoolSize = connectionStringBuilder.MinPoolSize;

            // Query PostgreSQL for connection information with timeout
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                SELECT 
                    COALESCE(state, 'unknown') as state,
                    COUNT(*) as connection_count
                FROM pg_stat_activity 
                WHERE datname = current_database() 
                    AND usename = current_user
                    AND pid != pg_backend_pid()  -- Exclude current connection
                GROUP BY state
                UNION ALL
                SELECT 'total' as state, COUNT(*) as connection_count
                FROM pg_stat_activity 
                WHERE datname = current_database() 
                    AND usename = current_user
                    AND pid != pg_backend_pid()";

            using var command = new NpgsqlCommand(query, connection);
            command.CommandTimeout = 5; // 5 second timeout to avoid blocking during high load
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                var state = reader.IsDBNull(0) ? null : reader.GetString(0);
                var count = reader.GetInt32(1);

                switch (state?.ToLower())
                {
                    case "active":
                        stats.ActiveConnections = count;
                        break;
                    case "idle":
                        stats.IdleConnections = count;
                        break;
                    case "idle in transaction":
                    case "idle in transaction (aborted)":
                        stats.ActiveConnections += count; // Treat as active
                        break;
                    case "unknown":
                        // Handle previously NULL state - these are usually system connections or connections in transition
                        _logger.LogDebug("Found {Count} connections with unknown state (likely system or transitional connections)", count);
                        stats.IdleConnections += count; // Conservatively count as idle
                        break;
                    case "total":
                        // Skip total count in this switch - we calculate it ourselves
                        break;
                    default:
                        // Handle any other unexpected states
                        _logger.LogDebug("Found {Count} connections with unexpected state '{State}'", count, state);
                        stats.ActiveConnections += count; // Conservatively treat as active
                        break;
                }
            }
            
            // Success - reset circuit breaker
            _consecutiveFailures = 0;
        }
        catch (Exception ex)
        {
            // Track failures for circuit breaker
            _consecutiveFailures++;
            _lastFailureTime = DateTime.UtcNow;
            
            _logger.LogError(ex, "Failed to get connection pool stats from database (failure #{FailureCount})", _consecutiveFailures);
            
            // Provide fallback values instead of -1 to avoid breaking monitoring
            stats.ActiveConnections = 0;
            stats.IdleConnections = 0;
            
            // Try to provide some basic info even when query fails
            try
            {
                using var fallbackConnection = new NpgsqlConnection(_connectionString);
                await fallbackConnection.OpenAsync();
                
                // If we can at least connect, show minimal stats
                stats.ActiveConnections = 1; // At least this connection is active
                stats.IdleConnections = 0;
                
                _logger.LogWarning("Using fallback connection pool stats due to query failure");
            }
            catch (Exception fallbackEx)
            {
                _logger.LogError(fallbackEx, "Fallback connection also failed - database may be unavailable");
                // Keep stats at 0,0 to indicate complete failure
            }
        }

        return stats;
    }
}