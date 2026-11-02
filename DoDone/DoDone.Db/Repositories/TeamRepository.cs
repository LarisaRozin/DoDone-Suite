/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Dtos;
using DoDone.Db.Models;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Db.Repositories;

public interface ITeamRepository
{
    Task<Team?> GetDetailsAsync(long teamId);
    Task<bool> IsBusiness(long teamId);
    Task CreateAsync(Team team);
    Task UpdateAsync(Team team);
    Task DeleteAsync(long id);

    Task<List<TeamAllowanceInterval>> GetTeamAllowanceIntervalsAsync(long teamId);
    Task<List<TeamAllowanceInterval>> GetTeamAllowanceIntervalsForEditAsync(long teamId);
    Task<TeamAllowanceInterval?> GetTeamAllowanceIntervalAsync(long teamId, long intervalId);
    Task<TeamAllowanceInterval> CreateAllowanceIntervalAsync(TeamAllowanceInterval interval);
    Task UpdateAllowanceIntervalAsync(TeamAllowanceInterval interval);
    Task DeleteAllowanceIntervalAsync(long id);
    Task<SubscriptionInfo> GetTeamSubscriptionInfoAsync(long teamId);
    Task<int> GetTeamMembersCountAsync(long teamId);
    Task<List<User>> GetTeamMembersAsync(long teamId);
    Task<int> GetTeamMembersActiveCountAsync(long teamId);
    Task<int> GetAllowanceIntervalsCountAsync(long teamId);
    Task<int> GetActiveAllowanceIntervalsCountAsync(long teamId);
}

public class TeamRepository : ITeamRepository
{
    private readonly DoDoneDbContext _db;

    public TeamRepository(DoDoneDbContext db)
    {
        _db = db;
    }

    public async Task<Team?> GetDetailsAsync(long id)
    {
        return await _db.Teams
            .Where(t => t.Id == id)
            .Include(t => t.UpdatedByUser)
            .FirstOrDefaultAsync();
    }


    public async Task<bool> IsBusiness(long teamId)
    {
        return await _db.Teams.Where(x => x.Id == teamId).Select(x => x.IsBusiness).FirstOrDefaultAsync();
    }

    public async Task CreateAsync(Team team)
    {
        await _db.Teams.AddAsync(team);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Team team)
    {
        _db.Teams.Update(team);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(long id)
    {
        var team = await _db.Teams.FindAsync(id);
        if (team != null)
        {
            _db.Teams.Remove(team);
        }
        await _db.SaveChangesAsync();
    }

    public async Task<List<TeamAllowanceInterval>> GetTeamAllowanceIntervalsAsync(long teamId)
    {
        return await _db.TeamAllowanceIntervals
            .Where(ai => ai.TeamId == teamId)
            .AsSplitQuery()
            .Include(ai => ai.GradeConfigs)
            .Include(ai => ai.GradingPeriods)
            .OrderBy(ai => ai.IsActive ? 0 : 1)
            .ToListAsync();
    }

    public async Task<List<TeamAllowanceInterval>> GetTeamAllowanceIntervalsForEditAsync(long teamId)
    {
        return await _db.TeamAllowanceIntervals
            .Where(ai => ai.TeamId == teamId)
            .AsSplitQuery()
            .Include(ai => ai.GradeConfigs)
            .Include(ai => ai.GradingPeriods.Where(gp => !gp.IsSchoolBreak))
            .OrderBy(ai => ai.IsActive ? 0 : 1)
            .ToListAsync();
    }

    public async Task<TeamAllowanceInterval?> GetTeamAllowanceIntervalAsync(long teamId, long intervalId)
    {
        return await _db.TeamAllowanceIntervals
            .Where(ai => ai.TeamId == teamId && ai.Id == intervalId)
            .AsSplitQuery()
            .Include(ai => ai.GradeConfigs)
            .Include(ai => ai.GradingPeriods)
            .FirstOrDefaultAsync();
    }

    public async Task<TeamAllowanceInterval> CreateAllowanceIntervalAsync(TeamAllowanceInterval interval)
    {
        await _db.TeamAllowanceIntervals.AddAsync(interval);

        if (interval.GradeConfigs != null && interval.GradeConfigs.Any())
        {
            await _db.AllowanceIntervalGradeConfigs.AddRangeAsync(interval.GradeConfigs);
        }

        if (interval.GradingPeriods != null && interval.GradingPeriods.Any())
        {
            await _db.TeamAllowanceIntervalGradingPeriods.AddRangeAsync(interval.GradingPeriods);
        }

        await _db.SaveChangesAsync();
        return interval;
    }

    public async Task UpdateAllowanceIntervalAsync(TeamAllowanceInterval interval)
    {
        _db.TeamAllowanceIntervals.Update(interval);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAllowanceIntervalAsync(long id)
    {
        var interval = await _db.TeamAllowanceIntervals.FindAsync(id);
        if (interval != null)
        {

            _db.AllowanceIntervalGradeConfigs.RemoveRange(_db.AllowanceIntervalGradeConfigs.Where(g => g.TeamAllowanceIntervalId == id));
            _db.TeamAllowanceIntervalGradingPeriods.RemoveRange(_db.TeamAllowanceIntervalGradingPeriods.Where(s => s.TeamAllowanceIntervalId == id));
            _db.AllowanceHistories.RemoveRange(_db.AllowanceHistories.Where(ah => ah.TeamAllowanceIntervalId == id));
            _db.TaskItems.Where(ti => ti.TeamAllowanceIntervalId == id).ToList().ForEach(ti => ti.TeamAllowanceIntervalId = null);
            _db.TeamAllowanceIntervals.Remove(interval);

            await _db.SaveChangesAsync();
        }
    }

    public Task<SubscriptionInfo> GetTeamSubscriptionInfoAsync(long teamId)
    {
        return _db.Teams
            .Where(t => t.Id == teamId)
            .Select(t => new SubscriptionInfo
            {
                SubscriptionTier = t.SubscriptionTier,
                SubscriptionExpiresAt = t.SubscriptionExpiresAt,
                TrialEndsAt = t.TrialEndsAt,
                SubscriptionPlatform = t.SubscriptionPlatform,
                PurchaseToken = t.PurchaseToken,
                TransactionId = t.TransactionId,
                OriginalTransactionId = t.OriginalTransactionId,
                ReceiptData = t.ReceiptData,
                ProductId = t.ProductId,
                CreatedAt = t.CreatedAt
            })
            .FirstOrDefaultAsync()!;
    }

    public async Task<int> GetTeamMembersCountAsync(long teamId)
    {
        return await _db.Users.Where(u => u.TeamId == teamId).CountAsync();
    }

    public async Task<List<User>> GetTeamMembersAsync(long teamId)
        => await _db.Users.Where(x => x.TeamId == teamId).ToListAsync();

    public async Task<int> GetTeamMembersActiveCountAsync(long teamId)
    {
        return await _db.Users.Where(u => u.TeamId == teamId && u.IsActive).CountAsync();
    }

    public async Task<int> GetAllowanceIntervalsCountAsync(long teamId)
    {
        return await _db.TeamAllowanceIntervals.Where(ai => ai.TeamId == teamId).CountAsync();
    }

    public async Task<int> GetActiveAllowanceIntervalsCountAsync(long teamId)
    {
        return await _db.TeamAllowanceIntervals.Where(ai => ai.TeamId == teamId && ai.IsActive).CountAsync();
    }
}
