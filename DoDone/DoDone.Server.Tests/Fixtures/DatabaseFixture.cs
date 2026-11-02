/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using System;
using DoDone.Shared.Abstractions;

namespace DoDone.Server.Tests.Fixtures
{
    public class DatabaseFixture
    {
        private readonly IDateTimeProvider _dateTimeProvider;

        public DatabaseFixture(IDateTimeProvider dateTimeProvider)
        {
            _dateTimeProvider = dateTimeProvider;
        }

        // Example method that uses _dateTimeProvider
        public DateTimeOffset GetCurrentUtcTime()
        {
            return _dateTimeProvider.UtcNow;
        }

        // Other methods that interact with AllowanceHistoryService
    }
}