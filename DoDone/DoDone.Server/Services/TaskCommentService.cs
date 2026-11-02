/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Db.Repositories;
using DoDone.Server.Dtos;
using DoDone.Server.Dtos.Common;
using DoDone.Server.Extensions;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Server.Services;

public interface ITaskCommentService
{
    Task<PagedTaskCommentListResponse> GetPagedListAsync(PagedTaskCommentListRequest request);
    Task<DataResponse<Dtos.TaskCommentResponse>> AddAsync(TaskCommentCreateRequest request);
    Task<DataResponse<Dtos.TaskCommentResponse>> UpdateAsync(TaskCommentUpdateRequest request);
    Task DeleteAsync(long commentId);
}

public class TaskCommentService : ITaskCommentService
{
    private readonly ITaskCommentRepository _taskComments;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notificationService;
    private readonly ITaskItemRepository _taskItems;
    private readonly IServiceScopeFactory _serviceScopeFactory;

    public TaskCommentService(ITaskCommentRepository taskComments
            , ICurrentUserService currentUser
            , INotificationService notificationService
            , ITaskItemRepository taskItems
            , IServiceScopeFactory serviceScopeFactory)
    {
        _taskComments = taskComments;
        _currentUser = currentUser;
        _notificationService = notificationService;
        _taskItems = taskItems;
        _serviceScopeFactory = serviceScopeFactory;
    }

    public async Task<PagedTaskCommentListResponse> GetPagedListAsync(PagedTaskCommentListRequest request)
    {
        if (request.TaskId <= 0)
            throw new ArgumentException("Invalid TaskId");

        var query = _taskComments.GetBaseQuery(request.TaskId);

        var filteredComments = string.IsNullOrWhiteSpace(request.SearchTerm)
            ? query
            : query.Where(c => c.Content.Contains(request.SearchTerm!, StringComparison.OrdinalIgnoreCase));

        var totalItems = await filteredComments.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItems / (double)request.Paging.PageSize);
        var currentPage = Math.Min(request.Paging.Page, totalPages == 0 ? 1 : totalPages);

        var pagedComments = filteredComments
            .OrderByDescending(c => c.CreatedAt)
            .Skip((currentPage - 1) * request.Paging.PageSize)
            .Take(request.Paging.PageSize)
            .ToList();

        var dtoComments = pagedComments.Select(c => new Dtos.TaskCommentResponse
        {
            Id = c.Id,
            TaskId = c.TaskItemId,
            UserId = c.CreatedBy,
            Content = c.Content,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
            CreatedByUser = c.CreatedByUser.ToDto(),
            UpdatedByUser = c.UpdatedByUser?.ToDto()
        }).ToList();

        var pagingInfo = new PagingInfo
        {
            CurrentPage = currentPage,
            PageSize = request.Paging.PageSize,
            TotalItems = totalItems,
        };

