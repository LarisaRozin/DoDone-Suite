/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Server.Dtos.Common;

/// <summary>
/// Enumeration for sort direction
/// </summary>
public enum SortDirection
{
    Ascending = 0,
    Descending = 1
}

/// <summary>
/// Request object for sorting parameters
/// </summary>
public class SortingRequest
{
    /// <summary>
    /// The field to sort by
    /// </summary>
    public string? SortBy { get; set; }

    /// <summary>
    /// The sort direction
    /// </summary>
    public SortDirection SortDirection { get; set; } = SortDirection.Ascending;

    /// <summary>
    /// Multiple sort criteria (advanced sorting)
    /// </summary>
    public List<SortCriteria>? SortCriteria { get; set; }
}

/// <summary>
/// Individual sort criteria for multi-column sorting
/// </summary>
public class SortCriteria
{
    /// <summary>
    /// The field to sort by
    /// </summary>
    public required string Field { get; set; }

    /// <summary>
    /// The sort direction
    /// </summary>
    public SortDirection Direction { get; set; } = SortDirection.Ascending;

    /// <summary>
    /// The order priority (lower numbers have higher priority)
    /// </summary>
    public int Priority { get; set; } = 0;
}
