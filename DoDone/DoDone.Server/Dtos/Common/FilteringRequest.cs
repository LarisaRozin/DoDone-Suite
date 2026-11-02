/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Server.Dtos.Common;

/// <summary>
/// Enumeration for filter operations
/// </summary>
public enum FilterOperation
{
    Equals = 0,
    NotEquals = 1,
    Contains = 2,
    NotContains = 3,
    StartsWith = 4,
    EndsWith = 5,
    GreaterThan = 6,
    GreaterThanOrEqual = 7,
    LessThan = 8,
    LessThanOrEqual = 9,
    In = 10,
    NotIn = 11,
    IsNull = 12,
    IsNotNull = 13,
    Between = 14
}

/// <summary>
/// Individual filter criteria
/// </summary>
public class FilterCriteria
{
    /// <summary>
    /// The field to filter on
    /// </summary>
    public required string Field { get; set; }

    /// <summary>
    /// The filter operation
    /// </summary>
    public FilterOperation Operation { get; set; } = FilterOperation.Equals;

    /// <summary>
    /// The value to filter by
    /// </summary>
    public object? Value { get; set; }

    /// <summary>
    /// Additional values for operations like Between, In, NotIn
    /// </summary>
    public List<object>? Values { get; set; }

    /// <summary>
    /// Logical operator to combine with next filter (AND/OR)
    /// </summary>
    public string LogicalOperator { get; set; } = "AND";
}

/// <summary>
/// Request object for filtering parameters
/// </summary>
public class FilteringRequest
{
    /// <summary>
    /// List of filter criteria
    /// </summary>
    public List<FilterCriteria> Filters { get; set; } = new();

    /// <summary>
    /// Quick search term (searches across multiple fields)
    /// </summary>
    public string? SearchTerm { get; set; }

    /// <summary>
    /// Fields to include in quick search
    /// </summary>
    public List<string>? SearchFields { get; set; }
}
