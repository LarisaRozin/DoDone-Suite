/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Server.Dtos.Common;

/// <summary>
/// Request object for paging parameters
/// </summary>
public class PagingRequest
{
    /// <summary>
    /// Page number (1-based)
    /// </summary>
    public int Page { get; set; } = 1;

    /// <summary>
    /// Number of items per page
    /// </summary>
    public int PageSize { get; set; } = 10;

    /// <summary>
    /// Maximum allowed page size to prevent abuse
    /// </summary>
    public const int MaxPageSize = 100;

    /// <summary>
    /// Gets the validated page size (capped at MaxPageSize)
    /// </summary>
    public int ValidatedPageSize => Math.Min(PageSize, MaxPageSize);

    /// <summary>
    /// Gets the skip count for database queries
    /// </summary>
    public int Skip => (Math.Max(1, Page) - 1) * ValidatedPageSize;

    /// <summary>
    /// Gets the take count for database queries
    /// </summary>
    public int Take => ValidatedPageSize;
}
