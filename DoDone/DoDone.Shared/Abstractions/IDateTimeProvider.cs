/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Shared.Abstractions;

public interface IDateTimeProvider
{
    DateTimeOffset UtcNow { get; }
}
