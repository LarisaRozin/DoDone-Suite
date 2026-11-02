/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;

namespace DoDone.Server.Dtos;

public class GradeResponse
{
    public int Id { get; set; }
    public string LetterGrade { get; set; } = null!;
    public decimal GradePoint { get; set; }
    public byte PercentGradeMin { get; set; }
    public byte PercentGradeMax { get; set; }
    public byte ReducePercent { get; set; }
}

public static class GradeExtensions
{
    public static GradeResponse ToDto(this Grade grade)
    {
        return new GradeResponse
        {
            Id = grade.Id,
            LetterGrade = grade.LetterGrade,
            GradePoint = grade.GradePoints,
            PercentGradeMin = grade.PercentGradeMin,
            PercentGradeMax = grade.PercentGradeMax,
            ReducePercent = grade.ReducePercent,
        };
    }

    public static List<GradeResponse> ToDtoList(this List<Grade> grades)
    {
        return grades.Select(g => g.ToDto()).ToList();
    }

    public static Grade GradeFromGpa(this List<Grade> grades, decimal gpa)
    {
        return grades.OrderByDescending(g => g.PercentGradeMax)
            .First(g => g.GradePoints <= gpa);
    }
}