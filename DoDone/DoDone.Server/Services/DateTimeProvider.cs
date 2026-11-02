/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Abstractions;
using Microsoft.Extensions.Configuration;

namespace DoDone.Server.Services;

public class DateTimeProvider : IDateTimeProvider
{
    private readonly DateTimeOffset? _overrideUtcNow;

    public DateTimeProvider(IConfiguration configuration)
    {
        // Only allow time override in development environment for safety
        if (configuration["ASPNETCORE_ENVIRONMENT"] == "Development" || configuration["ASPNETCORE_ENVIRONMENT"] == "development")
        {
            var overrideTimeString = configuration["TestSettings:OverrideUtcNow"];
            if (!string.IsNullOrEmpty(overrideTimeString) && DateTimeOffset.TryParse(overrideTimeString, out var overrideTime))
            {
                _overrideUtcNow = overrideTime;
            }
        }
    }

    public DateTimeOffset UtcNow => _overrideUtcNow ?? DateTimeOffset.UtcNow;
}
