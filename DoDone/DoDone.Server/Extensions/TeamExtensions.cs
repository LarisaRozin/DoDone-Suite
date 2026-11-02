// /*
//  * Copyright (c) 2025 LarisaRozin
//  * DoDone - Task Management, Allowance & Bonus Tracking Application
//  * All rights reserved.
//  */
// using DoDone.Db.Models;
// using DoDone.Server.Dtos;

// namespace DoDone.Server.Extensions;

// public static class TeamExtensions
// {
//     public static TeamAllowanceIntervalsResponse ToDetailsDto(this Team team)
//     {
//         if (team == null)
//             throw new ArgumentNullException(nameof(team), "Team cannot be null");

//         return new TeamAllowanceIntervalsResponse
//         {
//             Id = team.Id,
//             Name = team.Name,
//             Description = team.Description,
//             IsBusiness = team.IsBusiness,
//             Members = team.Members?.Select(m => m.ToDto()).ToList() ?? new()
//         };
//     }
// }