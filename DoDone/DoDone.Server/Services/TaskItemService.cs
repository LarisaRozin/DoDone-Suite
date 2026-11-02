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
using DoDone.Server.Services.Common;
using DoDone.Shared;
using DoDone.Shared.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace DoDone.Server.Services;

public interface ITaskItemService 
{
    Task<DataResponse<TaskItemDetailsResponse>> CreateAsync(TaskItemCreateRequest request);
    Task<DataResponse<TaskItemDetailsResponse>> UpdateAsync(TaskItemUpdateRequest request);
    Task<DataResponse<TaskItemResponse>> GetAsync(long id);
    Task<DataResponse<TaskItemDetailsResponse>> GetTaskItemEntityDetailsAsync(long id);
    Task<PagedTaskItemListResponse> GetPagedListAsync(PagedTaskItemListRequest request);
    Task<PagedTaskItemDetailsListResponse> GetPagedListDetailsAsync(PagedTaskItemListRequest request);
    Task DeleteAsync(long id);
    // TODO: single notification for bulk actions and task updates
    Task DeleteAsync(List<long> taskItemIds);
    Task ArchiveAsync(long id, bool archive = true);
    Task ArchiveAsync(List<long> taskItemIds, bool archive = true);
    Task PinAsync(long id, bool pin = true);
    Task PinAsync(List<long> taskItemIds, bool pin = true);
    Task SetActiveAsync(long id, bool active = true);
    Task SetActiveAsync(List<long> taskItemIds, bool active = true);
    Task SetCompleteAsync(long id, bool complete = true);
    Task SetCompleteAsync(List<long> taskItemIds, bool complete = true);
    Task<TaskItemResponse> CopyAsync(long id);
    Task CopyAsync(List<long> taskItemIds);
    Task ApproveBonus(BonusApprovalRequest request);
    Task ClaimBonusAsync(long id);
    Task ApproveTaskItemAllowance(TaskItemAllowanceApprovalRequest request);
    Task UpdateTaskItemTaskDetailsAsync(TaskItemTaskDetailsUpdateRequest request);
    Task<DataResponse<string>> GetTaskDetailsAsync(long id);
    Task ResetTaskGradesOnIntervalChangeAsync();
}

