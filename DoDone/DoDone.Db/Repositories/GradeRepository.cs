/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Db.Repositories;

public interface IGradeRepository
{ 
    Task<List<Grade>> GetListAsync();
}

public class GradeRepository : IGradeRepository
{
    private readonly DoDoneDbContext _db;

    public GradeRepository(DoDoneDbContext db)
    {
        _db = db;
    }

    public async Task<List<Grade>> GetListAsync()
    {
        return await _db.Grades.ToListAsync();
    }
}
