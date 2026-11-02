/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;

namespace DoDone.Server.Dtos;

public class UserCreateRequest
{
    public required string UserName { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? MiddleName { get; set; }
    public string? Salutation { get; set; }
    public string? AvatarUri { get; set; }
    public required string Email { get; set; }
    public bool IsAdmin { get; set; }
}

public class UserUpdateRequest
{
    public required long Id { get; set; }
    public string? UserName { get; set; }

    public string? Password { get; set; }  
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? MiddleName { get; set; }
    public string? Salutation { get; set; }
    public string? AvatarUri { get; set; }
    public string? Email { get; set; }
    public bool IsAdmin { get; set; }
    public bool IsActive { get; set; }
}

public class UserResponse
{
    public long Id { get; set; }
    public long TeamId { get; set; }
    public required string UserName { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? MiddleName { get; set; }
    public string? Salutation { get; set; }
    public string? AvatarUri { get; set; }
    public required string Email { get; set; }
    public bool IsAdmin { get; set; }
    public bool IsActive { get; set; }
    public long? CreatedBy { get; set; }
    public required DateTimeOffset CreatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}


public static class UserCreateRequestExtensions
{
    public static async Task<string> Validate(this UserCreateRequest request, Func<string, Task<bool>> userExists)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request), "UserCreateRequest cannot be null");

        if (string.IsNullOrWhiteSpace(request.UserName))
            return "User Name is required";

        if (string.IsNullOrWhiteSpace(request.Email))
            return "Email is required";

        if (await userExists(request.UserName))
            return "Username already exists";

        return string.Empty;
    }
}
