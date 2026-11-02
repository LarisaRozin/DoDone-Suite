/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Server.Services.Common;

public interface IConnectionPoolMonitorService
{
    Task LogConnectionPoolStatsAsync();
    Task<ConnectionPoolStats> GetConnectionPoolStatsAsync();
}

public class ConnectionPoolStats
{
    public int ActiveConnections { get; set; }
    public int IdleConnections { get; set; }
    public int TotalConnections => ActiveConnections + IdleConnections;
    public int MaxPoolSize { get; set; }
    public int MinPoolSize { get; set; }
    public double PoolUtilizationPercentage => MaxPoolSize > 0 ? (double)TotalConnections / MaxPoolSize * 100 : 0;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}