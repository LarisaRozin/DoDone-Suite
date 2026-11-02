/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using System.ComponentModel;

namespace DoDone.Shared.Enums;

public enum SubscriptionTier
{
    [Description("Free Tier")]
    Free = 0,
    [Description("Pro Tier")]
    Pro = 1,
    // [Description("Team Tier")]
    // Tream = 2,
    // [Description("Enterprise Tier")]
    // Enterprise = 3
}