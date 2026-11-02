// /*
//  * Copyright (c) 2025 LarisaRozin
//  * DoDone - Task Management, Allowance & Bonus Tracking Application
//  * All rights reserved.
//  */
// using DoDone.Db.Models;
// using Microsoft.EntityFrameworkCore;

// namespace DoDone.Db.Repositories;

// public interface ITeamGradeConfigRepository
// {
//     Task<AllowanceIntervalGradeConfig?> GetAsync(long id);
//     Task<List<AllowanceIntervalGradeConfig>> GetByTeamIdAsync(long teamId);
//     Task<AllowanceIntervalGradeConfig?> GetByTeamIdAndGradeIdAsync(long teamId, long gradeId);
//     Task CreateAsync(AllowanceIntervalGradeConfig teamGradeConfig);
//     Task UpdateAsync(AllowanceIntervalGradeConfig teamGradeConfig);
//     Task DeleteAsync(long id);
//     Task DeleteByTeamIdAndGradeIdAsync(long teamId, long gradeId);
//     Task SaveChangesAsync();
// }

// public class TeamGradeConfigRepository : ITeamGradeConfigRepository
// {
//     private readonly DoDoneDbContext _db;

//     public TeamGradeConfigRepository(DoDoneDbContext db)
//     {
//         _db = db;
//     }

//     public async Task<AllowanceIntervalGradeConfig?> GetAsync(long id)
//     {
//         return await _db.AllowanceIntervalGradeConfigs
//             .FirstOrDefaultAsync(tgc => tgc.Id == id);
//     }

//     public async Task<List<AllowanceIntervalGradeConfig>> GetByTeamIdAsync(long teamId)
//     {
//         return await _db.AllowanceIntervalGradeConfigs
//             .Where(tgc => tgc.TeamId == teamId)
//             .OrderBy(tgc => tgc.GradeId)
//             .ToListAsync();
//     }

//     public async Task<AllowanceIntervalGradeConfig?> GetByTeamIdAndGradeIdAsync(long teamId, long gradeId)
//     {
//         return await _db.AllowanceIntervalGradeConfigs
//             .FirstOrDefaultAsync(tgc => tgc.TeamId == teamId && tgc.GradeId == gradeId);
//     }

//     public async Task CreateAsync(AllowanceIntervalGradeConfig teamGradeConfig)
//     {
//         await _db.AllowanceIntervalGradeConfigs.AddAsync(teamGradeConfig);
//     }

//     public async Task UpdateAsync(AllowanceIntervalGradeConfig teamGradeConfig)
//     {
//         _db.AllowanceIntervalGradeConfigs.Update(teamGradeConfig);
//         await Task.CompletedTask;
//     }

//     public async Task DeleteAsync(long id)
//     {
//         var teamGradeConfig = await _db.AllowanceIntervalGradeConfigs.FindAsync(id);
//         if (teamGradeConfig != null)
//         {
//             _db.AllowanceIntervalGradeConfigs.Remove(teamGradeConfig);
//         }
//     }

//     public async Task DeleteByTeamIdAndGradeIdAsync(long teamId, long gradeId)
//     {
//         var teamGradeConfig = await GetByTeamIdAndGradeIdAsync(teamId, gradeId);
//         if (teamGradeConfig != null)
//         {
//             _db.AllowanceIntervalGradeConfigs.Remove(teamGradeConfig);
//         }
//     }

//     public Task SaveChangesAsync()
//     {
//         return _db.SaveChangesAsync();
//     }
// }
