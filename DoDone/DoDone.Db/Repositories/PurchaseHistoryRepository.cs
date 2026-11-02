/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Db.Repositories;

public interface IPurchaseHistoryRepository
{
    Task<PurchaseHistory?> GetByIdAsync(long id);
    Task<PurchaseHistory?> GetByPurchaseTokenAsync(string purchaseToken);
    Task<PurchaseHistory?> GetByTransactionIdAsync(string transactionId);
    Task<List<PurchaseHistory>> GetByTeamIdAsync(long teamId);
    Task<List<PurchaseHistory>> GetActiveByTeamIdAsync(long teamId);
    Task<PurchaseHistory> CreateAsync(PurchaseHistory purchaseHistory);
    Task<PurchaseHistory> UpdateAsync(PurchaseHistory purchaseHistory);
}

public class PurchaseHistoryRepository : IPurchaseHistoryRepository
{
    private readonly DoDoneDbContext _context;

    public PurchaseHistoryRepository(DoDoneDbContext context)
    {
        _context = context;
    }

    public async Task<PurchaseHistory?> GetByIdAsync(long id)
    {
        return await _context.PurchaseHistories
            .Include(p => p.Team)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<PurchaseHistory?> GetByPurchaseTokenAsync(string purchaseToken)
    {
        return await _context.PurchaseHistories
            .Include(p => p.Team)
            .OrderByDescending(p => p.PurchaseDate)
            .FirstOrDefaultAsync(p => p.PurchaseToken == purchaseToken);
    }

    public async Task<PurchaseHistory?> GetByTransactionIdAsync(string transactionId)
    {
        return await _context.PurchaseHistories
            .Include(p => p.Team)
            .OrderByDescending(p => p.PurchaseDate)
            .FirstOrDefaultAsync(p => p.TransactionId == transactionId || p.OriginalTransactionId == transactionId);
    }

    public async Task<List<PurchaseHistory>> GetByTeamIdAsync(long teamId)
    {
        return await _context.PurchaseHistories
            .Where(p => p.TeamId == teamId)
            .OrderByDescending(p => p.PurchaseDate)
            .ToListAsync();
    }

    public async Task<List<PurchaseHistory>> GetActiveByTeamIdAsync(long teamId)
    {
        return await _context.PurchaseHistories
            .Where(p => p.TeamId == teamId && p.IsActive && !p.IsCancelled)
            .OrderByDescending(p => p.PurchaseDate)
            .ToListAsync();
    }

    public async Task<PurchaseHistory> CreateAsync(PurchaseHistory purchaseHistory)
    {
        purchaseHistory.CreatedAt = DateTimeOffset.UtcNow;
        _context.PurchaseHistories.Add(purchaseHistory);
        await _context.SaveChangesAsync();
        return purchaseHistory;
    }

    public async Task<PurchaseHistory> UpdateAsync(PurchaseHistory purchaseHistory)
    {
        purchaseHistory.UpdatedAt = DateTimeOffset.UtcNow;
        _context.PurchaseHistories.Update(purchaseHistory);
        await _context.SaveChangesAsync();
        return purchaseHistory;
    }
}
