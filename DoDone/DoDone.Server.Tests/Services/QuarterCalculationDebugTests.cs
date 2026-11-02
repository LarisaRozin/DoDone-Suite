/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using System;
using Xunit;
using FluentAssertions;

namespace DoDone.Server.Tests.Services
{
    public class QuarterCalculationDebugTests
    {
        [Theory]
        [InlineData(1, 1)] // January -> Q1
        [InlineData(2, 1)] // February -> Q1  
        [InlineData(3, 1)] // March -> Q1
        [InlineData(4, 2)] // April -> Q2
        [InlineData(5, 2)] // May -> Q2
        [InlineData(6, 2)] // June -> Q2
        [InlineData(7, 3)] // July -> Q3
        [InlineData(8, 3)] // August -> Q3
        [InlineData(9, 3)] // September -> Q3
        [InlineData(10, 4)] // October -> Q4
        [InlineData(11, 4)] // November -> Q4
        [InlineData(12, 4)] // December -> Q4
        public void DebugQuarterCalculations(int month, int expectedQuarter)
        {
            // Current implementation (incorrect)
            var currentImpl = Math.Round((decimal)(month - 1) / 3 + 1);
            
            // Correct implementation options
            var correctImpl1 = (int)Math.Ceiling((double)month / 3);
            var correctImpl2 = (month - 1) / 3 + 1; // integer division
            
            Console.WriteLine($"Month {month}: Current={currentImpl}, Correct1={correctImpl1}, Correct2={correctImpl2}, Expected={expectedQuarter}");
            
            // Assert that at least one correct implementation gives the right answer
            (correctImpl1 == expectedQuarter || correctImpl2 == expectedQuarter).Should().BeTrue();
        }
    }
}
