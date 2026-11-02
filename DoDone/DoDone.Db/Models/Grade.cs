/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Db.Models;

public class Grade
{
    public int Id { get; set; }
    public string LetterGrade { get; set; } = null!;
    public byte PercentGradeMin { get; set; }
    public byte PercentGradeMax { get; set; }
    public decimal GradePoints { get; set; }
    public byte ReducePercent { get; set; }
    public List<TaskItem> TaskItems { get; set; } = new();
    public List<AllowanceHistoryTaskItems> AllowanceHistoryTaskItems { get; set; } = new();
    // public List<TeamGradeConfig> TeamGradeConfigs { get; set; } = new();
}