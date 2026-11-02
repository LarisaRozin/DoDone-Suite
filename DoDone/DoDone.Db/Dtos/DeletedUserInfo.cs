/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

namespace DoDone.Db.Dtos;

public class DeletedUserInfo
{
    public long UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public long TeamId { get; set; }
    public bool IsBusiness { get; set; }
    public bool IsAdmin { get; set; }
}