/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Microsoft.Extensions.Caching.Memory;
using DoDone.Server.Dtos.Common;
using DoDone.Server.Dtos;
using DoDone.Db.Models;
using DoDone.Shared;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Server.Services.Common;

public interface ICachedQueryProcessorService : IQueryableTaskItemProcessorService
{
    Task<List<AllowanceStats>> GetCachedAllowanceStatsAsync(IQueryable<TaskItem> query, long userId, long teamAllowanceIntervalId, SubscriptionLimitsResponse subscriptionLimits);
    Task<BonusStats> GetCachedBonusStatsAsync(IQueryable<TaskItem> query, DateTimeOffset startAt, DateTimeOffset endAt, long userId);
    void InvalidateAllowanceCache(long userId);
    void InvalidateBonusCache(long userId);
}

public class CachedQueryProcessorService : ICachedQueryProcessorService
{
    private readonly IQueryableTaskItemProcessorService _baseService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CachedQueryProcessorService> _logger;
    
    private bool DISABLE_CACHE_FOR_DEBUGGING = false;
    private const int ALLOWANCE_CACHE_MINUTES = 60;
    private const int BONUS_CACHE_MINUTES = 5;

    public CachedQueryProcessorService(
        IQueryableTaskItemProcessorService baseService,
        IMemoryCache cache,
        ILogger<CachedQueryProcessorService> logger)
    {
        _baseService = baseService;
        _cache = cache;
        _logger = logger;
    }

    public async Task<List<AllowanceStats>> GetCachedAllowanceStatsAsync(IQueryable<TaskItem> query, long userId, long teamAllowanceIntervalId, SubscriptionLimitsResponse subscriptionLimits)
    {
        var updatedSinceLastCacheQuery = query.Where(ti => ti.UpdatedAt >= DateTimeOffset.UtcNow.AddMinutes(-ALLOWANCE_CACHE_MINUTES) || ti.CreatedAt >= DateTimeOffset.UtcNow.AddMinutes(-ALLOWANCE_CACHE_MINUTES));
        if (teamAllowanceIntervalId > 0)
        {
            updatedSinceLastCacheQuery = updatedSinceLastCacheQuery.Where(ti => ti.TeamAllowanceIntervalId == teamAllowanceIntervalId);
        }   
        else if (teamAllowanceIntervalId == Defaults.ALL_INTERVALS_ID)
        {
            updatedSinceLastCacheQuery = updatedSinceLastCacheQuery.Where(ti => ti.TeamAllowanceIntervalId != null);
        }
        else if (teamAllowanceIntervalId == Defaults.NO_ASSIGNED_INTERVAL_ID)
        {
            updatedSinceLastCacheQuery = updatedSinceLastCacheQuery.Where(ti => ti.TeamAllowanceIntervalId == null);
        }
        else if (teamAllowanceIntervalId == Defaults.PRIVATE_TASKS_INTERVAL_ID)
        {
            updatedSinceLastCacheQuery = updatedSinceLastCacheQuery.Where(ti => ti.IsPrivate);
        }
        else if (teamAllowanceIntervalId == Defaults.ALL_TASKS_INTERVAL_ID)
        {
            // All tasks - no additional filter
        }
        var anyUpdates = await updatedSinceLastCacheQuery.AnyAsync();

        var cacheKey = $"allowance_stats_{userId}_{teamAllowanceIntervalId}_{GetQueryHash(query)}";
        
        if (DISABLE_CACHE_FOR_DEBUGGING)
        {
            _logger.LogDebug("Cache disabled, bypassing cache for allowance stats: {CacheKey}", cacheKey);
            return await _baseService.GetAllowanceStatsAsync(query, teamAllowanceIntervalId, subscriptionLimits);
        }

        if (!anyUpdates && _cache.TryGetValue(cacheKey, out List<AllowanceStats>? cachedStats))
        {
            // _logger.LogDebug("Cache hit for allowance stats: {CacheKey}", cacheKey);
            return cachedStats!;
        }

        _logger.LogDebug("Cache miss for allowance stats: {CacheKey}", cacheKey);
        var stats = await _baseService.GetAllowanceStatsAsync(query, teamAllowanceIntervalId, subscriptionLimits);
        
        var cacheOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(ALLOWANCE_CACHE_MINUTES),
            SlidingExpiration = TimeSpan.FromMinutes(ALLOWANCE_CACHE_MINUTES / 2),
            Size = 1,
            Priority = CacheItemPriority.Normal
        };

