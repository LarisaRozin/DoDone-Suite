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
//     public class RecurringDateServiceTests
//     {
//         private readonly Mock<IDateTimeProvider> _mockDateTimeProvider;
//         private readonly RecurringDateService _service;

//         public RecurringDateServiceTests()
//         {
//             _mockDateTimeProvider = new Mock<IDateTimeProvider>();
//             // Set current time to March 15, 2024 12:00:00 UTC (Friday)
//             _mockDateTimeProvider.Setup(x => x.UtcNow)
//                 .Returns(new DateTimeOffset(2024, 3, 15, 12, 0, 0, TimeSpan.Zero));
            
//             _service = new RecurringDateService(_mockDateTimeProvider.Object);
//         }

//         #region Weekly Interval Tests

//         [Theory]
//         [InlineData(DayOfWeek.Monday, 1, "2024-03-11T00:00:00Z", "2024-03-17T23:59:59Z")]
//         [InlineData(DayOfWeek.Tuesday, 1, "2024-03-12T00:00:00Z", "2024-03-18T23:59:59Z")]
//         [InlineData(DayOfWeek.Wednesday, 1, "2024-03-13T00:00:00Z", "2024-03-19T23:59:59Z")]
//         [InlineData(DayOfWeek.Thursday, 1, "2024-03-14T00:00:00Z", "2024-03-20T23:59:59Z")]
//         [InlineData(DayOfWeek.Friday, 1, "2024-03-15T00:00:00Z", "2024-03-21T23:59:59Z")] // Same day as test date
//         [InlineData(DayOfWeek.Saturday, 1, "2024-03-16T00:00:00Z", "2024-03-22T23:59:59Z")]
//         [InlineData(DayOfWeek.Sunday, 1, "2024-03-10T00:00:00Z", "2024-03-16T23:59:59Z")]
//         [InlineData(DayOfWeek.Monday, 2, "2024-03-11T00:00:00Z", "2024-03-24T23:59:59Z")] // 2 weeks
//         [InlineData(DayOfWeek.Monday, 3, "2024-03-11T00:00:00Z", "2024-03-31T23:59:59Z")] // 3 weeks
//         public void GetInterval_Weekly_CalculatesCorrectly(DayOfWeek startDay, int interval, string expectedStart, string expectedEnd)
//         {
//             // Arrange
//             var settings = new AllowanceRecurrenceSettings
//             {
//                 Type = AllowanceIntervalType.Weekly,
//                 Interval = interval,
//                 DayOfWeek = startDay
//             };

//             // Act
//             var result = _service.GetCurrentInterval(settings, "UTC");

//             // Assert
//             result.calculatedStartAt.Should().Be(DateTimeOffset.Parse(expectedStart), 
//                 "weekly interval should start on the specified day of the current week");
//             result.calculatedEndAt.Should().Be(DateTimeOffset.Parse(expectedEnd), 
//                 $"weekly interval should end {interval} week(s) later minus 1 microsecond");
//         }

//         [Fact]
//         public void GetInterval_Weekly_WithoutDayOfWeek_DefaultsToSunday()
//         {
//             // Arrange
//             var settings = new AllowanceRecurrenceSettings
//             {
//                 Type = AllowanceIntervalType.Weekly,
//                 Interval = 1,
//                 DayOfWeek = null // Default to Sunday
//             };

//             // Act
//             var result = _service.GetCurrentInterval(settings, "UTC");

//             // Assert
//             result.calculatedStartAt.Should().Be(new DateTimeOffset(2024, 3, 10, 0, 0, 0, TimeSpan.Zero),
//                 "should default to Sunday when DayOfWeek is null");
//             result.calculatedEndAt.Should().Be(new DateTimeOffset(2024, 3, 16, 23, 59, 59, TimeSpan.Zero),
//                 "should end 1 week later");
//         }

//         #endregion

//         #region Monthly Interval Tests

