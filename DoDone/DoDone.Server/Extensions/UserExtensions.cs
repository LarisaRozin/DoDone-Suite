/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Server.Dtos;

namespace DoDone.Server.Extensions;

public static class UserExtensions
{
    public static UserResponse ToDto(this User user)
    {
        if (user == null) 
            throw new ArgumentNullException(nameof(user), "User cannot be null");

        return new UserResponse
        {
            Id = user.Id,
            TeamId = user.TeamId,
            UserName = user.UserName ?? throw new ArgumentException("UserName cannot be null", nameof(user.UserName)),
            Email = user.Email ?? throw new ArgumentException("Email cannot be null", nameof(user.Email)),
            IsAdmin = user.IsAdmin,
            IsActive = user.IsActive,
            FirstName = user.FirstName ?? throw new ArgumentException("FirstName cannot be null", nameof(user.FirstName)),
            LastName = user.LastName ?? throw new ArgumentException("LastName cannot be null", nameof(user.LastName)),
            MiddleName = user.MiddleName,
            Salutation = user.Salutation,
            AvatarUri = user.AvatarUri,
            CreatedAt = user.CreatedAt,
            CreatedBy = user.CreatedBy,
            UpdatedAt = user.UpdatedAt
        };
    }

    public static List<UserResponse> ToDtoList(this List<User> users)
    {
        if (users == null) 
            throw new ArgumentNullException(nameof(users), "User list cannot be null");

        return users.Select(u => u.ToDto()).ToList();
    }
}

