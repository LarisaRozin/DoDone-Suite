/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Repositories;
using DoDone.Server.Dtos;
using DoDone.Server.Extensions;

namespace DoDone.Server.Services;

public interface IGradesService
{ 
    Task<DataResponse<List<GradeResponse>>> GetListAsync();
}

public class GradesService : IGradesService
{
    private IGradeRepository _grades;

    public GradesService(IGradeRepository grades)
    { 
        _grades = grades;
    }

    public virtual async Task<DataResponse<List<GradeResponse>>> GetListAsync()
    {
        var entities = await _grades.GetListAsync();

        return new DataResponse<List<GradeResponse>> 
        { 
            Data = entities.ToList().ToDtoList(), 
            Success = true, 
            Message = "Grades list retrieved successfully" 
        };
    }
}