//         [Theory]
//         [InlineData(1, "2024-03-01T00:00:00Z", "2024-03-31T23:59:59Z")] // 1 month
//         [InlineData(2, "2024-03-01T00:00:00Z", "2024-04-30T23:59:59Z")] // 2 months
//         [InlineData(3, "2024-03-01T00:00:00Z", "2024-05-31T23:59:59Z")] // 3 months
//         public void GetInterval_Monthly_CalculatesCorrectly(int interval, string expectedStart, string expectedEnd)
//         {
//             // Arrange
//             var settings = new AllowanceRecurrenceSettings
//             {
//                 Type = AllowanceIntervalType.Monthly,
//                 Interval = interval
//             };

//             // Act
//             var result = _service.GetCurrentInterval(settings, "UTC");

//             // Assert
//             result.calculatedStartAt.Should().Be(DateTimeOffset.Parse(expectedStart),
//                 "monthly interval should start on the 1st of the current month");
//             result.calculatedEndAt.Should().Be(DateTimeOffset.Parse(expectedEnd),
//                 $"monthly interval should end {interval} month(s) later minus 1 microsecond");
//         }

//         [Theory]
//         [InlineData("2024-01-15T12:00:00Z", 1, "2024-01-01T00:00:00Z", "2024-01-31T23:59:59Z")] // January
//         [InlineData("2024-02-15T12:00:00Z", 1, "2024-02-01T00:00:00Z", "2024-02-29T23:59:59Z")] // February (leap year)
//         [InlineData("2024-04-15T12:00:00Z", 1, "2024-04-01T00:00:00Z", "2024-04-30T23:59:59Z")] // April (30 days)
//         [InlineData("2023-02-15T12:00:00Z", 1, "2023-02-01T00:00:00Z", "2023-02-28T23:59:59Z")] // February (non-leap year)
//         public void GetInterval_Monthly_HandlesMonthLengthsCorrectly(string testDateStr, int interval, string expectedStart, string expectedEnd)
//         {
//             // Arrange
//             var testDate = DateTimeOffset.Parse(testDateStr);
//             _mockDateTimeProvider.Setup(x => x.UtcNow).Returns(testDate);
//             var service = new RecurringDateService(_mockDateTimeProvider.Object);

//             var settings = new AllowanceRecurrenceSettings
//             {
//                 Type = AllowanceIntervalType.Monthly,
//                 Interval = interval
//             };

//             // Act
//             var result = service.GetCurrentInterval(settings, "UTC");

//             // Assert
//             result.calculatedStartAt.Should().Be(DateTimeOffset.Parse(expectedStart));
//             result.calculatedEndAt.Should().Be(DateTimeOffset.Parse(expectedEnd));
//         }

//         #endregion

//         #region Quarterly Interval Tests - Expected Correct Behavior

