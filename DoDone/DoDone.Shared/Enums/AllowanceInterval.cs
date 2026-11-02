/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using System.ComponentModel;

namespace DoDone.Shared.Enums;

public enum AllowanceIntervalType
{
    [Description("Weekly")]
    Weekly = 1,

    [Description("Monthly")]
    Monthly = 2,

    [Description("Quarterly")]
    Quarterly = 3,

    [Description("School Year")]
    SchoolYear = 4, 

    // Yearly,  // use Monthly or Quarterly
}

