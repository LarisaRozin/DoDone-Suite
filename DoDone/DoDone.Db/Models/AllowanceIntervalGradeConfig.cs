/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

namespace DoDone.Db.Models;

public class AllowanceIntervalGradeConfig
{
    public long Id { get; set; }
    public long TeamAllowanceIntervalId { get; set; }
    public long GradeId { get; set; }
    public byte AllowanceReducePercent { get; set; }
    public long CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public User? UpdatedByUser { get; set; } = null!;
    public TeamAllowanceInterval AllowanceInterval { get; set; } = null!;
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}