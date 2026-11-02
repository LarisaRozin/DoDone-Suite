/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Server.Dtos;

public class TaskKindCreateRequest : RequestBase
{
    public required long GroupId { get; set; }
}

public class TaskKindUpdateRequest : RequestBase
{
    public long Id { get; set; }
    public required long GroupId { get; set; }
}

public class TaskKindResponse : ExistingItemBase
{
    public long Id { get; set; }
    public required long GroupId { get; set; }
}

public class TaskKindDetailsResponse : TaskKindResponse
{
    public List<TaskCategoryResponse> Categories { get; set; } = new();
    public required UserResponse CreatedByUser { get; set; }
    public UserResponse? UpdatedByUser { get; set; }
}

