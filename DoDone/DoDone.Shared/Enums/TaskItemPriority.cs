/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using System.ComponentModel;

namespace DoDone.Shared.Enums;

public enum TaskItemPriority
{
    [Description("No Priority")]
    None = 0,
    [Description("Low Priority")]
    Low = 1,
    [Description("Medium Priority")]
    Medium = 2,
    [Description("High Priority")]
    High = 3,
    [Description("Critical Priority")]
    Critical = 4
}
