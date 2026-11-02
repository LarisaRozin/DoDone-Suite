/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Server.Dtos;

public class RegisterRequest
{
    public required string UserName { get; set; }
    public required string Password { get; set; }  
    public required string Email { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? MiddleName { get; set; }
    public string? Salutation { get; set; }
    public string? TeamName { get; set; }
    public string? TeamDescription { get; set; }
    public bool IsBusiness { get; set; }
    public required string DeviceId { get; set; }
    public required string Platform { get; set; }  // "android" or "ios"
    public required string Timezone { get; set; }
}

public static class RegisterRequestExtensions
{
    public static string Validate(this RegisterRequest dto)
    {
        if (dto == null)
            return "RegisterDto is null";

        if (string.IsNullOrWhiteSpace(dto.UserName))
            return "User name is required";

        if (string.IsNullOrWhiteSpace(dto.Password))
            return "Password is required";

        if (string.IsNullOrWhiteSpace(dto.Email))
            return "Email is required";

        if (string.IsNullOrWhiteSpace(dto.FirstName))
            return "First Name is required";

        if (string.IsNullOrWhiteSpace(dto.LastName))
            return "Last Name is required";

        if (!dto.Email.Contains('@') || !dto.Email.Contains('.'))
            return "Invalid Email";

        // TODO: add more password/email validation here

        return string.Empty;
    }
}