/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Server.Dtos;

public class ForgotPasswordRequest
{
    public required string Email { get; set; }
}

public class ForgotPasswordResponse : ResponseBase
{ }

public class ResetPasswordRequest
{
    public required string Token { get; set; }
    public required string NewPassword { get; set; }
}

public class ResetPasswordResponse : ResponseBase
{ }

public class SendPasswordResetEmailRequest
{
    public required string Email { get; set; }
}

public class SendPasswordResetEmailRequestForUser
{
    public required long UserId { get; set; }
}



public class SendPasswordResetEmailResponse : ResponseBase
{ }


public static class ForgotPasswordRequestExtensions
{
    public static string? Validate(this ForgotPasswordRequest request)
    {
        // TODO: email validation.
        // TODO: this is duplicated somewhere
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return "Email is required.";
        }

        return null;
    }
}

public static class ResetPasswordRequestExtensions
{
    public static string? Validate(this ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            return "Token is required.";
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return "New password is required.";
        }

        return null;
    }
}

public static class SendPasswordResetEmailRequestExtensions
{
    public static string? Validate(this SendPasswordResetEmailRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return "Email is required.";
        }

        return null;
    }
}