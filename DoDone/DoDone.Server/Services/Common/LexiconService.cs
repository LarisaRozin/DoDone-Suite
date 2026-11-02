/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Repositories;

namespace DoDone.Server.Services;

public interface ILexiconService
{

    Task<string> AllowanceUppercase();
    Task<string> AllowanceLowercase();
    Task<string> TeamUppercase();
    Task<string> TeamLowercase(); 

    string AllowanceUppercase(bool isBusiness);
    string AllowanceLowercase(bool isBusiness);
    Task<string> AllowanceUppercase(long teamId);
    Task<string> AllowanceLowercase(long teamId);


    string TeamUppercase(bool isBusiness);
    Task<string> TeamUppercase(long teamId);
    string TeamLowercase(bool isBusiness);
    Task<string> TeamLowercase(long teamId);
}


public class LexiconService : ILexiconService
{
    private readonly ITeamRepository _teamRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly Lazy<Task<bool>> _isBusinessLazy;
    
    public LexiconService(ITeamRepository teamRepository, ICurrentUserService currentUserService)
    {
        _teamRepository = teamRepository;
        _currentUserService = currentUserService;
        _isBusinessLazy = new Lazy<Task<bool>>(async () =>
        {
            var team = await _teamRepository.GetDetailsAsync(_currentUserService.TeamId);
            if (team == null)
                throw new ArgumentException($"Team with id {_currentUserService.TeamId} not found");
            return team.IsBusiness;
        });
    }

    // Convenient properties for current user's team
    public async Task<string> AllowanceUppercase() => (await _isBusinessLazy.Value) ? "Incentive" : "Allowance";
    public async Task<string> AllowanceLowercase() => (await _isBusinessLazy.Value) ? "incentive" : "allowance";
    public async Task<string> TeamUppercase() => (await _isBusinessLazy.Value) ? "Team" : "Family";
    public async Task<string> TeamLowercase() => (await _isBusinessLazy.Value) ? "team" : "family";

    // Keep existing methods for flexibility
    public string AllowanceUppercase(bool isBusiness) => isBusiness ? "Incentive" : "Allowance";
    public string AllowanceLowercase(bool isBusiness) => isBusiness ? "incentive" : "allowance";
    public string TeamUppercase(bool isBusiness) => isBusiness ? "Team" : "Family";
    public string TeamLowercase(bool isBusiness) => isBusiness ? "team" : "family";

    public async Task<string> AllowanceUppercase(long teamId)
    {
        var team = await _teamRepository.GetDetailsAsync(teamId);
        if (team == null)
            throw new ArgumentException($"Team with id {teamId} not found", nameof(teamId));

        return AllowanceUppercase(team.IsBusiness);
    }

    public async Task<string> AllowanceLowercase(long teamId)
    {
        var team = await _teamRepository.GetDetailsAsync(teamId);
        if (team == null)
            throw new ArgumentException($"Team with id {teamId} not found", nameof(teamId));

        return AllowanceLowercase(team.IsBusiness);
    }

    public async Task<string> TeamUppercase(long teamId)
    {
        var team = await _teamRepository.GetDetailsAsync(teamId);
        if (team == null)
            throw new ArgumentException($"Team with id {teamId} not found", nameof(teamId));

        return TeamUppercase(team.IsBusiness);
    }

    public async Task<string> TeamLowercase(long teamId)
    {
        var team = await _teamRepository.GetDetailsAsync(teamId);
        if (team == null)
            throw new ArgumentException($"Team with id {teamId} not found", nameof(teamId));

        return TeamLowercase(team.IsBusiness);
    }
}