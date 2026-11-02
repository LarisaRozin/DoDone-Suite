/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Enums;
using DoDone.Shared.Abstractions;
using DoDone.Db.Models;

namespace DoDone.Server.Services;

// public class AllowanceRecurrenceSettings
// {
//     public AllowanceIntervalType Type { get; set; }
//     public int Interval { get; set; } // Monthly/Weekly
//     public DayOfWeek? DayOfWeek { get; set; } // Weekly
// }

public interface IRecurringDateService
{
    (DateTimeOffset calculatedStartAt, DateTimeOffset calculatedEndAt) GetCurrentIntervalDates(TeamAllowanceInterval allowanceInterval, string timezone);
    (DateTimeOffset calculatedStartAt, DateTimeOffset calculatedEndAt) GetNextIntervalDates(TeamAllowanceInterval allowanceInterval, DateTimeOffset currentIntervalEndAt);
}

public class RecurringDateService : IRecurringDateService
{
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<RecurringDateService> _logger;
    
    const byte FIRST_QUARTER_START_MONTH = 1;
    const byte SECOND_QUARTER_START_MONTH = 4;
    const byte THIRD_QUARTER_START_MONTH = 7;
    const byte FOURTH_QUARTER_START_MONTH = 10;

    public RecurringDateService(IDateTimeProvider dateTimeProvider, ILogger<RecurringDateService> logger)
    {
        _dateTimeProvider = dateTimeProvider;
        _logger = logger;
    }

    private static DateTimeOffset GetEndOfMonth(DateTimeOffset dateTime)
    {
        var year = dateTime.Year;
        var month = dateTime.Month;
        var daysInMonth = DateTime.DaysInMonth(year, month);
        
        return new DateTimeOffset(year, month, daysInMonth, 23, 59, 59, 999, dateTime.Offset)
            .AddTicks(TimeSpan.TicksPerMillisecond - 1); // Add remaining ticks to get 23:59:59.9999999
    }

