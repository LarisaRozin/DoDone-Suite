/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

namespace DoDone.Db.Dtos;

public class UserForTrialNotifications
{
    public long Id { get; set; }
    public bool IsBusiness { get; set; }
    public string Email { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public DateTimeOffset? TrialEndsAt { get; set; }
    public bool TrialWelcomeShown { get; set; }
}