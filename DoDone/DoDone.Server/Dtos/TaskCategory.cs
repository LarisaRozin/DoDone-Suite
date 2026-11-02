/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Server.Dtos;

public class TaskCategoryCreateRequest : RequestBase
{
    public long KindId { get; set; }
}

public class TaskCategoryUpdateRequest : RequestBase
{
    public long Id { get; set; }
    public long KindId { get; set; }
}

public class TaskCategoryResponse : ExistingItemBase
{
    public long Id { get; set; }
    public long KindId { get; set; }
}

public class TaskCategoryDetailsResponse : TaskCategoryResponse
{
    public required UserResponse CreatedByUser { get; set; }
    public UserResponse? UpdatedByUser { get; set; }
}