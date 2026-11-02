/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Server.Services.Common;

namespace DoDone.Server.Dtos.Common;

/// <summary>
/// Metadata about the paging results
/// </summary>
public class PagingInfo
{
    /// <summary>
    /// Current page number (1-based)
    /// </summary>
    public int CurrentPage { get; set; }

    /// <summary>
    /// Number of items per page
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total number of items
    /// </summary>
    public long TotalItems { get; set; }

    /// <summary>
    /// Total number of pages
    /// </summary>
    public int TotalPages => (int)Math.Ceiling((double)TotalItems / PageSize);

    /// <summary>
    /// Whether there is a previous page
    /// </summary>
    public bool HasPrevious => CurrentPage > 1;

    /// <summary>
    /// Whether there is a next page
    /// </summary>
    public bool HasNext => CurrentPage < TotalPages;

    /// <summary>
    /// Index of first item on current page (1-based)
    /// </summary>
    public int FirstItemIndex => TotalItems == 0 ? 0 : (CurrentPage - 1) * PageSize + 1;

    /// <summary>
    /// Index of last item on current page (1-based)
    /// </summary>
    public int LastItemIndex => Math.Min(FirstItemIndex + PageSize - 1, (int)TotalItems);
}

/// <summary>
/// Response object for paged list operations
/// </summary>
/// <typeparam name="T">The item type</typeparam>
public class PagedListResponse<T> : DataResponse<List<T>>
{
    public PagingInfo Paging { get; set; } = new();

    public static PagedListResponse<T> CreateSuccess(List<T> data, PagingInfo pagingInfo, string? message = null)
    {
        return new PagedListResponse<T>
        {
            Data = data,
            Success = true,
            Message = message ?? "Data retrieved successfully",
            Paging = pagingInfo
        };
    }

   public static PagedListResponse<T> CreateFailure(string message)
    {
        return new PagedListResponse<T>
        {
            Data = new List<T>(),
            Success = false,
            Message = message,
            Paging = new PagingInfo()
        };
    }
}


public class PagedTaskItemListResponse : PagedListResponse<TaskItemResponse>
    {
        public TaskItemStats Stats { get; set; } = new();
        public List<AllowanceStats> AllowanceStats { get; set; } = new();
        public BonusStats BonusStats { get; set; } = new();

        public static PagedTaskItemListResponse CreateTaskItemSuccess(List<TaskItemResponse> data, PagingInfo pagingInfo, TaskItemStats stats, List<AllowanceStats> allowanceStats, BonusStats bonusStats, string? message = null)
        {
            return new PagedTaskItemListResponse
            {
                Data = data,
                Success = true,
                Message = message ?? "Task items retrieved successfully",
                Paging = pagingInfo,
                Stats = stats,
                AllowanceStats = allowanceStats,
                BonusStats = bonusStats,
            };
        }

        public static PagedTaskItemListResponse CreateTaskItemFailure(string message)
        {
            return new PagedTaskItemListResponse
            {
                Data = new List<TaskItemResponse>(),
                Success = false,
                Message = message,
                Paging = new PagingInfo(),
                Stats = new TaskItemStats(),
                AllowanceStats = new List<AllowanceStats>(),
                BonusStats = new BonusStats(),
            };
        }
    }

public class PagedTaskItemDetailsListResponse : PagedListResponse<TaskItemDetailsResponse>
{
    public TaskItemStats Stats { get; set; } = new();
    public List<AllowanceStats> AllowanceStats { get; set; } = new();
    public BonusStats BonusStats { get; set; } = new();

    public static PagedTaskItemDetailsListResponse CreateTaskItemSuccess(List<TaskItemDetailsResponse> data, PagingInfo pagingInfo
        , TaskItemStats taskItemStats, List<AllowanceStats> allowanceStats, BonusStats bonusStats, string? message = null)
    {
        return new PagedTaskItemDetailsListResponse
        {
            Data = data,
            Success = true,
            Message = message ?? "Task items retrieved successfully",
            Paging = pagingInfo,
            Stats = taskItemStats,
            AllowanceStats = allowanceStats,
            BonusStats = bonusStats,
        };
    }

    public static PagedTaskItemDetailsListResponse CreateTaskItemFailure(string message)
    {
        return new PagedTaskItemDetailsListResponse
        {
            Data = new List<TaskItemDetailsResponse>(),
            Success = false,
            Message = message,
            Paging = new PagingInfo(),
            Stats = new TaskItemStats(),
            AllowanceStats = new List<AllowanceStats>(),
            BonusStats = new BonusStats(),
        };
    }
 }