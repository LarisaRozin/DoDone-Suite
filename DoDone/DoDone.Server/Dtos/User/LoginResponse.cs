/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Server.Dtos;

public class LoginResponse : ResponseBase
{
    public UserResponse? User { get; set; }
    public string? Token { get; set; }
}