//         [Theory]
//         [InlineData("2024-01-15T00:00:00Z", "2024-01-01T00:00:00Z", "2024-03-31T23:59:59Z")] // Jan -> Q1
//         [InlineData("2024-02-15T00:00:00Z", "2024-01-01T00:00:00Z", "2024-03-31T23:59:59Z")] // Feb -> Q1
//         [InlineData("2024-03-15T00:00:00Z", "2024-01-01T00:00:00Z", "2024-03-31T23:59:59Z")] // Mar -> Q1 (currently fails - implementation gives Q2)
//         [InlineData("2024-04-15T00:00:00Z", "2024-04-01T00:00:00Z", "2024-06-30T23:59:59Z")] // Apr -> Q2
//         [InlineData("2024-05-15T00:00:00Z", "2024-04-01T00:00:00Z", "2024-06-30T23:59:59Z")] // May -> Q2
//         [InlineData("2024-06-15T00:00:00Z", "2024-04-01T00:00:00Z", "2024-06-30T23:59:59Z")] // Jun -> Q2 (currently fails - implementation gives Q3)
//         [InlineData("2024-07-15T00:00:00Z", "2024-07-01T00:00:00Z", "2024-09-30T23:59:59Z")] // Jul -> Q3
//         [InlineData("2024-08-15T00:00:00Z", "2024-07-01T00:00:00Z", "2024-09-30T23:59:59Z")] // Aug -> Q3
//         [InlineData("2024-09-15T00:00:00Z", "2024-07-01T00:00:00Z", "2024-09-30T23:59:59Z")] // Sep -> Q3 (currently fails - implementation gives Q4)
//         [InlineData("2024-10-15T00:00:00Z", "2024-10-01T00:00:00Z", "2024-12-31T23:59:59Z")] // Oct -> Q4
//         [InlineData("2024-11-15T00:00:00Z", "2024-10-01T00:00:00Z", "2024-12-31T23:59:59Z")] // Nov -> Q4
//         [InlineData("2024-12-15T00:00:00Z", "2024-10-01T00:00:00Z", "2024-12-31T23:59:59Z")] // Dec -> Q4 (currently throws exception)
//         public void GetInterval_Quarterly_ShouldCalculateCorrectQuarters(string testDateStr, string expectedStart, string expectedEnd)
//         {
//             // This test defines the CORRECT behavior that the implementation should have
//             // Currently fails for Mar, Jun, Sep, and Dec due to bugs in the implementation
//             //
//             // BUG: The quarter calculation uses: Math.Round((decimal)(localNow.Month - 1) / 3 + 1)
//             // FIX: Should use: (int)Math.Ceiling((double)localNow.Month / 3)
//             // 
//             // Current wrong results:
//             // - March (month 3): returns 2 (Q2) instead of 1 (Q1)
//             // - June (month 6): returns 3 (Q3) instead of 2 (Q2)  
//             // - September (month 9): returns 4 (Q4) instead of 3 (Q3)
//             // - December (month 12): returns 5, causing ArgumentOutOfRangeException
            
//             // Arrange
//             var testDate = DateTimeOffset.Parse(testDateStr);
//             _mockDateTimeProvider.Setup(x => x.UtcNow).Returns(testDate);
//             var service = new RecurringDateService(_mockDateTimeProvider.Object);

//             var settings = new AllowanceRecurrenceSettings
//             {
//                 Type = AllowanceIntervalType.Quarterly,
//                 Interval = 1
//             };

//             // Act
//             var result = service.GetCurrentInterval(settings, "UTC");

//             // Assert - Testing for correct behavior, will fail with current buggy implementation
//             result.calculatedStartAt.Should().Be(DateTimeOffset.Parse(expectedStart), 
//                 $"{testDate:MMM yyyy} should be in quarter that starts {DateTimeOffset.Parse(expectedStart):MMM yyyy}");
//             result.calculatedEndAt.Should().Be(DateTimeOffset.Parse(expectedEnd),
//                 $"{testDate:MMM yyyy} should be in quarter that ends {DateTimeOffset.Parse(expectedEnd):MMM yyyy}");
//         }

//         #endregion

//         #region Timezone Tests

//         [Theory]
//         [InlineData("America/New_York", "2024-03-10T05:00:00Z", "2024-03-17T03:59:59Z")]
//         [InlineData("Europe/London", "2024-03-10T00:00:00Z", "2024-03-16T23:59:59Z")]
//         [InlineData("Asia/Tokyo", "2024-03-09T15:00:00Z", "2024-03-16T14:59:59Z")]
//         public void GetInterval_Weekly_WithTimezones_ConvertsToUTC(string timezone, string expectedStart, string expectedEnd)
//         {
//             // Arrange
//             var settings = new AllowanceRecurrenceSettings
//             {
//                 Type = AllowanceIntervalType.Weekly,
//                 Interval = 1,
//                 DayOfWeek = DayOfWeek.Sunday
//             };

//             // Act
//             var result = _service.GetCurrentInterval(settings, timezone);

//             // Assert
//             result.calculatedStartAt.Should().Be(DateTimeOffset.Parse(expectedStart),
//                 $"should correctly convert {timezone} Sunday start to UTC");
//             result.calculatedEndAt.Should().Be(DateTimeOffset.Parse(expectedEnd),
//                 $"should correctly convert {timezone} Saturday end to UTC");
//         }

