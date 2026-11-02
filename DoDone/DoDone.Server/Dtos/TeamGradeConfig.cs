/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;

namespace DoDone.Server.Dtos;

public class TeamGradeConfigResponse
{
    public long Id { get; set; }
    public long TeamAllowanceIntervalId { get; set; }
    public long GradeId { get; set; }
    public byte AllowanceReducePercent { get; set; }
    public long CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}

public class UpdateGradeConfigRequest
{
    public byte AllowanceReducePercent { get; set; }
}

public static class TeamGradeConfigExtensions
{
    public static TeamGradeConfigResponse ToDto(this AllowanceIntervalGradeConfig teamGradeConfig)
    {
        if (teamGradeConfig == null)
            throw new ArgumentNullException(nameof(teamGradeConfig), "TeamGradeConfig cannot be null");

        return new TeamGradeConfigResponse
        {
            Id = teamGradeConfig.Id,
            TeamAllowanceIntervalId = teamGradeConfig.TeamAllowanceIntervalId,
            GradeId = teamGradeConfig.GradeId,
            AllowanceReducePercent = teamGradeConfig.AllowanceReducePercent,
            CreatedBy = teamGradeConfig.CreatedBy,
            CreatedAt = teamGradeConfig.CreatedAt,
            UpdatedBy = teamGradeConfig.UpdatedBy,
            UpdatedAt = teamGradeConfig.UpdatedAt
        };
    }

    public static List<TeamGradeConfigResponse> ToDtoList(this List<AllowanceIntervalGradeConfig> teamGradeConfigs)
    {
        return teamGradeConfigs.Select(tgc => tgc.ToDto()).ToList();
    }
}