        return PagedTaskCommentListResponse.CreateSuccessResponse(dtoComments, pagingInfo);
    }

    public async Task<DataResponse<Dtos.TaskCommentResponse>> AddAsync(TaskCommentCreateRequest request)
    {
        if (request.TaskId <= 0)
            throw new ArgumentException("Invalid TaskId");
        if (string.IsNullOrWhiteSpace(request.Content))
            throw new ArgumentException("Content cannot be empty");

        var comment = new Db.Models.TaskComment
        {
            TaskItemId = request.TaskId,
            Content = request.Content,
            CreatedBy = _currentUser.UserId,
            CreatedAt = DateTimeOffset.UtcNow
        };

        await _taskComments.AddAsync(comment);

        var entity = await _taskComments.GetAsync(comment.Id)
            ?? throw new ArgumentException("Comment not found");

        var taskItem = await _taskItems.GetAsync(request.TaskId)
            ?? throw new ArgumentException("Task not found");

        // Fire and forget background operations - don't await these
        var taskItemId = taskItem.Id;
        var commentId = entity.Id;
        var currentUserId = _currentUser.UserId;
        
        // Clone objects to avoid reference issues with disposed contexts
        var taskItemForBackground = new TaskItem
        {
            Id = taskItem.Id,
            Name = taskItem.Name,
            TeamId = taskItem.TeamId,
            AssignedTo = taskItem.AssignedTo,
            CreatedBy = taskItem.CreatedBy,
            IsPrivate = taskItem.IsPrivate
        };
        
        var commentForBackground = new TaskComment
        {
            Id = entity.Id,
            TaskItemId = entity.TaskItemId,
            Content = entity.Content,
            CreatedBy = entity.CreatedBy,
            CreatedAt = entity.CreatedAt,
            CreatedByUser = new User
            {
                Id = entity.CreatedByUser.Id,
                FirstName = entity.CreatedByUser.FirstName,
                LastName = entity.CreatedByUser.LastName,
            }
        };
        
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                
                await scopedNotificationService.SendTaskCommentCreatedNotificationsAsync(taskItemForBackground, commentForBackground, currentUserId);
            }
            catch (Exception ex)
            {
                // Use a logger from the scope if available, otherwise use a static logger
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var logger = scope.ServiceProvider.GetRequiredService<ILogger<TaskCommentService>>();
                    logger.LogError(ex, "Background notification processing failed for AddAsync comment ID {CommentId}, task ID {TaskItemId}", commentId, taskItemId);
                }
                catch
                {
                    // Fallback: at least log to console if we can't get a logger
                    Console.WriteLine($"Background notification processing failed for AddAsync comment ID {commentId}, task ID {taskItemId}: {ex.Message}");
                }
            }
        });

        return new DataResponse<Dtos.TaskCommentResponse>
        {
            Data = new Dtos.TaskCommentResponse
            {
                Id = entity.Id,
                TaskId = entity.TaskItemId,
                UserId = entity.CreatedBy,
                Content = entity.Content,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                CreatedByUser = entity.CreatedByUser.ToDto(),
            },
            Success = true,
            Message = "Comment added successfully"
        };
    }

    public async Task<DataResponse<TaskCommentResponse>> UpdateAsync(TaskCommentUpdateRequest request)
    {

        if (request.Id <= 0)
            throw new ArgumentException("Invalid CommentId");
        if (string.IsNullOrWhiteSpace(request.Content))
            throw new ArgumentException("Content cannot be empty");

        var existingComment = await _taskComments.GetAsync(request.Id)
            ?? throw new ArgumentException("Comment not found");

        if (_currentUser.UserId != existingComment.CreatedBy)
        {
            throw new UnauthorizedAccessException("You do not have permission to update this comment.");
        }

        var previousValue = existingComment.Content;
        existingComment.Content = request.Content;
        existingComment.UpdatedAt = DateTimeOffset.UtcNow;
        existingComment.UpdatedBy = _currentUser.UserId;

        await _taskComments.UpdateAsync(existingComment);

        var taskItem = await _taskItems.GetAsync(existingComment.TaskItemId)
            ?? throw new ArgumentException("Task not found");

        // Fire and forget background operations - don't await these
        var taskItemId = taskItem.Id;
        var commentId = existingComment.Id;
        var currentUserId = _currentUser.UserId;
        var previousValueForBackground = previousValue;
        
        // Clone objects to avoid reference issues with disposed contexts
        var taskItemForBackground = new TaskItem
        {
            Id = taskItem.Id,
            Name = taskItem.Name,
            TeamId = taskItem.TeamId,
            AssignedTo = taskItem.AssignedTo,
            CreatedBy = taskItem.CreatedBy,
            IsPrivate = taskItem.IsPrivate,
        };
        
        var commentForBackground = new TaskComment
        {
            Id = existingComment.Id,
            TaskItemId = existingComment.TaskItemId,
            Content = existingComment.Content,
            CreatedBy = existingComment.CreatedBy,
            CreatedAt = existingComment.CreatedAt,
            UpdatedBy = existingComment.UpdatedBy,
            UpdatedAt = existingComment.UpdatedAt,
            CreatedByUser = new User
            {
                Id = existingComment.CreatedByUser.Id,
                FirstName = existingComment.CreatedByUser.FirstName,
                LastName = existingComment.CreatedByUser.LastName,
            }
        };
        
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                
                await scopedNotificationService.SendTaskCommentUpdatedNotificationsAsync(taskItemForBackground, commentForBackground, previousValueForBackground, currentUserId);
            }
            catch (Exception ex)
            {
                // Use a logger from the scope if available, otherwise use a static logger
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var logger = scope.ServiceProvider.GetRequiredService<ILogger<TaskCommentService>>();
                    logger.LogError(ex, "Background notification processing failed for UpdateAsync comment ID {CommentId}, task ID {TaskItemId}", commentId, taskItemId);
                }
                catch
                {
                    // Fallback: at least log to console if we can't get a logger
                    Console.WriteLine($"Background notification processing failed for UpdateAsync comment ID {commentId}, task ID {taskItemId}: {ex.Message}");
                }
            }
        });

        return new DataResponse<TaskCommentResponse>
        {
            Data = new TaskCommentResponse
            {
                Id = existingComment.Id,
                TaskId = existingComment.TaskItemId,
                UserId = existingComment.CreatedBy,
                Content = existingComment.Content,
                CreatedAt = existingComment.CreatedAt,
                UpdatedAt = existingComment.UpdatedAt,
                CreatedByUser = existingComment.CreatedByUser.ToDto(),
                UpdatedByUser = existingComment.UpdatedByUser?.ToDto()
            },
            Success = true,
            Message = "Comment updated successfully"
        };
    }

    public async Task DeleteAsync(long commentId)
    {
        if (commentId <= 0)
            throw new ArgumentException("Invalid CommentId");

        var existingComment = await _taskComments.GetAsync(commentId)
            ?? throw new ArgumentException("Comment not found");

        if (!_currentUser.IsAdmin && _currentUser.UserId != existingComment.CreatedBy)
        {
            throw new UnauthorizedAccessException("You do not have permission to delete this comment.");
        }

        var taskItem = await _taskItems.GetAsync(existingComment.TaskItemId)
            ?? throw new ArgumentException("Task not found");
            
        // Clone objects before deletion to avoid reference issues with disposed contexts
        var taskItemForBackground = new TaskItem
        {
            Id = taskItem.Id,
            Name = taskItem.Name,
            TeamId = taskItem.TeamId,
            AssignedTo = taskItem.AssignedTo,
            CreatedBy = taskItem.CreatedBy,
            IsPrivate = taskItem.IsPrivate
        };
        
        var commentForBackground = new TaskComment
        {
            Id = existingComment.Id,
            TaskItemId = existingComment.TaskItemId,
            Content = existingComment.Content,
            CreatedBy = existingComment.CreatedBy,
            CreatedAt = existingComment.CreatedAt,
            UpdatedBy = existingComment.UpdatedBy,
            UpdatedAt = existingComment.UpdatedAt,
            CreatedByUser = new User
            {
                Id = existingComment.CreatedByUser.Id,
                FirstName = existingComment.CreatedByUser.FirstName,
                LastName = existingComment.CreatedByUser.LastName,
            }
        };
        
        await _taskComments.DeleteAsync(commentId);

        // Fire and forget background operations - don't await these
        var taskItemId = taskItem.Id;
        var currentUserId = _currentUser.UserId;
        
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                
                await scopedNotificationService.SendTaskCommentDeletedNotificationsAsync(taskItemForBackground, commentForBackground, currentUserId);
            }
            catch (Exception ex)
            {
                // Use a logger from the scope if available, otherwise use a static logger
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var logger = scope.ServiceProvider.GetRequiredService<ILogger<TaskCommentService>>();
                    logger.LogError(ex, "Background notification processing failed for DeleteAsync comment ID {CommentId}, task ID {TaskItemId}", commentForBackground.Id, taskItemId);
                }
                catch
                {
                    // Fallback: at least log to console if we can't get a logger
                    Console.WriteLine($"Background notification processing failed for DeleteAsync comment ID {commentForBackground.Id}, task ID {taskItemId}: {ex.Message}");
                }
            }
        });
    }
}

