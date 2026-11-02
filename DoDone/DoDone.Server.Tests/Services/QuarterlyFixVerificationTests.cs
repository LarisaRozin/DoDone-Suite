// /*
//  * Copyright (c) 2025 LarisaRozin
//  * DoDone - Task Management, Allowance & Bonus Tracking Application
//  * All rights reserved.
//  */
// using System;
// using Xunit;
// using FluentAssertions;
// using Moq;
// using DoDone.Shared.Abstractions;
// using DoDone.Shared.Enums;
// using DoDone.Server.Services;

// namespace DoDone.Server.Tests.Services
// {
//     public class QuarterlyFixVerificationTests
//     {
//         [Theory]
//         [InlineData(1, 1)]  // January -> Q1
//         [InlineData(2, 1)]  // February -> Q1  
//         [InlineData(3, 1)]  // March -> Q1 (was broken)
//         [InlineData(4, 2)]  // April -> Q2
//         [InlineData(5, 2)]  // May -> Q2
//         [InlineData(6, 2)]  // June -> Q2 (was broken)
//         [InlineData(7, 3)]  // July -> Q3
//         [InlineData(8, 3)]  // August -> Q3
//         [InlineData(9, 3)]  // September -> Q3 (was broken)
//         [InlineData(10, 4)] // October -> Q4
//         [InlineData(11, 4)] // November -> Q4
//         [InlineData(12, 4)] // December -> Q4 (was throwing exception)
//         public void QuarterCalculation_ShouldWorkForAllMonths(int month, int expectedQuarter)
//         {
//             // Arrange
//             var mockDateTimeProvider = new Mock<IDateTimeProvider>();
//             mockDateTimeProvider.Setup(x => x.UtcNow)
//                 .Returns(new DateTimeOffset(2024, month, 15, 12, 0, 0, TimeSpan.Zero));
            
//             var service = new RecurringDateService(mockDateTimeProvider.Object);
//             var settings = new AllowanceRecurrenceSettings
//             {
//                 Type = AllowanceIntervalType.Quarterly,
//                 Interval = 1
//             };

//             // Act
//             var result = service.GetCurrentInterval(settings, "UTC");

//             // Assert - Verify quarter calculation is correct
//             var quarterStartMonth = expectedQuarter switch
//             {
//                 1 => 1,   // Q1: Jan-Mar
//                 2 => 4,   // Q2: Apr-Jun
//                 3 => 7,   // Q3: Jul-Sep
//                 4 => 10,  // Q4: Oct-Dec
//                 _ => throw new ArgumentOutOfRangeException()
//             };
            
//             result.calculatedStartAt.Month.Should().Be(quarterStartMonth,
//                 $"Month {month} should be in Q{expectedQuarter} which starts in month {quarterStartMonth}");
            
//             var quarterEndMonth = expectedQuarter switch
//             {
//                 1 => 3,   // Q1 ends in March
//                 2 => 6,   // Q2 ends in June  
//                 3 => 9,   // Q3 ends in September
//                 4 => 12,  // Q4 ends in December
//                 _ => throw new ArgumentOutOfRangeException()
//             };
            
//             result.calculatedEndAt.Month.Should().Be(quarterEndMonth,
//                 $"Month {month} should be in Q{expectedQuarter} which ends in month {quarterEndMonth}");
//         }

//         [Fact] 
//         public void December_ShouldNotThrowException()
//         {
//             // This specifically tests that December no longer throws an exception
            
//             // Arrange
//             var mockDateTimeProvider = new Mock<IDateTimeProvider>();
//             mockDateTimeProvider.Setup(x => x.UtcNow)
//                 .Returns(new DateTimeOffset(2024, 12, 15, 12, 0, 0, TimeSpan.Zero));
            
//             var service = new RecurringDateService(mockDateTimeProvider.Object);
//             var settings = new AllowanceRecurrenceSettings
//             {
//                 Type = AllowanceIntervalType.Quarterly,
//                 Interval = 1
//             };

//             // Act & Assert - Should not throw
//             Action act = () => service.GetCurrentInterval(settings, "UTC");
//             act.Should().NotThrow("December should be handled correctly and map to Q4");
            
//             var result = service.GetCurrentInterval(settings, "UTC");
//             result.calculatedStartAt.Should().Be(new DateTimeOffset(2024, 10, 1, 0, 0, 0, TimeSpan.Zero));
//             result.calculatedEndAt.Should().Be(new DateTimeOffset(2024, 12, 31, 23, 59, 59, TimeSpan.Zero));
//         }
//     }
// }
