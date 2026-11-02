/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Server.Dtos;

public class LoginRequest
{
    public required string UserName { get; set; }
    public required string Password { get; set; }
}


public static class LoginRequestExtensions
{
    public static string Validate(this LoginRequest loginRequest)
    {
        if (loginRequest == null)
            return "LoginRequest is null";

        if (string.IsNullOrWhiteSpace(loginRequest.UserName))
            return "User name is required";

        if (string.IsNullOrWhiteSpace(loginRequest.Password))
            return "Password is required";

        return string.Empty;
    }
}