//         [Theory]
//         [InlineData("America/New_York", "2024-03-01T05:00:00Z", "2024-04-01T03:59:59Z")]
//         [InlineData("Europe/London", "2024-03-01T00:00:00Z", "2024-03-31T22:59:59Z")]
//         [InlineData("Asia/Tokyo", "2024-02-29T15:00:00Z", "2024-03-31T14:59:59Z")]
//         public void GetInterval_Monthly_WithTimezones_ConvertsToUTC(string timezone, string expectedStart, string expectedEnd)
//         {
//             // Arrange
//             var settings = new AllowanceRecurrenceSettings
//             {
//                 Type = AllowanceIntervalType.Monthly,
//                 Interval = 1
//             };

//             // Act
//             var result = _service.GetCurrentInterval(settings, timezone);

//             // Assert
//             result.calculatedStartAt.Should().Be(DateTimeOffset.Parse(expectedStart),
//                 $"should correctly convert {timezone} month start to UTC");
//             result.calculatedEndAt.Should().Be(DateTimeOffset.Parse(expectedEnd),
//                 $"should correctly convert {timezone} month end to UTC");
//         }

//         #endregion

//         #region Error Handling Tests

//         [Fact]
//         public void GetInterval_UnsupportedIntervalType_ThrowsException()
//         {
//             // Arrange
//             var settings = new AllowanceRecurrenceSettings
//             {
//                 Type = (AllowanceIntervalType)999, // Invalid type
//                 Interval = 1
//             };

//             // Act & Assert
//             Action act = () => _service.GetCurrentInterval(settings, "UTC");
//             act.Should().Throw<ArgumentOutOfRangeException>()
//                 .And.ParamName.Should().Be("Type");
//         }

//         [Fact]
//         public void GetInterval_InvalidTimezone_ThrowsException()
//         {
//             // Arrange
//             var settings = new AllowanceRecurrenceSettings
//             {
//                 Type = AllowanceIntervalType.Weekly,
//                 Interval = 1,
//                 DayOfWeek = DayOfWeek.Monday
//             };

//             // Act & Assert
//             Action act = () => _service.GetCurrentInterval(settings, "Invalid/Timezone");
//             act.Should().Throw<TimeZoneNotFoundException>();
//         }

//         #endregion

//         #region Edge Cases

//         [Fact]
//         public void GetInterval_ZeroInterval_HandlesGracefully()
//         {
//             // Arrange
//             var settings = new AllowanceRecurrenceSettings
//             {
//                 Type = AllowanceIntervalType.Weekly,
//                 Interval = 0, // Edge case
//                 DayOfWeek = DayOfWeek.Monday
//             };

//             // Act
//             var result = _service.GetCurrentInterval(settings, "UTC");

//             // Assert
//             result.calculatedStartAt.Should().Be(new DateTimeOffset(2024, 3, 11, 0, 0, 0, TimeSpan.Zero));
//             result.calculatedEndAt.Should().Be(new DateTimeOffset(2024, 3, 10, 23, 59, 59, TimeSpan.Zero), 
//                 "0 interval should result in end date before start date (edge case behavior)");
//         }

//         [Fact]
//         public void GetInterval_NegativeInterval_HandlesGracefully()
//         {
//             // Arrange
//             var settings = new AllowanceRecurrenceSettings
//             {
//                 Type = AllowanceIntervalType.Monthly,
//                 Interval = -1, // Edge case
//             };

//             // Act
//             var result = _service.GetCurrentInterval(settings, "UTC");

//             // Assert
//             result.calculatedStartAt.Should().Be(new DateTimeOffset(2024, 3, 1, 0, 0, 0, TimeSpan.Zero));
//             result.calculatedEndAt.Should().Be(new DateTimeOffset(2024, 1, 31, 23, 59, 59, TimeSpan.Zero),
//                 "negative interval should result in past date (edge case behavior)");
//         }

//         #endregion
//     }
// }