public class TaskItemService :
    ITaskItemService
{
    private readonly ITaskItemRepository _taskItems;
    private readonly ICurrentUserService _currentUser;
    private readonly ITeamService _teamService;
    private readonly ITeamRepository _teamRepository;
    private readonly INotificationService _notificationService;
    private readonly IQueryableTaskItemProcessorService _queryProcessor;
    private readonly ILogger<TaskItemService> _logger;
    private readonly IUserRepository _userRepository;
    private readonly IAllowanceCalculationService _allowanceCalculationService;
    private readonly IAllowanceHistoryService _allowanceHistoryService;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILexiconService _lexiconService;
    private readonly ISubscriptionService _subscriptionService;
    private readonly IServiceScopeFactory _serviceScopeFactory;


    public TaskItemService(ITaskItemRepository taskItems,
                           ICurrentUserService currentUser,
                           ITeamService teamService,
                           ITeamRepository teamRepository,
                           INotificationService notificationService,
                           IQueryableTaskItemProcessorService queryProcessor,
                           IUserRepository userRepository,
                           IAllowanceCalculationService allowanceCalculationService,
                           IAllowanceHistoryService allowanceHistoryService,
                           ILogger<TaskItemService> logger,
                           IDateTimeProvider dateTimeProvider,
                           ILexiconService lexiconService,
                           ISubscriptionService subscriptionService,
                           IServiceScopeFactory serviceScopeFactory)
    {
        _taskItems = taskItems;
        _currentUser = currentUser;
        // TODO: pack responses in Controllers instead of Services
        _teamService = teamService;
        _teamRepository = teamRepository;
        _notificationService = notificationService;
        _queryProcessor = queryProcessor;
        _userRepository = userRepository;
        _allowanceCalculationService = allowanceCalculationService;
        _allowanceHistoryService = allowanceHistoryService;
        _logger = logger;
        _dateTimeProvider = dateTimeProvider;
        _lexiconService = lexiconService;
        _subscriptionService = subscriptionService;
        _serviceScopeFactory = serviceScopeFactory;
    }

    private  void SetCreationAuditFields(TaskItem entity)
    {
        entity.CreatedBy = _currentUser.UserId;
        entity.CreatedAt = _dateTimeProvider.UtcNow;
    }

    private  void SetUpdateAuditFields(TaskItem entity)
    {
        entity.UpdatedBy = _currentUser.UserId;
        entity.UpdatedAt = _dateTimeProvider.UtcNow;
    }

    private Task<TaskItem> MapCreateRequestToEntity(TaskItemCreateRequest request)
    {
        var newItem = new TaskItem
        {
            TeamId = _currentUser.TeamId,
            GroupId = request.GroupId,
            KindId = request.KindId,
            CategoryId = request.CategoryId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IsActive = request.IsActive,
            IsArchived = request.IsArchived,
            IsPrivate = request.IsPrivate,
            Priority = request.Priority,
            Credits = request.Credits,
            GradeId = request.GradeId,
            MaxBonus = request.MaxBonus?.Trim(),
            DueAt = request.DueAt != null ? request.DueAt.Value.Date : null,
            StartAt = request.StartAt.HasValue ? request.StartAt.Value.Date : null,
            EndAt = request.EndAt.HasValue ? request.EndAt.Value.Date : null,
            PercentComplete = request.PercentComplete ?? 0,
            AssignedTo = request.AssignedTo,
            AssignedBy = request.AssignedTo.HasValue ? _currentUser.UserId : null,
            AssignedAt = request.AssignedTo.HasValue ? _dateTimeProvider.UtcNow : null,
            CreatedBy = _currentUser.UserId,
            CreatedAt = _dateTimeProvider.UtcNow,
            CompletedAt = request.PercentComplete == 100 ? _dateTimeProvider.UtcNow : null,
            CompletedBy = request.PercentComplete == 100 ? _currentUser.UserId : null,
            ActiveAt = request.IsActive ? _dateTimeProvider.UtcNow : null,
            ActiveBy = request.IsActive ? _currentUser.UserId : null,
            ArchivedAt = request.IsArchived ? _dateTimeProvider.UtcNow : null,
            ArchivedBy = request.IsArchived ? _currentUser.UserId : null,
            GradedAt = request.GradeId.HasValue ? _dateTimeProvider.UtcNow : null,
            GradedBy = request.GradeId.HasValue ? _currentUser.UserId : null,
            TeamAllowanceIntervalId = request.TeamAllowanceIntervalId,
        };

        if (request.IsPinned)
        {
            newItem.UserPins.Add(new UserTaskItemPin
            {
                UserId = _currentUser.UserId,
                TaskItemId = newItem.Id
            });
        }

        UpdateTaskItemUserPin(request.IsPinned, newItem);
        return Task.FromResult(newItem);
    }

    private  Task MapUpdateRequestToEntity(TaskItemUpdateRequest request, TaskItem entity)
    {
        entity.GroupId = request.GroupId;
        entity.KindId = request.KindId;
        entity.CategoryId = request.CategoryId;
        entity.Name = string.IsNullOrWhiteSpace(request.Name) ? entity.Name : request.Name.Trim();
        entity.Description = request.Description?.Trim();
        entity.IsPrivate = request.IsPrivate;
        entity.Priority = request.Priority;
        entity.Credits = request.Credits;
        entity.MaxBonus = request.MaxBonus?.Trim();
        entity.DueAt = request.DueAt;
        entity.StartAt = request.StartAt;
        entity.EndAt = request.EndAt;
        entity.AssignedBy = request.AssignedTo.HasValue && request.AssignedTo != entity.AssignedTo
            ? _currentUser.UserId
            : request.AssignedTo.HasValue == false ? null : entity.AssignedBy;
        entity.AssignedAt = request.AssignedTo.HasValue && request.AssignedTo != entity.AssignedTo
            ? _dateTimeProvider.UtcNow
            : request.AssignedTo.HasValue == false ? null : entity.AssignedAt;
        entity.AssignedTo = request.AssignedTo;
        entity.UpdatedBy = _currentUser.UserId;
        entity.UpdatedAt = _dateTimeProvider.UtcNow;
        entity.CompletedAt = request.PercentComplete != entity.PercentComplete && request.PercentComplete == 100
            ? _dateTimeProvider.UtcNow : entity.CompletedAt;
        entity.CompletedBy = request.PercentComplete != entity.PercentComplete && request.PercentComplete == 100
            ? _currentUser.UserId : entity.CompletedBy;
        entity.PercentComplete = request.PercentComplete ?? entity.PercentComplete;
        entity.ActiveAt = request.IsActive != entity.IsActive ? _dateTimeProvider.UtcNow : entity.ActiveAt;
        entity.ActiveBy = request.IsActive != entity.IsActive ? _currentUser.UserId : entity.ActiveBy;
        entity.IsActive = request.IsActive;
        entity.ArchivedAt = request.IsArchived != entity.IsArchived ? _dateTimeProvider.UtcNow : entity.ArchivedAt;
        entity.ArchivedBy = request.IsArchived != entity.IsArchived ? _currentUser.UserId : entity.ArchivedBy;
        entity.IsArchived = request.IsArchived;
        entity.GradedAt = request.GradeId.HasValue && request.GradeId != entity.GradeId
            ? _dateTimeProvider.UtcNow : entity.GradedAt;
        entity.GradedBy = request.GradeId.HasValue && request.GradeId != entity.GradeId
            ? _currentUser.UserId : entity.GradedBy;
        entity.GradeId = request.GradeId;
        entity.TeamAllowanceIntervalId = request.TeamAllowanceIntervalId;

        UpdateTaskItemUserPin(request.IsPinned, entity);

        return Task.CompletedTask;
    }

    private void UpdateTaskItemUserPin(bool IsPinned, TaskItem entity)
    {
        if (IsPinned)
        {
            if (!entity.UserPins.Any(up => up.UserId == _currentUser.UserId && up.TaskItemId == entity.Id))
            {
                entity.UserPins.Add(new UserTaskItemPin
                {
                    UserId = _currentUser.UserId,
                    TaskItemId = entity.Id
                });
            }
        }
        else
        {
            var existingPin = entity.UserPins.FirstOrDefault(up => up.UserId == _currentUser.UserId && up.TaskItemId == entity.Id);
            if (existingPin != null)
            {
                entity.UserPins.Remove(existingPin);
            }
        }
    }

    private  Task<TaskItemResponse> MapEntityToResponse(TaskItem entity)
    {
        return Task.FromResult(entity.ToDto(_currentUser.UserId));
    }

    private  Task<TaskItemDetailsResponse> MapEntityToDetailsResponse(TaskItem entity)
    {
        return Task.FromResult(entity.ToDetailsDto(_currentUser.UserId));
    }

    public async Task ClaimBonusAsync(long id)
    {
        var taskItem = await _taskItems.GetTaskItemEntityDetailsForUpdateAsync(id);
        if (taskItem == null)
        {
            throw new ArgumentException($"TaskItem with ID {id} not found");
        }

        if (taskItem.AssignedTo != _currentUser.UserId)
        {
            throw new InvalidOperationException($"TaskItem with ID {id} is not assigned to the current user and cannot be claimed");
        }

        if (taskItem.IsBonusRejected)
        {
            throw new InvalidOperationException($"TaskItem with ID {id} has its bonus rejected and cannot be claimed");
        }

        taskItem.BonusClaimedAt = _dateTimeProvider.UtcNow;

        await _taskItems.UpdateAsync(taskItem);
        await _taskItems.SaveChangesAsync();

        // Fire and forget background operations - don't await these
        var teamId = _currentUser.TeamId;
        var taskItemId = taskItem.Id;
        var entityForBackground = taskItem.Clone();
        
        long currentUserId = _currentUser.UserId;
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                
                await scopedNotificationService.SendBonusClaimedNotificationsAsync(entityForBackground, currentUserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background notification processing failed for ClaimBonusAsync TaskItem ID {TaskItemId}", taskItemId);
            }
        });
    }

    public async Task ApproveBonus(BonusApprovalRequest request)
    {
        if (!_currentUser.IsAdmin)
        {
            throw new UnauthorizedAccessException("Only admins can approve or reject bonuses.");
        }

        var taskItem = await _taskItems.GetTaskItemEntityDetailsForUpdateAsync(request.TaskItemId);
        if (taskItem == null)
        {
            throw new ArgumentException($"TaskItem with ID {request.TaskItemId} not found");
        }

        if (string.IsNullOrWhiteSpace(request.ApprovedBonus) && request.IsApproved)
        {
            throw new InvalidOperationException($"TaskItem with ID {request.TaskItemId} cannot be approved with empty bonus");
        }

        if (string.IsNullOrWhiteSpace(taskItem.MaxBonus))
        {
            taskItem.MaxBonus = request.ApprovedBonus?.Trim();
        }

        taskItem.IsBonusRejected = !request.IsApproved;
        taskItem.ApprovedBonus = request.IsApproved ? request.ApprovedBonus?.Trim() : null;
        taskItem.BonusStatusBy = _currentUser.UserId;
        taskItem.BonusStatusAt = _dateTimeProvider.UtcNow;
        taskItem.BonusStatusComment = request.Comment?.Trim();

        await _taskItems.UpdateAsync(taskItem);
        await _taskItems.SaveChangesAsync();

        // Fire and forget background operations - don't await these
        var teamId = _currentUser.TeamId;
        var taskItemId = taskItem.Id;
        var entityForBackground = taskItem.Clone();
        var isApproved = request.IsApproved;
        long currentUserId = _currentUser.UserId;
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                
                if (isApproved)
                    await scopedNotificationService.SendBonusApprovedNotificationsAsync(entityForBackground, currentUserId);
                else
                    await scopedNotificationService.SendBonusRejectedNotificationsAsync(entityForBackground, currentUserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background notification processing failed for ApproveBonus TaskItem ID {TaskItemId}", taskItemId);
            }
        });
    }

    public async Task ApproveTaskItemAllowance(TaskItemAllowanceApprovalRequest request)
    {
        if (!_currentUser.IsAdmin)
        {
            throw new UnauthorizedAccessException("Only admins can approve or reject task item.");
        }

        var taskItem = await _taskItems.GetTaskItemEntityDetailsForUpdateAsync(request.TaskItemId);
        if (taskItem == null)
        {
            throw new ArgumentException($"TaskItem with ID {request.TaskItemId} not found");
        }

        var taskItemBeforeUpdate = taskItem.Clone();    

        taskItem.IsApprovedForAllowance = request.IsApproved;
        taskItem.AllowanceApprovalStatusBy = _currentUser.UserId;
        taskItem.AllowanceApprovalStatusAt = _dateTimeProvider.UtcNow;
        taskItem.AllowanceApprovalStatusComment = request.Comment;
        taskItem.TeamAllowanceIntervalId = request.TeamAllowanceIntervalId;

        await _taskItems.SaveChangesAsync();

        // Fire and forget background operations - don't await these
        var teamId = _currentUser.TeamId;
        var taskItemId = taskItem.Id;
        var entityForBackground = taskItem.Clone();
        var entityBeforeUpdateForBackground = taskItemBeforeUpdate?.Clone();
        var isApproved = request.IsApproved;
        long currentUserId = _currentUser.UserId;
        
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                var scopedTeamService = scope.ServiceProvider.GetRequiredService<ITeamService>();
                var scopedAllowanceService = scope.ServiceProvider.GetRequiredService<IAllowanceCalculationService>();
                var scopedTeamRepository = scope.ServiceProvider.GetRequiredService<DoDone.Db.Repositories.ITeamRepository>();
                var scopedUserRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
                var scopedLexiconService = scope.ServiceProvider.GetRequiredService<ILexiconService>();
                var scopedTaskItemRepository = scope.ServiceProvider.GetRequiredService<ITaskItemRepository>();
                var scopedLogger = scope.ServiceProvider.GetRequiredService<ILogger<TaskItemService>>();
                
                bool isBusiness = await scopedTeamService.IsBusiness();
                if (isApproved)
                    await scopedNotificationService.SendTaskAllowanceApprovedNotificationsAsync(entityForBackground, isBusiness, currentUserId);
                else
                    await scopedNotificationService.SendTaskAllowanceRejectedNotificationsAsync(entityForBackground, isBusiness, currentUserId);

                await RecalculateUserAllowanceWithScopedServicesAsync(entityForBackground, entityBeforeUpdateForBackground, scopedAllowanceService, scopedTeamRepository, scopedUserRepository, scopedLexiconService, scopedTaskItemRepository, scopedLogger, teamId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background processing failed for ApproveTaskItemAllowance TaskItem ID {TaskItemId}", taskItemId);
            }
        });
    }

    public async Task ArchiveAsync(long id, bool archiving = true)
    {
        var taskItem = await _taskItems.GetTaskItemEntityDetailsForUpdateAsync(id);
        if (taskItem == null)
        {
            throw new ArgumentException($"TaskItem with ID {id} not found");
        }

        if (!_currentUser.IsAdmin && taskItem.CreatedBy != _currentUser.UserId)
        {
            throw new UnauthorizedAccessException("Only admins or the creator of the task item can archive it.");
        }

        await _taskItems.ArchiveAsync(id, _currentUser.UserId, archiving);
        await _taskItems.SaveChangesAsync();

        // Fire and forget background operations - don't await these
        var teamId = _currentUser.TeamId;
        var taskItemId = taskItem.Id;
        var entityForBackground = taskItem.Clone();
        var isArchiving = archiving;
        long currentUserId = _currentUser.UserId;
        
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                var scopedAllowanceService = scope.ServiceProvider.GetRequiredService<IAllowanceCalculationService>();
                var scopedTeamRepository = scope.ServiceProvider.GetRequiredService<DoDone.Db.Repositories.ITeamRepository>();
                var scopedUserRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
                var scopedLexiconService = scope.ServiceProvider.GetRequiredService<ILexiconService>();
                var scopedTaskItemRepository = scope.ServiceProvider.GetRequiredService<ITaskItemRepository>();
                var scopedLogger = scope.ServiceProvider.GetRequiredService<ILogger<TaskItemService>>();
                
                if (isArchiving)
                    await scopedNotificationService.SendTaskArchivedNotificationsAsync(entityForBackground, currentUserId);
                else
                    await scopedNotificationService.SendTaskUnarchivedNotificationsAsync(entityForBackground, currentUserId);

                await RecalculateUserAllowanceWithScopedServicesAsync(entityForBackground, null, scopedAllowanceService, scopedTeamRepository, scopedUserRepository, scopedLexiconService, scopedTaskItemRepository, scopedLogger, teamId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background processing failed for ArchiveAsync TaskItem ID {TaskItemId}", taskItemId);
            }
        });
    }

    public async Task ArchiveAsync(List<long> taskItemIds, bool archiving = true)
    {

        var taskItems = await _taskItems.GetListAsync(taskItemIds);
        if (!_currentUser.IsAdmin)
        {
            var unauthorizedItems = taskItems.Where(t => t.CreatedBy != _currentUser.UserId).ToList();
            if (unauthorizedItems.Any())
            {
                throw new UnauthorizedAccessException("Only admins or the creator of the task items can archive them.");
            }
        }

        await _taskItems.ArchiveAsync(taskItemIds, _currentUser.UserId, archiving);

        // Fire and forget background operations - don't await these
        var teamId = _currentUser.TeamId;
        var entitiesForBackground = taskItems.Select(t => t.Clone()).ToList();
        var isArchiving = archiving;
        long currentUserId = _currentUser.UserId;

        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                var scopedAllowanceService = scope.ServiceProvider.GetRequiredService<IAllowanceCalculationService>();
                var scopedTeamRepository = scope.ServiceProvider.GetRequiredService<DoDone.Db.Repositories.ITeamRepository>();
                var scopedUserRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
                var scopedLexiconService = scope.ServiceProvider.GetRequiredService<ILexiconService>();
                var scopedTaskItemRepository = scope.ServiceProvider.GetRequiredService<ITaskItemRepository>();
                var scopedLogger = scope.ServiceProvider.GetRequiredService<ILogger<TaskItemService>>();

                foreach (var item in entitiesForBackground)
                {
                    if (isArchiving)
                        await scopedNotificationService.SendTaskArchivedNotificationsAsync(item, currentUserId);
                    else
                        await scopedNotificationService.SendTaskUnarchivedNotificationsAsync(item, currentUserId);

                    await RecalculateUserAllowanceWithScopedServicesAsync(item, null, scopedAllowanceService, scopedTeamRepository, scopedUserRepository, scopedLexiconService, scopedTaskItemRepository, scopedLogger, teamId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background processing failed for ArchiveAsync bulk operation with {Count} items", entitiesForBackground.Count);
            }
        });
    }

    async Task ITaskItemService.DeleteAsync(long id)
    {
        var taskItem = await _taskItems.GetTaskItemEntityDetailsForUpdateAsync(id);
        if (taskItem == null)
        {
            throw new ArgumentException($"TaskItem with ID {id} not found");
        }

        if (!_currentUser.IsAdmin && taskItem.CreatedBy != _currentUser.UserId)
        {
            throw new UnauthorizedAccessException("Only admins or the creator of the task item can delete it.");
        }

        var existingEntityBeforeUpdate = taskItem.Clone();
        await _taskItems.DeleteAsync(id);
        await _taskItems.SaveChangesAsync();
        
        // Fire and forget background operations - don't await these
        var teamId = _currentUser.TeamId;
        var taskItemId = taskItem.Id;
        var entityBeforeDeleteForBackground = existingEntityBeforeUpdate.Clone();
        long currentUserId = _currentUser.UserId;
        
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                var scopedAllowanceService = scope.ServiceProvider.GetRequiredService<IAllowanceCalculationService>();
                var scopedTeamRepository = scope.ServiceProvider.GetRequiredService<DoDone.Db.Repositories.ITeamRepository>();
                var scopedUserRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
                var scopedLexiconService = scope.ServiceProvider.GetRequiredService<ILexiconService>();
                var scopedTaskItemRepository = scope.ServiceProvider.GetRequiredService<ITaskItemRepository>();
                var scopedLogger = scope.ServiceProvider.GetRequiredService<ILogger<TaskItemService>>();
                
                await scopedNotificationService.SendTaskDeletedNotificationsAsync(entityBeforeDeleteForBackground, currentUserId);
                await RecalculateUserAllowanceWithScopedServicesAsync(entityBeforeDeleteForBackground, null, scopedAllowanceService, scopedTeamRepository, scopedUserRepository, scopedLexiconService, scopedTaskItemRepository, scopedLogger, teamId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background processing failed for DeleteAsync TaskItem ID {TaskItemId}", taskItemId);
            }
        });
    }

    public async Task DeleteAsync(List<long> taskItemIds)
    {
        var taskItems = await _taskItems.GetListAsync(taskItemIds);
        var existingEntitiesBeforeUpdate = taskItems.Select(t => t.Clone()).ToList();

        if (!_currentUser.IsAdmin)
        {
            var unauthorizedItems = taskItems.Where(t => t.CreatedBy != _currentUser.UserId).ToList();
            if (unauthorizedItems.Any())
            {
                throw new UnauthorizedAccessException("Only admins or the creator of the task items can delete them.");
            }
        }

        await _taskItems.DeleteAsync(taskItemIds);
        // bulk updates save all changes in one go, so we don't need to call SaveChangesAsync here
        
        // Fire and forget background operations - don't await these
        var teamId = _currentUser.TeamId;
        var entitiesBeforeDeleteForBackground = existingEntitiesBeforeUpdate.Select(t => t.Clone()).ToList();
        long currentUserId = _currentUser.UserId;
        
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                var scopedAllowanceService = scope.ServiceProvider.GetRequiredService<IAllowanceCalculationService>();
                var scopedTeamRepository = scope.ServiceProvider.GetRequiredService<DoDone.Db.Repositories.ITeamRepository>();
                var scopedUserRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
                var scopedLexiconService = scope.ServiceProvider.GetRequiredService<ILexiconService>();
                var scopedTaskItemRepository = scope.ServiceProvider.GetRequiredService<ITaskItemRepository>();
                var scopedLogger = scope.ServiceProvider.GetRequiredService<ILogger<TaskItemService>>();

                foreach (var item in entitiesBeforeDeleteForBackground)
                {
                    await scopedNotificationService.SendTaskDeletedNotificationsAsync(item, currentUserId);
                    await RecalculateUserAllowanceWithScopedServicesAsync(item, null, scopedAllowanceService, scopedTeamRepository, scopedUserRepository, scopedLexiconService, scopedTaskItemRepository, scopedLogger, teamId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background processing failed for DeleteAsync bulk operation with {Count} items", entitiesBeforeDeleteForBackground.Count);
            }
        });
    }

    public async Task PinAsync(long id, bool pinnning = true)
    {
        await _taskItems.PinAsync(id, _currentUser.UserId, pinnning);
        await _taskItems.SaveChangesAsync();
    }

    public async Task PinAsync(List<long> taskItemIds, bool pinnning = true)
    {
        await _taskItems.PinAsync(taskItemIds, _currentUser.UserId, pinnning);
    }

    public async Task<TaskItemResponse> CopyAsync(long id)
    {
        var item = await _taskItems.CopyAsync(id, _currentUser.UserId);
        if (_currentUser.IsAdmin)
        {
            item.IsApprovedForAllowance = true;
            item.AllowanceApprovalStatusBy = _currentUser.UserId;
            item.AllowanceApprovalStatusAt = _dateTimeProvider.UtcNow;
            item.AllowanceApprovalStatusComment = "Auto-approved by admin";
        }

        await _taskItems.SaveChangesAsync();
        
        // Fire and forget background operations - don't await these
        var teamId = _currentUser.TeamId;
        var taskItemId = item.Id;
        var entityForBackground = item.Clone();
        long currentUserId = _currentUser.UserId;
        
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                
                await scopedNotificationService.SendTaskCreatedNotificationsAsync(entityForBackground, currentUserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background notification processing failed for CopyAsync TaskItem ID {TaskItemId}", taskItemId);
            }
        });

        return item.ToDto(_currentUser.UserId);
    }

    public async Task CopyAsync(List<long> taskItemIds)
    {
        foreach (var id in taskItemIds)
        {
            await CopyAsync(id);
        }
    }
    public async Task SetCompleteAsync(List<long> taskItemIds, bool completing = true)
    {
        var taskItems = await _taskItems.GetListAsync(taskItemIds);
        if (!_currentUser.IsAdmin)
        {
            var unauthorizedItems = taskItems.Where(t => t.CreatedBy != _currentUser.UserId || !t.IsPrivate && t.IsApprovedForAllowance == true && t.AssignedTo.HasValue && t.AssignedTo.Value != _currentUser.UserId).ToList();
            if (unauthorizedItems.Any())
            {
                throw new UnauthorizedAccessException("You cannot complete a public task that is not assigned to you.");
            }
        }

        await _taskItems.SetCompleteAsync(taskItemIds, _currentUser.UserId, completing);
        await _taskItems.SaveChangesAsync();
        
        // Fire and forget background operations - don't await these
        var teamId = _currentUser.TeamId;
        var entitiesForBackground = taskItems.Select(t => t.Clone()).ToList();
        var isCompleting = completing;
        long currentUserId = _currentUser.UserId;
        
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                foreach (var item in entitiesForBackground)
                {
                    if (isCompleting)
                        await scopedNotificationService.SendTaskMarkedCompletedNotificationsAsync(item, currentUserId);
                    else
                        await scopedNotificationService.SendTaskMarkedIncompleteNotificationsAsync(item, currentUserId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background notification processing failed for SetCompleteAsync bulk operation with {Count} items", entitiesForBackground.Count);
            }
        });
    }

    public async Task SetCompleteAsync(long id, bool completing = true)
    {
        var item = await _taskItems.GetTaskItemEntityDetailsForUpdateAsync(id);
        if (item == null)
        {
            throw new ArgumentException($"TaskItem with ID {id} not found");
        }

        if (!_currentUser.IsAdmin && (item.CreatedBy != _currentUser.UserId || !item.IsPrivate && item.IsApprovedForAllowance == true && item.AssignedTo.HasValue && item.AssignedTo.Value != _currentUser.UserId))
        {
            throw new UnauthorizedAccessException("You cannot complete a public task that is not assigned to you.");
        }


        await _taskItems.SetCompleteAsync(id, _currentUser.UserId, completing);
        await _taskItems.SaveChangesAsync();

        // Fire and forget background operations - don't await these
        var teamId = _currentUser.TeamId;
        var taskItemId = item.Id;
        var entityForBackground = item.Clone();
        var isCompleting = completing;
        long currentUserId = _currentUser.UserId;
        
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                if (isCompleting)
                    await scopedNotificationService.SendTaskMarkedCompletedNotificationsAsync(entityForBackground, currentUserId);
                else
                    await scopedNotificationService.SendTaskMarkedIncompleteNotificationsAsync(entityForBackground, currentUserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background notification processing failed for SetCompleteAsync TaskItem ID {TaskItemId}", taskItemId);
            }
        });
    }

    public async Task SetActiveAsync(long id, bool activating = true)
    {
        var item = await _taskItems.GetTaskItemEntityDetailsForUpdateAsync(id);
        if (item == null)
        {
            throw new ArgumentException($"TaskItem with ID {id} not found");
        }

        if (!_currentUser.IsAdmin && (item.CreatedBy != _currentUser.UserId || !item.IsPrivate && item.IsApprovedForAllowance == true && item.AssignedTo.HasValue && item.AssignedTo.Value != _currentUser.UserId))
        {
            throw new UnauthorizedAccessException("You cannot activate a public task that is not assigned to you.");
        }

        await _taskItems.SetActiveAsync(id, _currentUser.UserId, activating);
        await _taskItems.SaveChangesAsync();

        // Fire and forget background operations - don't await these
        var teamId = _currentUser.TeamId;
        var taskItemId = item.Id;
        var entityForBackground = item.Clone();
        var isActivating = activating;
        long currentUserId = _currentUser.UserId;
        
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                if (isActivating)
                    await scopedNotificationService.SendTaskMarkedActiveNotificationsAsync(entityForBackground, currentUserId);
                else
                    await scopedNotificationService.SendTaskMarkedInactiveNotificationsAsync(entityForBackground, currentUserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background notification processing failed for SetActiveAsync TaskItem ID {TaskItemId}", taskItemId);
            }
        });
    }

    public async Task SetActiveAsync(List<long> taskItemIds, bool activating = true)
    {
        var taskItems = await _taskItems.GetListAsync(taskItemIds);
        if (!_currentUser.IsAdmin)
        {
            var unauthorizedItems = taskItems.Where(t => t.CreatedBy != _currentUser.UserId || !t.IsPrivate && t.IsApprovedForAllowance == true && t.AssignedTo.HasValue && t.AssignedTo.Value != _currentUser.UserId).ToList();
            if (unauthorizedItems.Any())
            {
                throw new UnauthorizedAccessException("You cannot activate a public task that is not assigned to you.");
            }
        }

        await _taskItems.SetActiveAsync(taskItemIds, _currentUser.UserId, activating);
        await _taskItems.SaveChangesAsync();

        // Fire and forget background operations - don't await these
        var teamId = _currentUser.TeamId;
        var entitiesForBackground = taskItems.Select(t => t.Clone()).ToList();
        var isActivating = activating;
        long currentUserId = _currentUser.UserId;
        
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                foreach (var item in entitiesForBackground)
                {
                    if (isActivating)
                        await scopedNotificationService.SendTaskMarkedActiveNotificationsAsync(item, currentUserId);
                    else
                        await scopedNotificationService.SendTaskMarkedInactiveNotificationsAsync(item, currentUserId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background notification processing failed for SetActiveAsync bulk operation with {Count} items", entitiesForBackground.Count);
            }
        });
    }

    private Task<string?> ValidateCreateRequest(TaskItemCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Task.FromResult<string?>("TaskItem name is required");

        // Add more validation as needed
        return Task.FromResult<string?>(null);
    }

    public async Task<DataResponse<TaskItemDetailsResponse>> CreateAsync(TaskItemCreateRequest request)
    {
        if (request == null)
            throw new ArgumentException($"Invalid {typeof(TaskItem).Name} data");

        // Custom validation hook
        var customValidationError = await ValidateCreateRequest(request);
        if (!string.IsNullOrEmpty(customValidationError))
        {
            return new DataResponse<TaskItemDetailsResponse>
            {
                Success = false,
                Message = customValidationError
            };
        }

        var entity = await MapCreateRequestToEntity(request);
        if (_currentUser.IsAdmin)
        {
            entity.IsApprovedForAllowance = true;
            entity.AllowanceApprovalStatusBy = _currentUser.UserId;
            entity.AllowanceApprovalStatusAt = _dateTimeProvider.UtcNow;
            entity.AllowanceApprovalStatusComment = "Auto-approved by admin";
        }
        SetCreationAuditFields(entity);

        await _taskItems.CreateAsync(entity);
        await _taskItems.SaveChangesAsync();

        // reload to get all related data
        var updatedEntity = await _taskItems.GetTaskItemEntityDetailsForUpdateAsync(entity.Id); 
        if (updatedEntity == null)
        {
            throw new Exception("Failed to load created TaskItem");
        }

        // Fire and forget background operations - don't await these
        var createRequestTeamId = _currentUser.TeamId;
        var createdTaskItemId = updatedEntity.Id;
        
        // Clone entity to avoid reference issues with disposed contexts
        var entityForBackground = updatedEntity.Clone();
        long currentUserId = _currentUser.UserId;
        
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedAllowanceService = scope.ServiceProvider.GetRequiredService<IAllowanceCalculationService>();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                var scopedTeamRepository = scope.ServiceProvider.GetRequiredService<DoDone.Db.Repositories.ITeamRepository>();
                var scopedUserRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
                var scopedLexiconService = scope.ServiceProvider.GetRequiredService<ILexiconService>();
                var scopedTaskItemRepository = scope.ServiceProvider.GetRequiredService<ITaskItemRepository>();
                var scoppedLogger = scope.ServiceProvider.GetRequiredService<ILogger<TaskItemService>>();
                
                await RecalculateUserAllowanceWithScopedServicesAsync(entityForBackground, null, scopedAllowanceService, scopedTeamRepository, scopedUserRepository
                    , scopedLexiconService, scopedTaskItemRepository, scoppedLogger, createRequestTeamId);
                await scopedNotificationService.SendTaskCreatedNotificationsAsync(entityForBackground, currentUserId);
                await ProcessTaskItemUpdateNotificationsWithScopedServicesAsync(entityForBackground, null, scopedNotificationService, scopedTeamRepository, scopedLexiconService, scopedTaskItemRepository, createRequestTeamId, currentUserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background processing failed for created TaskItem ID {TaskItemId}", createdTaskItemId);
            }
        });

        return new DataResponse<TaskItemDetailsResponse>
        {
            Data = await MapEntityToDetailsResponse(updatedEntity),
            Success = true,
            Message = $"{typeof(TaskItem).Name} created successfully"
        };
    }

    public  async Task<DataResponse<TaskItemDetailsResponse>> UpdateAsync(TaskItemUpdateRequest request)
    {
        if (request == null)
            throw new ArgumentException($"Invalid {typeof(TaskItem).Name} data");

        var existingEntity = await _taskItems.GetTaskItemEntityDetailsForUpdateAsync(request.Id);
        if (existingEntity == null)
            throw new ArgumentException($"{typeof(TaskItem).Name} not found");

        if (!_currentUser.IsAdmin)
        {
            EnsureAuthorizedToUpdateTaskItem(existingEntity, request);
        }

        var existingEntityBeforeUpdate = existingEntity.Clone();

        await MapUpdateRequestToEntity(request, existingEntity);
        SetUpdateAuditFields(existingEntity);

        await _taskItems.UpdateAsync(existingEntity);
        await _taskItems.SaveChangesAsync();

        // Fire and forget background operations - don't await these
        var requestTeamId = _currentUser.TeamId;
        var taskItemId = existingEntity.Id;


        var existingEntityAfterUpdate = await _taskItems.GetTaskItemEntityDetailsForUpdateAsync(request.Id);
        if (existingEntityAfterUpdate == null)
            throw new ArgumentException($"{typeof(TaskItem).Name} not found");

        // Clone entities to avoid reference issues with disposed contexts
        var entityForBackground = existingEntityAfterUpdate.Clone();
        long currentUserId = _currentUser.UserId;
        // var entityBeforeUpdateForBackground = existingEntityBeforeUpdate?.Clone();

        CreateScopeAndRecalculateAllowanceWithRetry(existingEntityBeforeUpdate, requestTeamId, taskItemId, entityForBackground);

        CreateScopeAndSendNotifications(existingEntityBeforeUpdate, requestTeamId, currentUserId, taskItemId, entityForBackground);

        return new DataResponse<TaskItemDetailsResponse>
        {
            Data = await MapEntityToDetailsResponse(existingEntity),
            Success = true,
            Message = $"{typeof(TaskItem).Name} updated successfully"
        };
    }

    private void CreateScopeAndRecalculateAllowanceWithRetry(TaskItem existingEntityBeforeUpdate, long requestTeamId, long taskItemId, TaskItem existingEntity)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedAllowanceService = scope.ServiceProvider.GetRequiredService<IAllowanceCalculationService>();
                var scopedTeamRepository = scope.ServiceProvider.GetRequiredService<DoDone.Db.Repositories.ITeamRepository>();
                var scopedUserRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
                var scopedLexiconService = scope.ServiceProvider.GetRequiredService<ILexiconService>();
                var scopedTaskItemRepository = scope.ServiceProvider.GetRequiredService<ITaskItemRepository>();
                var scoppedLogger = scope.ServiceProvider.GetRequiredService<ILogger<TaskItemService>>();

                await RecalculateUserAllowanceWithScopedServicesAsync(existingEntity, existingEntityBeforeUpdate, scopedAllowanceService, scopedTeamRepository
                , scopedUserRepository, scopedLexiconService, scopedTaskItemRepository, scoppedLogger, requestTeamId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background allowance recalculation failed for TaskItem ID {TaskItemId}", taskItemId);
            }
        });
    }

    private void CreateScopeAndSendNotifications(TaskItem existingEntityBeforeUpdate, long requestTeamId, long curentUserId, long taskItemId, TaskItem entityForBackground)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                var scopedTeamRepository = scope.ServiceProvider.GetRequiredService<DoDone.Db.Repositories.ITeamRepository>();
                var scopedLexiconService = scope.ServiceProvider.GetRequiredService<ILexiconService>();
                var scopedTaskItemRepository = scope.ServiceProvider.GetRequiredService<ITaskItemRepository>();

                await ProcessTaskItemUpdateNotificationsWithScopedServicesAsync(entityForBackground, existingEntityBeforeUpdate, scopedNotificationService, scopedTeamRepository, scopedLexiconService, scopedTaskItemRepository, requestTeamId, curentUserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background notification processing failed for TaskItem ID {TaskItemId}", taskItemId);
            }
        });
    }

    private void EnsureAuthorizedToUpdateTaskItem(TaskItem existingEntity, TaskItemUpdateRequest request)
    {
        if (existingEntity.CreatedBy != _currentUser.UserId)
        {
            if (existingEntity.AssignedTo == _currentUser.UserId)
                EnsureAuthorizedToUpdateTaskItemFields(existingEntity, request);
            else
                throw new UnauthorizedAccessException("You cannot update a public task that is not assigned to you.");
        }
        else
        {
            if (!existingEntity.IsPrivate && existingEntity.IsApprovedForAllowance == true)
            {
                if (existingEntity.AssignedTo == _currentUser.UserId)
                    EnsureAuthorizedToUpdateTaskItemFields(existingEntity, request);
                else
                    throw new UnauthorizedAccessException("You cannot update a public task that is not assigned to you.");
            }
        }
    }

    private void EnsureAuthorizedToUpdateTaskItemFields(TaskItem existingEntity, TaskItemUpdateRequest request)
    {
        if (existingEntity.Name.Trim() != request.Name.Trim()
            || existingEntity.Description?.Trim() != request.Description
            || existingEntity.Priority != request.Priority
            || existingEntity.Credits != request.Credits
            || existingEntity.GradeId != request.GradeId
            || existingEntity.DueAt?.Date != request.DueAt?.Date
            || existingEntity.StartAt?.Date != request.StartAt?.Date
            || existingEntity.EndAt?.Date != request.EndAt?.Date
            || existingEntity.GroupId != request.GroupId
            || existingEntity.KindId != request.KindId
            || existingEntity.CategoryId != request.CategoryId
            || existingEntity.AssignedTo != request.AssignedTo
            || existingEntity.IsArchived != request.IsArchived
            || existingEntity.IsPrivate != request.IsPrivate
            || existingEntity.MaxBonus != request.MaxBonus
            || existingEntity.TeamId != _currentUser.TeamId
            || existingEntity.TeamAllowanceIntervalId != request.TeamAllowanceIntervalId

        )
            throw new UnauthorizedAccessException("You are only authorized to change public task's Active status, % Complete and task's Details text. You can also add task comments. You cannot change other task properties");
    }

    private async Task ProcessTaskItemUpdateNotificationsAsync(TaskItem existingEntityAfterUpdate, TaskItem? existingEntityBeforeUpdate, long curentUserId)
    {

        // Task Assignment changes
        if (existingEntityBeforeUpdate == null)
        {
            if (existingEntityAfterUpdate.AssignedTo.HasValue && existingEntityAfterUpdate.AssignedTo != existingEntityAfterUpdate.CreatedBy)
            {
                await _notificationService.SendTaskAssignedNotificationsAsync(existingEntityAfterUpdate, curentUserId);
            }
        }
        else
        {
            if (!existingEntityBeforeUpdate.AssignedTo.HasValue && existingEntityAfterUpdate.AssignedTo.HasValue)
            {
                await _notificationService.SendTaskAssignedNotificationsAsync(existingEntityAfterUpdate, curentUserId);
            }
            else if (!existingEntityAfterUpdate.AssignedTo.HasValue && existingEntityBeforeUpdate.AssignedTo.HasValue)
            {
                await _notificationService.SendTaskUnassignedNotificationsAsync(existingEntityBeforeUpdate, curentUserId);
            }
            if (existingEntityBeforeUpdate.AssignedTo.HasValue && existingEntityAfterUpdate.AssignedTo.HasValue && existingEntityBeforeUpdate.AssignedTo != existingEntityAfterUpdate.AssignedTo)
            {
                await _notificationService.SendTaskReassignedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate, curentUserId);
            }
        }

        // Task Completion changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for completion changes
        }
        else
        {
            if (existingEntityAfterUpdate.PercentComplete == 100 && existingEntityBeforeUpdate.PercentComplete < 100)
            {
                await _notificationService.SendTaskMarkedCompletedNotificationsAsync(existingEntityAfterUpdate, curentUserId);
            }
            else if (existingEntityBeforeUpdate.PercentComplete == 100 && existingEntityAfterUpdate.PercentComplete < 100)
            {
                await _notificationService.SendTaskMarkedIncompleteNotificationsAsync(existingEntityAfterUpdate, curentUserId);
            }
            else if (existingEntityBeforeUpdate.PercentComplete != existingEntityAfterUpdate.PercentComplete)
            {
                await _notificationService.SendTaskProgressUpdatedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate.PercentComplete, curentUserId);
            }
        }

        // Task Active/Inactive changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for active changes
        }
        else
        {
            if (existingEntityAfterUpdate.IsActive && !existingEntityBeforeUpdate.IsActive)
            {
                await _notificationService.SendTaskMarkedActiveNotificationsAsync(existingEntityAfterUpdate, curentUserId);
            }
            else if (!existingEntityAfterUpdate.IsActive && existingEntityBeforeUpdate.IsActive)
            {
                await _notificationService.SendTaskMarkedInactiveNotificationsAsync(existingEntityAfterUpdate, curentUserId);
            }
        }

        // Task Archived/Unarchived changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for archived changes
        }
        else
        {
            if (existingEntityAfterUpdate.IsArchived && !existingEntityBeforeUpdate.IsArchived)
            {
                await _notificationService.SendTaskArchivedNotificationsAsync(existingEntityAfterUpdate, curentUserId);
            }
            else if (!existingEntityAfterUpdate.IsArchived && existingEntityBeforeUpdate.IsArchived)
            {
                await _notificationService.SendTaskUnarchivedNotificationsAsync(existingEntityAfterUpdate, curentUserId);
            }
        }

        // Task Group changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for group changes
        }
        else if (existingEntityAfterUpdate.GroupId != existingEntityBeforeUpdate.GroupId)
        {
            await _notificationService.SendTaskGroupChangedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate.Group?.Name, curentUserId);
        }

        // Task Kind changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for kind changes
        }
        else if (existingEntityAfterUpdate.KindId != existingEntityBeforeUpdate.KindId)
        {
            await _notificationService.SendTaskKindChangedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate.Kind?.Name, curentUserId);
        }

        // Task Category changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for category changes
        }
        else if (existingEntityAfterUpdate.CategoryId != existingEntityBeforeUpdate.CategoryId)
        {
            await _notificationService.SendTaskCategoryChangedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate.Category?.Name, curentUserId);
        }

        // Task Details changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for details changes
        }
        else if (existingEntityAfterUpdate.Details != existingEntityBeforeUpdate.Details)
        {
            await _notificationService.SendTaskDetailsUpdatedNotificationsAsync(existingEntityAfterUpdate, curentUserId);
        }

        // Task Priority changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for priority changes
        }
        else if (existingEntityAfterUpdate.Priority != existingEntityBeforeUpdate.Priority)
        {
            await _notificationService.SendTaskPriorityChangedNotificationsAsync(existingEntityAfterUpdate, curentUserId, existingEntityBeforeUpdate.Priority);
        }

        // Task Credits changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for credits changes
        }
        else
        {
            if (existingEntityAfterUpdate.Credits.HasValue && !existingEntityBeforeUpdate.Credits.HasValue)
            {
                await _notificationService.SendTaskCreditsAssignedNotificationsAsync(existingEntityAfterUpdate, curentUserId);
            }
            else if (existingEntityAfterUpdate.Credits.HasValue && existingEntityBeforeUpdate.Credits.HasValue && existingEntityAfterUpdate.Credits != existingEntityBeforeUpdate.Credits)
            {
                await _notificationService.SendTaskCreditsChangedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate.Credits.Value, curentUserId);
            }
            else if (!existingEntityAfterUpdate.Credits.HasValue && existingEntityBeforeUpdate.Credits.HasValue)
            {
                await _notificationService.SendTaskCreditsRemovedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate.Credits.Value, curentUserId);
            }
        }

        // Task Grade changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for grade changes
        }
        else
        {
            if (existingEntityAfterUpdate.GradeId.HasValue && !existingEntityBeforeUpdate.GradeId.HasValue)
            {
                await _notificationService.SendTaskGradedNotificationsAsync(existingEntityAfterUpdate, curentUserId);
            }
            else
            {

                string existingLetterGrade = existingEntityBeforeUpdate.Grade?.LetterGrade ?? string.Empty;

                if (!existingEntityAfterUpdate.GradeId.HasValue && existingEntityBeforeUpdate.GradeId.HasValue)
                {
                    if (existingLetterGrade == string.Empty)
                    {
                        throw new InvalidOperationException("Inconsistent TaskItem data: GradeId is set but Grade is null");
                    }
                    await _notificationService.SendTaskGradeRemovedNotificationsAsync(existingEntityAfterUpdate, existingLetterGrade, curentUserId);
                }
                else if (existingEntityAfterUpdate.GradeId.HasValue && existingEntityBeforeUpdate.GradeId.HasValue && existingEntityAfterUpdate.GradeId != existingEntityBeforeUpdate.GradeId)
                {
                    if (existingLetterGrade == string.Empty)
                    {
                        throw new InvalidOperationException("Inconsistent TaskItem data: GradeId is set but Grade is null");
                    }
                    await _notificationService.SendTaskGradeChangedNotificationsAsync(existingEntityAfterUpdate, existingLetterGrade, curentUserId);
                }
            }
        }

        // Task Allowance Interval changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for allowance interval changes
        }
        else
        {
            string existingEntityBeforeUpdateIntervalName = existingEntityBeforeUpdate.TeamAllowanceInterval?.Name ?? string.Empty;
            bool isBusiness = await _teamService.IsBusiness();
            if (existingEntityBeforeUpdate.TeamAllowanceIntervalId.HasValue && !existingEntityAfterUpdate.TeamAllowanceIntervalId.HasValue)
            {
                await _notificationService.SendTaskAllowanceIntervalRemovedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdateIntervalName, isBusiness, curentUserId);
            }
            else if (!existingEntityBeforeUpdate.TeamAllowanceIntervalId.HasValue && existingEntityAfterUpdate.TeamAllowanceIntervalId.HasValue)
            {
                await _notificationService.SendTaskAllowanceIntervalAssignedNotificationsAsync(existingEntityAfterUpdate, isBusiness, curentUserId);
            }
            else if (existingEntityBeforeUpdate.TeamAllowanceIntervalId.HasValue && existingEntityAfterUpdate.TeamAllowanceIntervalId.HasValue
                     && existingEntityBeforeUpdate.TeamAllowanceIntervalId != existingEntityAfterUpdate.TeamAllowanceIntervalId)
            {
                await _notificationService.SendTaskAllowanceIntervalChangedNotificationsAsync(existingEntityAfterUpdate, curentUserId, existingEntityBeforeUpdateIntervalName);
            }
        }

        // Task Bonus changes
        if (!string.IsNullOrWhiteSpace(existingEntityAfterUpdate.MaxBonus) && (existingEntityBeforeUpdate == null || string.IsNullOrWhiteSpace(existingEntityBeforeUpdate?.MaxBonus)))
        {
            await _notificationService.SendBonusAssignedNotificationsAsync(existingEntityAfterUpdate, curentUserId);
        }
        else if (existingEntityBeforeUpdate != null && !string.IsNullOrWhiteSpace(existingEntityBeforeUpdate.MaxBonus) && string.IsNullOrWhiteSpace(existingEntityAfterUpdate.MaxBonus))
        {
            await _notificationService.SendBonusRemovedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate.MaxBonus, curentUserId);
        }
        else if (existingEntityBeforeUpdate != null && !string.IsNullOrWhiteSpace(existingEntityBeforeUpdate.MaxBonus) && !string.IsNullOrWhiteSpace(existingEntityAfterUpdate.MaxBonus) 
            && existingEntityAfterUpdate.MaxBonus != existingEntityBeforeUpdate.MaxBonus)
        {
            await _notificationService.SendBonusChangedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate.MaxBonus, curentUserId);
        }
    }

    private async Task RecalculateUserAllowanceAsync(long currentUserId, long teamId, TaskItem updatedEntity, TaskItem? originalEntity = null)
    {
        if (!updatedEntity.AssignedTo.HasValue && (!originalEntity?.AssignedTo.HasValue ?? false))
            return;
        if (!updatedEntity.TeamAllowanceIntervalId.HasValue && !(originalEntity?.TeamAllowanceIntervalId.HasValue ?? false))
            return;
        if (!updatedEntity.Credits.HasValue && !(originalEntity?.Credits.HasValue ?? false))
            return;
        if (!updatedEntity.GradeId.HasValue && !(originalEntity?.GradeId.HasValue ?? false))
            return;
        if (!updatedEntity.IsApprovedForAllowance && !(originalEntity?.IsApprovedForAllowance ?? false))
            return;

        if (originalEntity?.AssignedTo == updatedEntity.AssignedTo
            && originalEntity?.TeamAllowanceIntervalId == updatedEntity.TeamAllowanceIntervalId
            && originalEntity?.Credits == updatedEntity.Credits
            && originalEntity?.GradeId == updatedEntity.GradeId
            && originalEntity?.IsApprovedForAllowance == updatedEntity.IsApprovedForAllowance)
            return;

        if (originalEntity?.AssignedTo.HasValue ?? false)
        {
            var originalUser = await _userRepository.GetAsync(originalEntity.AssignedTo.Value);
            if (originalUser == null)
            {
                _logger.LogError("User with ID {UserId} not found for allowance recalculation", originalEntity.AssignedTo.Value);
                throw new InvalidOperationException($"User with ID {originalEntity.AssignedTo.Value} not found for allowance recalculation");
            }

            await RecalculateAllowanceIntervals(originalEntity.TeamAllowanceIntervalId, updatedEntity.TeamAllowanceIntervalId, originalUser, currentUserId, teamId);
        }

        if (updatedEntity.AssignedTo.HasValue && updatedEntity.AssignedTo != originalEntity?.AssignedTo)
        {
            var currentAssignedTo = await _userRepository.GetAsync(updatedEntity.AssignedTo.Value);
            if (currentAssignedTo == null)
            {
                _logger.LogError("User with ID {UserId} not found for allowance recalculation", updatedEntity.AssignedTo.Value);
                throw new InvalidOperationException($"User with ID {updatedEntity.AssignedTo.Value} not found for allowance recalculation");
            }
            await RecalculateAllowanceIntervals(originalEntity?.TeamAllowanceIntervalId, updatedEntity.TeamAllowanceIntervalId, currentAssignedTo, currentUserId, teamId);
        }   
    }

    private async Task RecalculateAllowanceIntervals(long? originalIntervalId, long? currentIntervalId, User user, long currentUserId, long teamId)
    {
        if (originalIntervalId.HasValue)
        {
            var originalAllowanceInterval = await _teamService.GetTeamAllowanceIntervalAsync(originalIntervalId.Value);
            if (originalAllowanceInterval == null)
            {
                _logger.LogError($"Failed to retrieve {_lexiconService.AllowanceLowercase(teamId)} interval with ID {originalIntervalId.Value} for {_lexiconService.TeamLowercase(_currentUser.TeamId)} ID {_currentUser.TeamId}");
                throw new InvalidOperationException($"Failed to retrieve allowance interval with ID {originalIntervalId.Value} for team ID {teamId}");
            }
            _logger.LogInformation("Starting allowance recalculation on interval change for original interval for user ID: {UserId}, Interval: {originalIntervalId} -> {currentIntervalId}", user.Id, originalIntervalId, currentIntervalId);
            await _allowanceCalculationService.RecalculateUserAllowanceAsync(user, originalAllowanceInterval, currentUserId);
        }

        if (currentIntervalId.HasValue)
        {
            var currentAllowanceInterval = await _teamService.GetTeamAllowanceIntervalAsync(currentIntervalId.Value);
            if (currentAllowanceInterval == null)
            {
                _logger.LogError($"Failed to retrieve {_lexiconService.AllowanceLowercase(teamId)} interval with ID {currentIntervalId.Value} for {_lexiconService.TeamLowercase(_currentUser.TeamId)} ID {_currentUser.TeamId}");
                throw new InvalidOperationException($"Failed to retrieve allowance interval with ID {currentIntervalId.Value} for team ID {teamId}");
            }
            _logger.LogInformation("Starting allowance recalculation on interval change for current interval for user ID: {UserId}, Interval: {originalIntervalId} -> {currentIntervalId}", user.Id, originalIntervalId, currentIntervalId);
            await _allowanceCalculationService.RecalculateUserAllowanceAsync(user, currentAllowanceInterval, currentUserId);
        }
    }

    public async Task<DataResponse<TaskItemResponse>> GetAsync(long id)
    {
        var entity = await _taskItems.GetAsync(id);
        if (entity == null)
            throw new ArgumentException($"{typeof(TaskItem).Name} not found");

        return new DataResponse<TaskItemResponse>
        {
            Data = await MapEntityToResponse(entity),
            Success = true,
            Message = $"{typeof(TaskItem).Name} retrieved successfully"
        };
    }

    public async Task<DataResponse<string>> GetTaskDetailsAsync(long id)
    {
        var details = await _taskItems.GetTaskDetails(id);
        if (details == null)
            throw new ArgumentException($"{typeof(TaskItem).Name} not found");

        return new DataResponse<string>
        {
            Data = details,
            Success = true,
            Message = $"{typeof(TaskItem).Name} details retrieved successfully"
        };
   }

    public async Task UpdateTaskItemTaskDetailsAsync(TaskItemTaskDetailsUpdateRequest request)
    {
        if (request == null)
            throw new ArgumentException($"Invalid {typeof(TaskItem).Name} data");

        var existingEntity = await _taskItems.GetTaskItemEntityDetailsForUpdateAsync(request.Id);
        if (existingEntity == null)
            throw new ArgumentException($"{typeof(TaskItem).Name} not found");

        var existingEntityBeforeUpdate = existingEntity.Clone();

        existingEntity.Details = request.TaskDetails;
        SetUpdateAuditFields(existingEntity);

        await _taskItems.UpdateAsync(existingEntity);
        await _taskItems.SaveChangesAsync();
        
        // Fire and forget background operations - don't await these
        var teamId = _currentUser.TeamId;
        var taskItemId = existingEntity.Id;
        var entityForBackground = existingEntity.Clone();
        var entityBeforeUpdateForBackground = existingEntityBeforeUpdate?.Clone();
        long currentUserId = _currentUser.UserId;
        
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                var scopedTeamRepository = scope.ServiceProvider.GetRequiredService<DoDone.Db.Repositories.ITeamRepository>();
                var scopedLexiconService = scope.ServiceProvider.GetRequiredService<ILexiconService>();
                var scopedTaskItemRepository = scope.ServiceProvider.GetRequiredService<ITaskItemRepository>();

                await ProcessTaskItemUpdateNotificationsWithScopedServicesAsync(entityForBackground, entityBeforeUpdateForBackground, scopedNotificationService, scopedTeamRepository, scopedLexiconService, scopedTaskItemRepository, teamId, currentUserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background notification processing failed for UpdateTaskItemTaskDetailsAsync TaskItem ID {TaskItemId}", taskItemId);
            }
        });
    }

    public async Task<DataResponse<TaskItemDetailsResponse>> GetTaskItemEntityDetailsAsync(long id)
    {
        var entity = await _taskItems.GetTaskItemEntityDetailsAsync(id);
        if (entity == null)
            throw new ArgumentException($"{typeof(TaskItem).Name} not found");

        return new DataResponse<TaskItemDetailsResponse>
        {
            Data = await MapEntityToDetailsResponse(entity),
            Success = true,
            Message = $"{typeof(TaskItem).Name} details retrieved successfully"
        };
    }

    public async Task<PagedTaskItemListResponse> GetPagedListAsync(PagedTaskItemListRequest request)
    {
        try
        {
            var subscriptionLimits = await _subscriptionService.GetSubscriptionLimits();
            var query = _taskItems.GetBaseQuery(_currentUser.UserId);
            (query, TaskItemStats stats, List<AllowanceStats> allowanceStats, BonusStats bonusStats)
                = await ApplyFiltersAndGetStatsAsync(request, query, subscriptionLimits);

            var taskItems = await query.ToListAsync(mapper: MapEntityToResponse);

            var pagingInfo = new PagingInfo
            {
                CurrentPage = request.Paging.Page,
                PageSize = request.Paging.ValidatedPageSize,
                TotalItems = stats.TotalCount
            };

            var response = PagedTaskItemListResponse.CreateTaskItemSuccess(taskItems, pagingInfo, stats, allowanceStats, bonusStats);
            response.Stats = stats;
            response.AllowanceStats = allowanceStats;

            return response;
        }
        catch (Exception ex)
        {
            return PagedTaskItemListResponse.CreateTaskItemFailure($"Error retrieving TaskItem list: {ex.Message}");
        }
    }

    public async Task<PagedTaskItemDetailsListResponse> GetPagedListDetailsAsync(PagedTaskItemListRequest request)
    {
        try
        {
            _logger.LogInformation("Getting paged TaskItem details list for user ID {UserId}", _currentUser.UserId);
            var query = _taskItems.GetBaseDetailsQuery(_currentUser.UserId);

            var subscriptionLimits = await _subscriptionService.GetSubscriptionLimits();

            if (!subscriptionLimits.TeamMembersLimit.CanAdd && subscriptionLimits.TeamMembersLimit.Max > 0)
            {
                var teamMembers = await _teamRepository.GetTeamMembersAsync(_currentUser.TeamId);
                var allowedUserIds = teamMembers
                    .OrderBy(tm => tm.Id == _currentUser.UserId ? 0 : 1) // ensure current user is included
                    .ThenBy(tm => tm.IsActive ? 0 : 1)
                    .ThenBy(tm => tm.FirstName)
                    .ThenBy(tm => tm.LastName)
                    .Take(subscriptionLimits.TeamMembersLimit.Max)
                    .Select(tm => tm.Id)
                    .ToList();

                query = query.Where(t => !t.AssignedTo.HasValue || (t.AssignedTo.HasValue && allowedUserIds.Contains(t.AssignedTo.Value)));
            }

            (query, TaskItemStats stats, List<AllowanceStats> allowanceStats, BonusStats bonusStats)
                = await ApplyFiltersAndGetStatsAsync(request, query, subscriptionLimits);

            // if (subscriptionLimits.TaskItemsLimit.CanAdd == false && subscriptionLimits.TaskItemsLimit.Max > 0 && stats.TotalCount > subscriptionLimits.TaskItemsLimit.Max)
            // {
            //     var currentPageMax = subscriptionLimits.TaskItemsLimit.Max - ((request.Paging.Page - 1) * request.Paging.ValidatedPageSize);
            //     query = query
            //         .OrderBy(t => !t.IsArchived ? 0 : 1)
            //         .ThenBy(t => t.IsActive ? 0 : 1)
            //         .Take(currentPageMax);
            // }

            var taskItems = await query.ToListAsync(mapper: MapEntityToDetailsResponse);

            var pagingInfo = new PagingInfo
            {
                CurrentPage = request.Paging.Page,
                PageSize = request.Paging.ValidatedPageSize,
                TotalItems = stats.TotalCount
            };

            var response = PagedTaskItemDetailsListResponse.CreateTaskItemSuccess(taskItems, pagingInfo, stats, allowanceStats, bonusStats);
            response.Stats = stats;
            response.AllowanceStats = allowanceStats;

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving TaskItem details list for user ID {UserId}", _currentUser.UserId);
            return PagedTaskItemDetailsListResponse.CreateTaskItemFailure($"Error retrieving TaskItem details list: {ex.Message}");
        }
    }

    private async Task<(IQueryable<TaskItem> query, TaskItemStats stats, List<AllowanceStats> allowanceStats, BonusStats bonusStats)>
        ApplyFiltersAndGetStatsAsync(PagedTaskItemListRequest request, IQueryable<TaskItem> query, SubscriptionLimitsResponse subscriptionLimits)
    {
        var stats = await _queryProcessor.GetTaskItemStatsAsync(query);

        query = _queryProcessor.ApplySearchTermFilter(query, request.TaskItemFiltering.SearchTerm);
        query = _queryProcessor.ApplyPriorityFilter(query, request.TaskItemFiltering.PriorityFilter);
        query = _queryProcessor.ApplyGroupKindCategoryFilters(query, request.TaskItemFiltering.GroupId, request.TaskItemFiltering.KindId, request.TaskItemFiltering.CategoryId);
        query = _queryProcessor.ApplyActiveStatusFilter(query, request.TaskItemFiltering.ActiveFilter);
        query = _queryProcessor.ApplyArchivedStatusFilter(query, request.TaskItemFiltering.ArchivedFilter);
        query = _queryProcessor.ApplyCompletionStatusFilter(query, request.TaskItemFiltering.CompletionFilter);
        query = _queryProcessor.ApplyDueStatusFilter(query, request.TaskItemFiltering.DueFilter);
        query = _queryProcessor.ApplyStartedStatusFilter(query, request.TaskItemFiltering.StartedFilter);
        query = _queryProcessor.ApplyEndedStatusFilter(query, request.TaskItemFiltering.EndedFilter);

        query = _queryProcessor.ApplyGradeFilter(query, request.TaskItemFiltering.GradeId);
        query = _queryProcessor.ApplyCreditsFilter(query, request.TaskItemFiltering.Credits);

        query = _queryProcessor.ApplyAssignmentStatusFilter(query, request.TaskItemFiltering.AssignmentFilter);
        query = _queryProcessor.ApplyTeamMemberFilter(query, request.TaskItemFiltering.AssignedTo);

        // Use cached version for expensive allowance stats
        List<AllowanceStats> allowanceStats;
        if (_queryProcessor is ICachedQueryProcessorService cachedProcessor)
        {
            allowanceStats = await cachedProcessor.GetCachedAllowanceStatsAsync(query, _currentUser.UserId, request.TeamAllowanceIntervalId, subscriptionLimits);
        }
        else
        {
            allowanceStats = await _queryProcessor.GetAllowanceStatsAsync(query, request.TeamAllowanceIntervalId, subscriptionLimits);
        }

        query = _queryProcessor.ApplyAllowanceIntervalFilter(query, request.TeamAllowanceIntervalId);
        query = _queryProcessor.ApplyAllowanceNeedReviewStatusFilter(query, request.TaskItemFiltering.AllowanceNeedReviewFilter);

        var currentIntervalStats = allowanceStats.First(a => a.TeamAllowanceIntervalId == request.TeamAllowanceIntervalId);
        
        // Use cached version for expensive bonus stats
        BonusStats bonusStats;
        if (_queryProcessor is ICachedQueryProcessorService cachedProcessor2)
        {
            bonusStats = await cachedProcessor2.GetCachedBonusStatsAsync(query, currentIntervalStats.ActualStartAt, currentIntervalStats.CalculatedEndAt, _currentUser.UserId);
        }
        else
        {
            bonusStats = await _queryProcessor.GetBonusStatsAsync(query, currentIntervalStats.ActualStartAt, currentIntervalStats.CalculatedEndAt);
        }

        query = _queryProcessor.ApplyBonusStatusFilter(query, request.TaskItemFiltering.BonusStatusFilter, currentIntervalStats.ActualStartAt, currentIntervalStats.CalculatedEndAt);

        // Only do the count query after all filters are applied
        stats.FilteredCount = await query.LongCountAsync();

        query = _queryProcessor.ApplyDefaultSorting(query);
        query = _queryProcessor.ApplyPaging(query, request.Paging);

        return (query, stats, allowanceStats, bonusStats);
    }

    public async Task ResetTaskGradesOnIntervalChangeAsync()
    {
        try
        {
            var totalCount = await _allowanceHistoryService.GetEndedIntervalsForGradeResetCountAsync();
            _logger.LogInformation("Starting task grade reset for ended intervals. Total intervals to process: {TotalCount}", totalCount);

            if (totalCount == 0)
            {
                _logger.LogInformation("No ended intervals found for task grade reset.");
                return;
            }

            // return _backgroundJobService.EnqueueBatchJobAsync(
            //     "Reset Task Grades on Ended Allowance Intervals",
            //     async (skip, take) =>
            //     {
            for (int skip = 0; skip < totalCount; skip += Defaults.DEFAULT_BATCH_SIZE)
            {
                var batch = await _allowanceHistoryService.GetEndedIntervalsForGradeResetBatchAsync(skip, Defaults.DEFAULT_BATCH_SIZE);
                var batchNumber = (skip / Defaults.DEFAULT_BATCH_SIZE) + 1;
                var totalBatches = (int)Math.Ceiling((double)totalCount / Defaults.DEFAULT_BATCH_SIZE);

                _logger.LogInformation($"Processing batch {batchNumber}/{totalBatches} with {batch.Count} items");
                foreach (var intervalId in batch)
                {
                    _logger.LogInformation("Processing task grade reset for ended allowance interval ID: {IntervalId}", intervalId);
                    await _taskItems.ResetTaskGradesForEndedAllowanceIntervalAsync(intervalId);
                }
                await _allowanceHistoryService.GradeResetCompletedAsync(batch);

                // Add a small delay between batches to prevent overwhelming the system
                if (skip + Defaults.DEFAULT_BATCH_SIZE < totalCount)
                {
                    await Task.Delay(100);
                }
            }
            _logger.LogInformation("Completed task grade reset for ended allowance intervals.");
                // },
                // batchSize: 20,
                // degreeOfParallelism: 2);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while resetting task grades for ended allowance intervals: {Message}", ex.Message);
        }
    }

    private async Task RecalculateUserAllowanceWithScopedServicesAsync(TaskItem existingEntity, TaskItem? existingEntityBeforeUpdate, 
        IAllowanceCalculationService allowanceService, DoDone.Db.Repositories.ITeamRepository teamRepository, IUserRepository userRepository, ILexiconService lexiconService
        , ITaskItemRepository taskItemRepository, ILogger<TaskItemService> logger, long teamId)
    {
        // const int maxRetries = 1;
        // int retryCount = 0;
        
        // while (retryCount < maxRetries)
        // {
            try
            {
                logger.LogInformation(@"Recalculating for TeamId {TeamId} TaskItem ID {TaskItemId}
                        , AssignedTo: {PrevAssignedTo} -> {AssignedTo}
                        , IntervalId: {PrevIntervalId} -> {IntervalId}
                        , Credits: {PrevCredits} -> {Credits}
                        , GradeId {PrevGradeId} -> {GradeId}
                        , IsApprovedForAllowance {PrevIsApprovedForAllowance} -> {IsApprovedForAllowance}"
                        , teamId, existingEntity.Id
                        , existingEntityBeforeUpdate?.AssignedTo, existingEntity.AssignedTo
                        , existingEntityBeforeUpdate?.TeamAllowanceIntervalId, existingEntity.TeamAllowanceIntervalId
                        , existingEntityBeforeUpdate?.Credits, existingEntity.Credits
                        , existingEntityBeforeUpdate?.GradeId, existingEntity.GradeId
                        , existingEntityBeforeUpdate?.IsApprovedForAllowance, existingEntity.IsApprovedForAllowance);

                await RecalculateUserAllowanceWithScopedServicesInternalAsync(existingEntity, existingEntityBeforeUpdate, allowanceService, teamRepository, userRepository, lexiconService, teamId);
                // return; // Success, exit retry loop
            }
            catch (DbUpdateConcurrencyException ex)
            {
                // retryCount++;
                logger.LogError(ex, @"DbUpdateConcurrencyException encountered during allowance recalculation for TaskItem ID {TaskItemId}, Original AssignedTo {OriginalAssignedTo}, Original TeamAllowanceIntervalId {OriginalTeamAllowanceIntervalId}, Original Credits {OriginalCredits}, Original GradeId {OriginalGradeId}, Original IsApprovedForAllowance {OriginalIsApprovedForAllowance}
                        , Prev AssignedTo {PrevAssignedTo}, Prev TeamAllowanceIntervalId {PrevTeamAllowanceIntervalId}, Prev Credits {PrevCredits}, Prev GradeId {PrevGradeId}, Prev IsApprovedForAllowance {PrevIsApprovedForAllowance}.",
                    existingEntity.Id, existingEntity.AssignedTo, existingEntity.TeamAllowanceIntervalId, existingEntity.Credits, existingEntity.GradeId, existingEntity.IsApprovedForAllowance
                    , existingEntityBeforeUpdate?.AssignedTo, existingEntityBeforeUpdate?.TeamAllowanceIntervalId, existingEntityBeforeUpdate?.Credits, existingEntityBeforeUpdate?.GradeId, existingEntityBeforeUpdate?.IsApprovedForAllowance);
                // logger.LogError(ex, "DbUpdateConcurrencyException encountered during allowance recalculation for TaskItem ID {TaskItemId}. Retry attempt {RetryCount} of {MaxRetries}", existingEntity.Id, retryCount, maxRetries);
                
                // if (retryCount >= maxRetries)
                // {
                //     logger.LogError(ex, "Maximum retry attempts ({MaxRetries}) reached for allowance recalculation of TaskItem ID {TaskItemId}. Giving up.", maxRetries, existingEntity.Id);
                //     throw;
                // }
                
                // // Reload the entity from the database before retrying
                // var reloadedEntity = await taskItemRepository.GetTaskItemEntityDetailsForUpdateAsync(existingEntity.Id);
                // if (reloadedEntity == null)
                // {
                //     logger.LogError("TaskItem with ID {TaskItemId} not found when attempting to reload for retry", existingEntity.Id);
                //     throw new InvalidOperationException($"TaskItem with ID {existingEntity.Id} not found when attempting to reload for retry");
                // }
                
                // existingEntity = reloadedEntity;
                // logger.LogInformation("Reloaded TaskItem ID {TaskItemId} from database for retry attempt {RetryCount}", existingEntity.Id, retryCount);
                
                // // Add a small delay before retrying to reduce chance of immediate collision
                // await Task.Delay(TimeSpan.FromMilliseconds(100 * retryCount));
            }
        // }
    }

    private async Task RecalculateUserAllowanceWithScopedServicesInternalAsync(TaskItem updatedEntity, TaskItem? originalEntity, 
        IAllowanceCalculationService allowanceService, DoDone.Db.Repositories.ITeamRepository teamRepository, IUserRepository userRepository, ILexiconService lexiconService, long teamId)
    {
        if (!updatedEntity.AssignedTo.HasValue && (!originalEntity?.AssignedTo.HasValue ?? false))
            return;
        if (!updatedEntity.TeamAllowanceIntervalId.HasValue && !(originalEntity?.TeamAllowanceIntervalId.HasValue ?? false))
            return;
        if (!updatedEntity.Credits.HasValue && !(originalEntity?.Credits.HasValue ?? false))
            return;
        if (!updatedEntity.GradeId.HasValue && !(originalEntity?.GradeId.HasValue ?? false))
            return;
        if (!updatedEntity.IsApprovedForAllowance && !(originalEntity?.IsApprovedForAllowance ?? false))
            return;

        if (originalEntity?.AssignedTo == updatedEntity.AssignedTo
            && originalEntity?.TeamAllowanceIntervalId == updatedEntity.TeamAllowanceIntervalId
            && originalEntity?.Credits == updatedEntity.Credits
            && originalEntity?.GradeId == updatedEntity.GradeId
            && originalEntity?.IsApprovedForAllowance == updatedEntity.IsApprovedForAllowance)
        {
            // No relevant changes, skip recalculation
            return;
        }

        if (originalEntity?.AssignedTo.HasValue == true)
        {
            var originalUser = await userRepository.GetAsync(originalEntity.AssignedTo.Value);
            if (originalUser == null)
            {
                _logger.LogError("User with ID {UserId} not found for allowance recalculation", originalEntity.AssignedTo.Value);
                throw new InvalidOperationException($"User with ID {originalEntity.AssignedTo.Value} not found for allowance recalculation");
            }

            await RecalculateAllowanceIntervalsWithScopedServicesAsync(originalEntity.TeamAllowanceIntervalId, updatedEntity.TeamAllowanceIntervalId, originalUser, allowanceService, teamRepository, lexiconService, teamId, _currentUser.UserId);
        }

        if (updatedEntity.AssignedTo.HasValue && updatedEntity.AssignedTo != originalEntity?.AssignedTo)
        {
            var currentUser = await userRepository.GetAsync(updatedEntity.AssignedTo.Value);
            if (currentUser == null)
            {
                _logger.LogError("User with ID {UserId} not found for allowance recalculation", updatedEntity.AssignedTo.Value);
                throw new InvalidOperationException($"User with ID {updatedEntity.AssignedTo.Value} not found for allowance recalculation");
            }
            await RecalculateAllowanceIntervalsWithScopedServicesAsync(originalEntity?.TeamAllowanceIntervalId, updatedEntity.TeamAllowanceIntervalId, currentUser, allowanceService, teamRepository, lexiconService, teamId, _currentUser.UserId);
        }   
    }

    private async Task RecalculateAllowanceIntervalsWithScopedServicesAsync(long? originalIntervalId, long? currentIntervalId, User user, 
        IAllowanceCalculationService allowanceService, DoDone.Db.Repositories.ITeamRepository teamRepository, ILexiconService lexiconService, long teamId, long currentUserId)
    {
        if (originalIntervalId.HasValue)
        {
            var originalAllowanceInterval = await teamRepository.GetTeamAllowanceIntervalAsync(teamId, originalIntervalId.Value);
            if (originalAllowanceInterval == null)
            {
                _logger.LogError($"Failed to retrieve {await lexiconService.AllowanceLowercase(teamId)} interval with ID {originalIntervalId.Value} for {await lexiconService.TeamLowercase(teamId)} ID {teamId}");
                throw new InvalidOperationException($"Failed to retrieve allowance interval with ID {originalIntervalId.Value} for team ID {teamId}");
            }
            await allowanceService.RecalculateUserAllowanceAsync(user, originalAllowanceInterval, currentUserId);
        }

        if (currentIntervalId.HasValue && currentIntervalId != originalIntervalId)
        {
            var currentAllowanceInterval = await teamRepository.GetTeamAllowanceIntervalAsync(teamId, currentIntervalId.Value);
            if (currentAllowanceInterval == null)
            {
                _logger.LogError($"Failed to retrieve {await lexiconService.AllowanceLowercase(teamId)} interval with ID {currentIntervalId.Value} for {await lexiconService.TeamLowercase(teamId)} ID {teamId}");
                throw new InvalidOperationException($"Failed to retrieve allowance interval with ID {currentIntervalId.Value} for team ID {teamId}");
            }
            await allowanceService.RecalculateUserAllowanceAsync(user, currentAllowanceInterval, currentUserId);
        }
    }

    private async Task ProcessTaskItemUpdateNotificationsWithScopedServicesAsync(TaskItem existingEntityAfterUpdate, TaskItem? existingEntityBeforeUpdate, 
        INotificationService notificationService, DoDone.Db.Repositories.ITeamRepository teamRepository, ILexiconService lexiconService, ITaskItemRepository taskItemRepository, long teamId, long currentUserId)
    {
        // The cloned entities now have navigation properties properly copied, so we can use them directly
        // However, we need to ensure that navigation properties are loaded when IDs have values but properties are null
        
        // Ensure TeamAllowanceInterval navigation property is loaded if needed
        if (existingEntityAfterUpdate.TeamAllowanceIntervalId.HasValue && existingEntityAfterUpdate.TeamAllowanceInterval == null)
        {
            try
            {
                existingEntityAfterUpdate.TeamAllowanceInterval = await teamRepository.GetTeamAllowanceIntervalAsync(teamId, existingEntityAfterUpdate.TeamAllowanceIntervalId.Value);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load TeamAllowanceInterval {IntervalId} for TaskItem {TaskItemId} in background processing", existingEntityAfterUpdate.TeamAllowanceIntervalId.Value, existingEntityAfterUpdate.Id);
            }
        }
        
        if (existingEntityBeforeUpdate?.TeamAllowanceIntervalId.HasValue == true && existingEntityBeforeUpdate.TeamAllowanceInterval == null)
        {
            try
            {
                existingEntityBeforeUpdate.TeamAllowanceInterval = await teamRepository.GetTeamAllowanceIntervalAsync(teamId, existingEntityBeforeUpdate.TeamAllowanceIntervalId.Value);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load TeamAllowanceInterval {IntervalId} for before-update TaskItem {TaskItemId} in background processing", existingEntityBeforeUpdate.TeamAllowanceIntervalId.Value, existingEntityBeforeUpdate.Id);
            }
        }
        
        // Note: We don't need to load Grade navigation properties here because grade information
        // is handled gracefully in the notification logic with appropriate null checks

        // Task Assignment changes
        if (existingEntityBeforeUpdate == null)
        {
            if (existingEntityAfterUpdate.AssignedTo.HasValue && existingEntityAfterUpdate.AssignedTo != existingEntityAfterUpdate.CreatedBy)
            {
                await notificationService.SendTaskAssignedNotificationsAsync(existingEntityAfterUpdate, currentUserId);
            }
        }
        else
        {
            if (!existingEntityBeforeUpdate.AssignedTo.HasValue && existingEntityAfterUpdate.AssignedTo.HasValue)
            {
                await notificationService.SendTaskAssignedNotificationsAsync(existingEntityAfterUpdate, currentUserId);
            }
            else if (!existingEntityAfterUpdate.AssignedTo.HasValue && existingEntityBeforeUpdate.AssignedTo.HasValue)
            {
                await notificationService.SendTaskUnassignedNotificationsAsync(existingEntityBeforeUpdate, currentUserId);
            }
            if (existingEntityBeforeUpdate.AssignedTo.HasValue && existingEntityAfterUpdate.AssignedTo.HasValue && existingEntityBeforeUpdate.AssignedTo != existingEntityAfterUpdate.AssignedTo)
            {
                await notificationService.SendTaskReassignedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate, currentUserId);
            }
        }

        // Task Completion changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for completion changes
        }
        else
        {
            if (existingEntityAfterUpdate.PercentComplete == 100 && existingEntityBeforeUpdate.PercentComplete < 100)
            {
                await notificationService.SendTaskMarkedCompletedNotificationsAsync(existingEntityAfterUpdate, currentUserId);
            }
            else if (existingEntityBeforeUpdate.PercentComplete == 100 && existingEntityAfterUpdate.PercentComplete < 100)
            {
                await notificationService.SendTaskMarkedIncompleteNotificationsAsync(existingEntityAfterUpdate, currentUserId);
            }
            else if (existingEntityBeforeUpdate.PercentComplete != existingEntityAfterUpdate.PercentComplete)
            {
                await notificationService.SendTaskProgressUpdatedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate.PercentComplete, currentUserId);
            }
        }

        // Task Active/Inactive changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for active changes
        }
        else
        {
            if (existingEntityAfterUpdate.IsActive && !existingEntityBeforeUpdate.IsActive)
            {
                await notificationService.SendTaskMarkedActiveNotificationsAsync(existingEntityAfterUpdate, currentUserId);
            }
            else if (!existingEntityAfterUpdate.IsActive && existingEntityBeforeUpdate.IsActive)
            {
                await notificationService.SendTaskMarkedInactiveNotificationsAsync(existingEntityAfterUpdate, currentUserId);
            }
        }

        // Task Archived/Unarchived changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for archived changes
        }
        else
        {
            if (existingEntityAfterUpdate.IsArchived && !existingEntityBeforeUpdate.IsArchived)
            {
                await notificationService.SendTaskArchivedNotificationsAsync(existingEntityAfterUpdate, currentUserId);
            }
            else if (!existingEntityAfterUpdate.IsArchived && existingEntityBeforeUpdate.IsArchived)
            {
                await notificationService.SendTaskUnarchivedNotificationsAsync(existingEntityAfterUpdate, currentUserId);
            }
        }

        // Task Group changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for group changes
        }
        else if (existingEntityAfterUpdate.GroupId != existingEntityBeforeUpdate.GroupId)
        {
            await notificationService.SendTaskGroupChangedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate.Group?.Name, currentUserId);
        }

        // Task Kind changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for kind changes
        }
        else if (existingEntityAfterUpdate.KindId != existingEntityBeforeUpdate.KindId)
        {
            await notificationService.SendTaskKindChangedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate.Kind?.Name, currentUserId);
        }

        // Task Category changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for category changes
        }
        else if (existingEntityAfterUpdate.CategoryId != existingEntityBeforeUpdate.CategoryId)
        {
            await notificationService.SendTaskCategoryChangedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate.Category?.Name, currentUserId);
        }

        // Task Details changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for details changes
        }
        else if (existingEntityAfterUpdate.Details != existingEntityBeforeUpdate.Details)
        {
            await notificationService.SendTaskDetailsUpdatedNotificationsAsync(existingEntityAfterUpdate, currentUserId);
        }

        // Task Priority changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for priority changes
        }
        else if (existingEntityAfterUpdate.Priority != existingEntityBeforeUpdate.Priority)
        {
            await notificationService.SendTaskPriorityChangedNotificationsAsync(existingEntityAfterUpdate, currentUserId, existingEntityBeforeUpdate.Priority);
        }

        // Task Credits changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for credits changes
        }
        else
        {
            if (existingEntityAfterUpdate.Credits.HasValue && !existingEntityBeforeUpdate.Credits.HasValue)
            {
                await notificationService.SendTaskCreditsAssignedNotificationsAsync(existingEntityAfterUpdate, currentUserId);
            }
            else if (existingEntityAfterUpdate.Credits.HasValue && existingEntityBeforeUpdate.Credits.HasValue && existingEntityAfterUpdate.Credits != existingEntityBeforeUpdate.Credits)
            {
                await notificationService.SendTaskCreditsChangedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate.Credits.Value, currentUserId);
            }
            else if (!existingEntityAfterUpdate.Credits.HasValue && existingEntityBeforeUpdate.Credits.HasValue)
            {
                await notificationService.SendTaskCreditsRemovedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate.Credits.Value, currentUserId);
            }
        }

        // Task Grade changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for grade changes
        }
        else
        {
            if (existingEntityAfterUpdate.GradeId.HasValue && !existingEntityBeforeUpdate.GradeId.HasValue)
            {
                await notificationService.SendTaskGradedNotificationsAsync(existingEntityAfterUpdate, currentUserId);
            }
            else
            {

                string existingLetterGrade = existingEntityBeforeUpdate.Grade?.LetterGrade ?? string.Empty;

                if (!existingEntityAfterUpdate.GradeId.HasValue && existingEntityBeforeUpdate.GradeId.HasValue)
                {
                    if (existingLetterGrade == string.Empty)
                    {
                        // Grade navigation property is null but GradeId was set - log warning and skip notification
                        _logger.LogWarning("TaskItem ID {TaskItemId} has GradeId set but Grade navigation property is null. Skipping grade removal notification.", existingEntityBeforeUpdate.Id);
                    }
                    else
                    {
                        await notificationService.SendTaskGradeRemovedNotificationsAsync(existingEntityAfterUpdate, existingLetterGrade, currentUserId);
                    }
                }
                else if (existingEntityAfterUpdate.GradeId.HasValue && existingEntityBeforeUpdate.GradeId.HasValue && existingEntityAfterUpdate.GradeId != existingEntityBeforeUpdate.GradeId)
                {
                    if (existingLetterGrade == string.Empty)
                    {
                        // Grade navigation property is null but GradeId was set - log warning and skip notification
                        _logger.LogWarning("TaskItem ID {TaskItemId} has GradeId set but Grade navigation property is null. Skipping grade change notification.", existingEntityBeforeUpdate.Id);
                    }
                    else
                    {
                        await notificationService.SendTaskGradeChangedNotificationsAsync(existingEntityAfterUpdate, existingLetterGrade, currentUserId);
                    }
                }
            }
        }

        // Task Allowance Interval changes
        if (existingEntityBeforeUpdate == null)
        {
            // do nothing on create for allowance interval changes
        }
        else
        {
            string existingEntityBeforeUpdateIntervalName = existingEntityBeforeUpdate.TeamAllowanceInterval?.Name ?? string.Empty;
            bool isBusiness = await teamRepository.IsBusiness(teamId);
            if (existingEntityBeforeUpdate.TeamAllowanceIntervalId.HasValue && !existingEntityAfterUpdate.TeamAllowanceIntervalId.HasValue)
            {
                await notificationService.SendTaskAllowanceIntervalRemovedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdateIntervalName, isBusiness, currentUserId);
            }
            else if (!existingEntityBeforeUpdate.TeamAllowanceIntervalId.HasValue && existingEntityAfterUpdate.TeamAllowanceIntervalId.HasValue)
            {
                await notificationService.SendTaskAllowanceIntervalAssignedNotificationsAsync(existingEntityAfterUpdate, isBusiness, currentUserId);
            }
            else if (existingEntityBeforeUpdate.TeamAllowanceIntervalId.HasValue && existingEntityAfterUpdate.TeamAllowanceIntervalId.HasValue
                     && existingEntityBeforeUpdate.TeamAllowanceIntervalId != existingEntityAfterUpdate.TeamAllowanceIntervalId)
            {
                await notificationService.SendTaskAllowanceIntervalChangedNotificationsAsync(existingEntityAfterUpdate, currentUserId, existingEntityBeforeUpdateIntervalName);
            }
        }

        // Task Bonus changes
        if (!string.IsNullOrWhiteSpace(existingEntityAfterUpdate.MaxBonus) && (existingEntityBeforeUpdate == null || string.IsNullOrWhiteSpace(existingEntityBeforeUpdate?.MaxBonus)))
        {
            await notificationService.SendBonusAssignedNotificationsAsync(existingEntityAfterUpdate, currentUserId);
        }
        else if (existingEntityBeforeUpdate != null && !string.IsNullOrWhiteSpace(existingEntityBeforeUpdate.MaxBonus) && string.IsNullOrWhiteSpace(existingEntityAfterUpdate.MaxBonus))
        {
            await notificationService.SendBonusRemovedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate.MaxBonus, currentUserId);
        }
        else if (existingEntityBeforeUpdate != null && !string.IsNullOrWhiteSpace(existingEntityBeforeUpdate.MaxBonus) && !string.IsNullOrWhiteSpace(existingEntityAfterUpdate.MaxBonus) 
            && existingEntityAfterUpdate.MaxBonus != existingEntityBeforeUpdate.MaxBonus)
        {
            await notificationService.SendBonusChangedNotificationsAsync(existingEntityAfterUpdate, existingEntityBeforeUpdate.MaxBonus, currentUserId);
        }
    }
}