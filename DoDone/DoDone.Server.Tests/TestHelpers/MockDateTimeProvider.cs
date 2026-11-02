/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using System;
using DoDone.Shared.Abstractions;

namespace DoDone.Server.Tests.TestHelpers
{
    public class MockDateTimeProvider : IDateTimeProvider
    {
        private DateTimeOffset? _utcNow;

        public void SetUtcNow(DateTimeOffset utcNow)
        {
            _utcNow = utcNow;
        }

        public DateTimeOffset UtcNow => _utcNow ?? DateTimeOffset.UtcNow;
    }
}