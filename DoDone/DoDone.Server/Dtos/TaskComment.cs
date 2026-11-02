/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Server.Dtos.Common;

namespace DoDone.Server.Dtos;

public class TaskCommentResponse
{
    public long Id { get; set; }
    public long TaskId { get; set; }
    public long UserId { get; set; }
    public string Content { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public UserResponse CreatedByUser { get; set; } = null!;
    public UserResponse? UpdatedByUser { get; set; } = null!;
}

public class TaskCommentCreateRequest
{
    public long TaskId { get; set; }
    public string Content { get; set; } = null!;
}

public class TaskCommentUpdateRequest
{
    public long Id { get; set; }
    public string Content { get; set; } = null!;
}

public class PagedTaskCommentListRequest
{
    public long TaskId { get; set; }
    public string? SearchTerm { get; set; }
    public PagingRequest Paging { get; set; } = new();
}

public class PagedTaskCommentListResponse : PagedListResponse<TaskCommentResponse>
{
    public static PagedTaskCommentListResponse CreateSuccessResponse(List<TaskCommentResponse> items, PagingInfo pagingInfo, string? message = null)
    {
        return new PagedTaskCommentListResponse
        {
            Data = items,
            Success = true,
            Message = message ?? "Task item comments retrieved successfully",
            Paging = pagingInfo,
        };
    }

    public static PagedTaskCommentListResponse CreateFailureResponse(string message)
    {
        return new PagedTaskCommentListResponse
        {
            Data = new List<TaskCommentResponse>(),
            Success = false,
            Message = message,
            Paging = new PagingInfo(),
        };
    }
}

