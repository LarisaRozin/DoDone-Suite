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
//     public class TimezoneDebugTests
//     {
//         private readonly Mock<IDateTimeProvider> _mockDateTimeProvider;
        
//         public TimezoneDebugTests()
//         {
//             _mockDateTimeProvider = new Mock<IDateTimeProvider>();
//             // Set current time to March 15, 2024 12:00:00 UTC (Friday)
//             _mockDateTimeProvider.Setup(x => x.UtcNow)
//                 .Returns(new DateTimeOffset(2024, 3, 15, 12, 0, 0, TimeSpan.Zero));
//         }

//         [Theory]
//         [InlineData("America/New_York")]
//         [InlineData("Europe/London")]
//         [InlineData("Asia/Tokyo")]
//         public void Debug_WeeklyTimezones(string timezone)
//         {
//             // Arrange
//             var service = new RecurringDateService(_mockDateTimeProvider.Object);
//             var settings = new AllowanceRecurrenceSettings
//             {
//                 Type = AllowanceIntervalType.Weekly,
//                 Interval = 1,
//                 DayOfWeek = DayOfWeek.Sunday
//             };

//             // Act
//             var result = service.GetCurrentInterval(settings, timezone);

//             // Assert
//             Console.WriteLine($"{timezone} Weekly:");
//             Console.WriteLine($"  Start: {result.calculatedStartAt:yyyy-MM-dd HH:mm:ss} UTC");
//             Console.WriteLine($"  End:   {result.calculatedEndAt:yyyy-MM-dd HH:mm:ss} UTC");
//         }

//         [Theory]
//         [InlineData("America/New_York")]
//         [InlineData("Europe/London")]
//         [InlineData("Asia/Tokyo")]
//         public void Debug_MonthlyTimezones(string timezone)
//         {
//             // Arrange
//             var service = new RecurringDateService(_mockDateTimeProvider.Object);
//             var settings = new AllowanceRecurrenceSettings
//             {
//                 Type = AllowanceIntervalType.Monthly,
//                 Interval = 1
//             };

//             // Act
//             var result = service.GetCurrentInterval(settings, timezone);

//             // Assert
//             Console.WriteLine($"{timezone} Monthly:");
//             Console.WriteLine($"  Start: {result.calculatedStartAt:yyyy-MM-dd HH:mm:ss} UTC");
//             Console.WriteLine($"  End:   {result.calculatedEndAt:yyyy-MM-dd HH:mm:ss} UTC");
//         }

//         [Fact]
//         public void Debug_ExceptionDetails()
//         {
//             // Arrange
//             var service = new RecurringDateService(_mockDateTimeProvider.Object);
//             var settings = new AllowanceRecurrenceSettings
//             {
//                 Type = (AllowanceIntervalType)999,
//                 Interval = 1
//             };

//             // Act & Assert
//             try
//             {
//                 service.GetCurrentInterval(settings, "UTC");
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"Exception Type: {ex.GetType().Name}");
//                 Console.WriteLine($"ParamName: {(ex as ArgumentOutOfRangeException)?.ParamName ?? "N/A"}");
//                 Console.WriteLine($"Message: {ex.Message}");
//             }
//         }
//     }
// }
