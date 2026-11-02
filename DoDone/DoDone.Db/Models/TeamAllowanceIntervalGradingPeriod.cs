/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

namespace DoDone.Db.Models;
public class TeamAllowanceIntervalGradingPeriod
{
    public long Id { get; set; }
    public long TeamAllowanceIntervalId { get; set; }
    public string Name { get; set; } = null!;
    public MonthOfYear StartMonth { get; set; }
    public int StartDay { get; set; }
    public MonthOfYear EndMonth { get; set; }
    public int EndDay { get; set; }
    public bool IsSchoolBreak { get; set; } = false;
    public TeamAllowanceInterval TeamAllowanceInterval { get; set; } = null!;
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}