    public (DateTimeOffset calculatedStartAt, DateTimeOffset calculatedEndAt) GetNextIntervalDates(TeamAllowanceInterval interval, DateTimeOffset currentIntervalEndAt)
    {
        DateTimeOffset nextStartAt = currentIntervalEndAt.AddMicroseconds(1);
        DateTimeOffset nextEndAt = nextStartAt;
        switch (interval.IntervalType)
        {
            case AllowanceIntervalType.Weekly:
                if (interval.StartDayOfWeek.HasValue)
                {
                    do
                    {
                        nextEndAt = nextEndAt.AddDays(1);
                    } while (nextEndAt.DayOfWeek != interval.StartDayOfWeek.Value);
                }
                if (interval.IntervalValue > 1)
                {
                    nextEndAt = nextEndAt.AddDays(interval.IntervalValue * 7);
                }
                nextEndAt = new DateTimeOffset(nextEndAt.Year, nextEndAt.Month, nextEndAt.Day, 23, 59, 59, 999, nextEndAt.Offset)
                    .AddTicks(TimeSpan.TicksPerMillisecond - 1); // Add remaining ticks to get 23:59:59.9999999
                break;
            case AllowanceIntervalType.Monthly:
                nextEndAt = GetEndOfMonth(nextStartAt);
                if (interval.IntervalValue > 1)
                {
                    nextEndAt = nextEndAt.AddMonths(interval.IntervalValue - 1);
                    nextEndAt = GetEndOfMonth(nextEndAt);
                }
                if (interval.StartDayOfWeek.HasValue)
                {
                    do
                    {
                        nextEndAt = nextEndAt.AddDays(1);
                    } while (nextEndAt.DayOfWeek != interval.StartDayOfWeek.Value);
                }
                break;
            case AllowanceIntervalType.Quarterly:
                var month = nextStartAt.Month;
                if (month % 3 == 0)
                {
                    nextEndAt = GetEndOfMonth(nextStartAt);
                }
                else
                {
                    nextEndAt = new DateTimeOffset(nextStartAt.Year, month + (3 - month % 3), 1, 0, 0, 0, 0, nextStartAt.Offset);
                    nextEndAt = GetEndOfMonth(nextEndAt);
                }
                if (interval.StartDayOfWeek.HasValue)
                {
                    do
                    {
                        nextEndAt = nextEndAt.AddDays(1);
                    } while (nextEndAt.DayOfWeek != interval.StartDayOfWeek.Value);
                }
                break;
            case AllowanceIntervalType.SchoolYear:
                // Find the next Grading Period that starts after the current interval end
                var currentEndDate = currentIntervalEndAt.Date;
                var currentYear = currentIntervalEndAt.Year;
                
                var nextGradingPeriod = interval.GradingPeriods
                    .Select(x => new {
                        GradingPeriod = x,
                        StartDate = new DateTime(currentYear, (int)x.StartMonth, x.StartDay),
                        EndDate = new DateTime(currentYear, (int)x.EndMonth, x.EndDay)
                    })
                    .Where(x => {
                        // Handle year wraparound cases
                        if (x.EndDate < x.StartDate)
                        {
                            // Grading Period wraps around the year - check if it starts after current end
                            return x.StartDate.Date > currentEndDate;
                        }
                        else
                        {
                            // Normal case - check if it starts after current end
                            return x.StartDate.Date > currentEndDate;
                        }
                    })
                    .OrderBy(x => x.StartDate)
                    .FirstOrDefault();

                // If no grading period found in current year, look in next year
                if (nextGradingPeriod == null)
                {
                    var nextYear = currentYear + 1;
                    nextGradingPeriod = interval.GradingPeriods
                        .Select(x => new {
                            GradingPeriod = x,
                            StartDate = new DateTime(nextYear, (int)x.StartMonth, x.StartDay),
                            EndDate = new DateTime(nextYear, (int)x.EndMonth, x.EndDay)
                        })
                        .OrderBy(x => x.StartDate)
                        .FirstOrDefault();
                }

                if (nextGradingPeriod == null)
                {
                    throw new InvalidOperationException("No next grading period found for SchoolYear allowance interval");
                }

                nextStartAt = new DateTimeOffset(nextGradingPeriod.StartDate, currentIntervalEndAt.Offset);
                nextEndAt = new DateTimeOffset(nextGradingPeriod.EndDate.Date.Add(new TimeSpan(23, 59, 59, 999)).AddTicks(TimeSpan.TicksPerMillisecond - 1), currentIntervalEndAt.Offset);
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(interval.IntervalType), interval.IntervalType, "Unsupported AllowanceIntervalType for recurring date calculation");
        }
        return (nextStartAt, nextEndAt);
    }

    public (DateTimeOffset calculatedStartAt, DateTimeOffset calculatedEndAt) GetCurrentIntervalDates(TeamAllowanceInterval interval, string timezone)
    {
        // if (timezone == "UTC")
        // {
        //     _logger.LogWarning("UTC timezone received, defaulting to UTC calculations.");
        // }

        var tzi = timezone == "UTC" ? null : TimeZoneInfo.FindSystemTimeZoneById(timezone);
        DateTime localNow = timezone == "UTC" ? _dateTimeProvider.UtcNow.DateTime : TimeZoneInfo.ConvertTimeFromUtc(_dateTimeProvider.UtcNow.DateTime, tzi!);
        var dayOne = 1;
        DateTime startAt = DateTime.MinValue;
        DateTime endAt = DateTime.MaxValue;

        // TODO: Holidays?
        if (interval.IntervalType == AllowanceIntervalType.Weekly)
        {
            DayOfWeek startDayOfWeek = interval.StartDayOfWeek.HasValue
                ? interval.StartDayOfWeek.Value
                : DayOfWeek.Sunday;

            DateTime initialCalculatedStartAt = localNow.AddDays(startDayOfWeek - localNow.DayOfWeek).Date;  // 1st week of 1st weekly allowance

            startAt = initialCalculatedStartAt;

            endAt = startAt.AddDays(7 * interval.IntervalValue).AddMicroseconds(-1);
        }
        else if (interval.IntervalType == AllowanceIntervalType.Monthly)
        {
            DateTime initialCalculatedStartAt = new DateTime(localNow.Year, localNow.Month, dayOne);  
            startAt = initialCalculatedStartAt;
            endAt = startAt.AddMonths(interval.IntervalValue).AddMicroseconds(-1);
        }
        else if (interval.IntervalType == AllowanceIntervalType.Quarterly)
        {
            var quarter = (int)Math.Ceiling((double)localNow.Month / 3);
            startAt = quarter switch
            {
                1 => new DateTime(localNow.Year, FIRST_QUARTER_START_MONTH, dayOne),
                2 => new DateTime(localNow.Year, SECOND_QUARTER_START_MONTH, dayOne),
                3 => new DateTime(localNow.Year, THIRD_QUARTER_START_MONTH, dayOne),
                4 => new DateTime(localNow.Year, FOURTH_QUARTER_START_MONTH, dayOne),
                _ => throw new ArgumentOutOfRangeException()
            };
            endAt = startAt.AddMonths(3).AddMicroseconds(-1);
        }
        else if (interval.IntervalType == AllowanceIntervalType.SchoolYear)
        {
            var currentDate = new DateTime(localNow.Year, localNow.Month, localNow.Day);
            
            var currentGradingPeriod = interval.GradingPeriods.Where(x => 
            {
                var gradingPeriodStart = new DateTime(localNow.Year, (int)x.StartMonth, x.StartDay);
                var gradingPeriodEnd = new DateTime(localNow.Year, (int)x.EndMonth, x.EndDay);
                
                // Handle year wraparound cases (e.g., Dec 20 - Jan 5)
                if (gradingPeriodEnd < gradingPeriodStart)
                {
                    // Grading Period wraps around the year
                    return currentDate >= gradingPeriodStart || currentDate <= gradingPeriodEnd;
                }
                else
                {
                    // Normal case within the same year
                    return currentDate >= gradingPeriodStart && currentDate <= gradingPeriodEnd;
                }
            }).FirstOrDefault();
            
            if (currentGradingPeriod == null)
            {
                throw new InvalidOperationException("No current grading period found for SchoolYear allowance interval");
            }
            startAt = new DateTime(localNow.Year, (int)currentGradingPeriod.StartMonth, currentGradingPeriod.StartDay);
            endAt = new DateTime(localNow.Year, (int)currentGradingPeriod.EndMonth, currentGradingPeriod.EndDay, 23, 59, 59, 999).AddTicks(TimeSpan.TicksPerMillisecond - 1);
        }
        else
        {
            throw new ArgumentOutOfRangeException(nameof(interval.IntervalType), interval.IntervalType, "Unsupported AllowanceIntervalType for recurring date calculation");
        }

        // Remove microseconds
        startAt = new DateTime(startAt.Year, startAt.Month, startAt.Day, startAt.Hour, startAt.Minute, startAt.Second, 0, startAt.Kind);
        endAt = new DateTime(endAt.Year, endAt.Month, endAt.Day, endAt.Hour, endAt.Minute, endAt.Second, 0, endAt.Kind);

        if (tzi == null)
        {
            return (new DateTimeOffset(startAt, TimeSpan.Zero), new DateTimeOffset(endAt, TimeSpan.Zero));
        }
        else
        {
            return (new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(startAt, tzi)), new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(endAt, tzi)));
        }
    }
}
