        _cache.Set(cacheKey, stats, cacheOptions);
        return stats;
    }

    public async Task<BonusStats> GetCachedBonusStatsAsync(IQueryable<TaskItem> query, DateTimeOffset startAt, DateTimeOffset endAt, long userId)
    {
        var anyUpdates = await query
            .Where(ti => ti.MaxBonus != null && ti.MaxBonus.Trim() != string.Empty && ti.UpdatedAt >= DateTimeOffset.UtcNow.AddMinutes(-BONUS_CACHE_MINUTES))
            .AnyAsync();

        var cacheKey = $"bonus_stats_{userId}_{GetQueryHash(query)}_{startAt:yyyyMMdd}_{endAt:yyyyMMdd}";
        
        if (!anyUpdates && _cache.TryGetValue(cacheKey, out BonusStats? cachedStats))
        {
            _logger.LogDebug("Cache hit for bonus stats: {CacheKey}", cacheKey);
            return cachedStats!;
        }

        _logger.LogDebug("Cache miss for bonus stats: {CacheKey}", cacheKey);
        var stats = await _baseService.GetBonusStatsAsync(query, startAt, endAt);
        
        var cacheOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(BONUS_CACHE_MINUTES),
            SlidingExpiration = TimeSpan.FromMinutes(BONUS_CACHE_MINUTES / 2),
            Size = 1,
            Priority = CacheItemPriority.Normal
        };

        _cache.Set(cacheKey, stats, cacheOptions);
        return stats;
    }

    public void InvalidateAllowanceCache(long userId)
    {
        // Note: MemoryCache doesn't have pattern-based invalidation
        // In production, consider using a distributed cache with tagging
        _logger.LogInformation("Allowance cache invalidation requested for user {UserId}", userId);
    }

    public void InvalidateBonusCache(long userId)
    {
        _logger.LogInformation("Bonus cache invalidation requested for user {UserId}", userId);
    }

    private string GetQueryHash(IQueryable<TaskItem> query)
    {
        // Simple hash based on query string - in production use a more sophisticated approach
        var queryString = query.ToString() ?? "";
        return Math.Abs(queryString.GetHashCode()).ToString();
    }

    #region Delegate all other methods to base service
    
    public Task<TaskItemStats> GetTaskItemStatsAsync(IQueryable<TaskItem> query) 
        => _baseService.GetTaskItemStatsAsync(query);

    public Task<List<AllowanceStats>> GetAllowanceStatsAsync(IQueryable<TaskItem> query, long teamAllowanceIntervalId, SubscriptionLimitsResponse subscriptionLimits) 
        => _baseService.GetAllowanceStatsAsync(query, teamAllowanceIntervalId, subscriptionLimits);

    public Task<BonusStats> GetBonusStatsAsync(IQueryable<TaskItem> query, DateTimeOffset startAt, DateTimeOffset endAt) 
        => _baseService.GetBonusStatsAsync(query, startAt, endAt);

    public IQueryable<TaskItem> ApplySearchTermFilter(IQueryable<TaskItem> query, string? searchTerm) 
        => _baseService.ApplySearchTermFilter(query, searchTerm);

    public IQueryable<TaskItem> ApplyPriorityFilter(IQueryable<TaskItem> query, DoDone.Shared.Enums.TaskItemPriorityFilter filter) 
        => _baseService.ApplyPriorityFilter(query, filter);

    public IQueryable<TaskItem> ApplyGroupKindCategoryFilters(IQueryable<TaskItem> query, long? groupId, long? kindId, long? categoryId) 
        => _baseService.ApplyGroupKindCategoryFilters(query, groupId, kindId, categoryId);

    public IQueryable<TaskItem> ApplyActiveStatusFilter(IQueryable<TaskItem> query, DoDone.Shared.Enums.TaskItemActiveStatusFilter filter) 
        => _baseService.ApplyActiveStatusFilter(query, filter);

    public IQueryable<TaskItem> ApplyArchivedStatusFilter(IQueryable<TaskItem> query, DoDone.Shared.Enums.TaskItemArchivedStatusFilter filter) 
        => _baseService.ApplyArchivedStatusFilter(query, filter);

    public IQueryable<TaskItem> ApplyCompletionStatusFilter(IQueryable<TaskItem> query, DoDone.Shared.Enums.TaskItemCompletionStatusFilter filter) 
        => _baseService.ApplyCompletionStatusFilter(query, filter);

    public IQueryable<TaskItem> ApplyDueStatusFilter(IQueryable<TaskItem> query, DoDone.Shared.Enums.TaskItemDueStatusFilter filter) 
        => _baseService.ApplyDueStatusFilter(query, filter);

    public IQueryable<TaskItem> ApplyStartedStatusFilter(IQueryable<TaskItem> query, DoDone.Shared.Enums.TaskItemStartedStatusFilter filter) 
        => _baseService.ApplyStartedStatusFilter(query, filter);

    public IQueryable<TaskItem> ApplyEndedStatusFilter(IQueryable<TaskItem> query, DoDone.Shared.Enums.TaskItemEndedStatusFilter filter) 
        => _baseService.ApplyEndedStatusFilter(query, filter);

    public IQueryable<TaskItem> ApplyGradeFilter(IQueryable<TaskItem> query, int? gradeId) 
        => _baseService.ApplyGradeFilter(query, gradeId);

    public IQueryable<TaskItem> ApplyCreditsFilter(IQueryable<TaskItem> query, byte? credits) 
        => _baseService.ApplyCreditsFilter(query, credits);

    public IQueryable<TaskItem> ApplyAssignmentStatusFilter(IQueryable<TaskItem> query, DoDone.Shared.Enums.TaskItemAssignmentStatusFilter filter) 
        => _baseService.ApplyAssignmentStatusFilter(query, filter);

    public IQueryable<TaskItem> ApplyTeamMemberFilter(IQueryable<TaskItem> query, long? teamMemberId) 
        => _baseService.ApplyTeamMemberFilter(query, teamMemberId);

    public IQueryable<TaskItem> ApplyAllowanceIntervalFilter(IQueryable<TaskItem> query, long? teamAllowanceIntervalId) 
        => _baseService.ApplyAllowanceIntervalFilter(query, teamAllowanceIntervalId);

    public IQueryable<TaskItem> ApplyAllowanceNeedReviewStatusFilter(IQueryable<TaskItem> query, DoDone.Shared.Enums.TaskItemNeedReviewStatusFilter filter, long teamAllowanceIntervalId = 0) 
        => _baseService.ApplyAllowanceNeedReviewStatusFilter(query, filter, teamAllowanceIntervalId);

    public IQueryable<TaskItem> ApplyBonusStatusFilter(IQueryable<TaskItem> query, DoDone.Shared.Enums.TaskItemBonusStatusFilter filter, DateTimeOffset startAt, DateTimeOffset endAt) 
        => _baseService.ApplyBonusStatusFilter(query, filter, startAt, endAt);

    public IQueryable<TaskItem> ApplyDefaultSorting(IQueryable<TaskItem> query) 
        => _baseService.ApplyDefaultSorting(query);

    public IQueryable<TaskItem> ApplyPaging(IQueryable<TaskItem> query, PagingRequest paging) 
        => _baseService.ApplyPaging(query, paging);

    #endregion
}