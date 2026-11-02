/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Shared.Enums;
using DoDone.Server.Extensions;

namespace DoDone.Server.Dtos;


public class TeamDetailsBase
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public bool IsBusiness { get; set; } = false;
    // i.e.: team is always created by the system when 1st team user registers, so no CreatedBy field here
    public DateTimeOffset CreatedAt { get; set; }
}

public class ExistingTeamDetails : TeamDetailsBase
{
    public long Id { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public UserResponse? UpdatedByUser { get; set; } = null!;
}

public class TeamDetailsCreateRequest : TeamDetailsBase
{ }

public class TeamDetailsUpdateRequest : ExistingTeamDetails
{ }

public class TeamDetailsResponse : ExistingTeamDetails
{ }

public static class TeamDetailsResponseExtensions
{
    public static TeamDetailsResponse ToTeamDetailsResponse(this Team team)
    {
        if (team == null)
            throw new ArgumentNullException(nameof(team), "Team cannot be null");

        return new TeamDetailsResponse
        {
            Id = team.Id,
            Name = team.Name ?? throw new ArgumentException("Name cannot be null", nameof(team.Name)),
            Description = team.Description,
            IsBusiness = team.IsBusiness,
            CreatedAt = team.CreatedAt,
            UpdatedBy = team.UpdatedBy,
            UpdatedAt = team.UpdatedAt,
            UpdatedByUser = team.UpdatedByUser?.ToDto(),
        };
    }
}

public class TeamAllowanceIntervalGradingPeriodResponse
{
    public long Id { get; set; }
    public long TeamAllowanceIntervalId { get; set; }
    public string Name { get; set; } = null!;
    public MonthOfYear StartMonth { get; set; }
    public int StartDay { get; set; }
    public MonthOfYear EndMonth { get; set; }
    public int EndDay { get; set; }
    public bool IsSchoolBreak { get; set; } = false;
}

public class TeamAllowanceIntervalBase
{
    public long TeamId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required decimal MaxAllowanceAmount { get; set; }
    public required long MinCreditsForAllowance { get; set; }
    public required AllowanceIntervalType IntervalType { get; set; }
    public required int IntervalValue { get; set; }
    public DayOfWeek? StartDayOfWeek { get; set; }
    public int? StartMonthOfYear { get; set; }
    public bool IsActive { get; set; } = true;
    public bool ResetGradesOnIntervalEnd { get; set; } = true;
    public long CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public List<TeamGradeConfigResponse> GradeConfigs { get; set; } = new();
    public List<TeamAllowanceIntervalGradingPeriodResponse> GradingPeriods { get; set; } = new();
}

public class ExistingTeamAllowanceInterval : TeamAllowanceIntervalBase
{
    public long Id { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}

public class TeamAllowanceIntervalResponse : ExistingTeamAllowanceInterval
{
    public UserResponse CreatedByUser { get; set; } = null!;
    public UserResponse? UpdatedByUser { get; set; } = null!;
}

public class TeamAllowanceIntervalCreateRequest : TeamAllowanceIntervalBase
{ }

public class TeamAllowanceIntervalUpdateRequest : ExistingTeamAllowanceInterval
{ }

public class TeamAllowanceIntervalDeleteRequest
{
    public long Id { get; set; }
}

public class TeamAllowanceIntervalListResponse
{
    public List<TeamAllowanceIntervalResponse> AllowanceIntervals { get; set; } = new();
}

public static class TeamAllowanceIntervalResponseExtensions
{
    public static TeamAllowanceIntervalResponse ToDto(this TeamAllowanceInterval interval)
    {
        if (interval == null)
            throw new ArgumentNullException(nameof(interval), "TeamAllowanceInterval cannot be null");

        return new TeamAllowanceIntervalResponse
        {
            Id = interval.Id,
            TeamId = interval.TeamId,
            Name = interval.Name,
            Description = interval.Description,
            MaxAllowanceAmount = interval.MaxAllowanceAmount,
            MinCreditsForAllowance = interval.MinCreditsForAllowance,
            IntervalType = interval.IntervalType,
            IntervalValue = interval.IntervalValue,
            StartDayOfWeek = interval.StartDayOfWeek,
            StartMonthOfYear = interval.StartMonthOfYear,
            IsActive = interval.IsActive,
            ResetGradesOnIntervalEnd = interval.ResetGradesOnIntervalEnd,
            CreatedBy = interval.CreatedBy,
            CreatedAt = interval.CreatedAt,
            UpdatedBy = interval.UpdatedBy,
            UpdatedAt = interval.UpdatedAt,
            // CreatedByUser = interval.CreatedByUser.ToDto(),
            // UpdatedByUser = interval.UpdatedByUser?.ToDto(),
            GradeConfigs = interval.GradeConfigs.ToDtoList(),
            GradingPeriods = interval.GradingPeriods.Select(s => new TeamAllowanceIntervalGradingPeriodResponse
            {
                Id = s.Id,
                TeamAllowanceIntervalId = s.TeamAllowanceIntervalId,
                Name = s.Name,
                StartMonth = s.StartMonth,
                StartDay = s.StartDay,
                EndMonth = s.EndMonth,
                EndDay = s.EndDay,
                IsSchoolBreak = s.IsSchoolBreak,
            }).ToList()
        };
    }

    public static TeamAllowanceIntervalListResponse ToDtoListResponse(this List<TeamAllowanceInterval> intervals)
    {
        return new TeamAllowanceIntervalListResponse { AllowanceIntervals = intervals.Select(i => i.ToDto()).ToList() };
    }
}