/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;

namespace DoDone.Server.Dtos;

public class TaskGroupBase : ExistingItemBase
{
    public long? TeamId { get; set; }
    public long Id { get; set; }
    public long UserId { get; set; }
    public bool IsPrivate { get; set; } = false;
}

public class TaskGroupResponse : TaskGroupBase
{
}

// public class TaskGroupRequest : TaskGroupBase
// { }

public class TaskGroupDetailsResponse : TaskGroupBase
{
    public List<TaskKindDetailsResponse> Kinds { get; set; } = new();
    public required UserResponse CreatedByUser { get; set; }
    public UserResponse? UpdatedByUser { get; set; }
    public Team? Team { get; set; } = null!;
}

public class TaskGroupCreateRequest : RequestBase
{
    public long UserId { get; set; }
    public bool IsPrivate { get; set; } = true;
}

public class TaskGroupUpdateRequest : RequestBase
{
    public long Id { get; set; }
    public bool IsPrivate { get; set; } = true;
}

// public static class TaskGroupRequestExtensions
// {
//     public static List<string> Validate(this TaskGroupRequest group)
//     {
//         var errors = new List<string>();

//         if (group == null)
//         {
//             errors.Add("Group cannot be null.");
//             return errors;
//         }

//         if (string.IsNullOrWhiteSpace(group.Name))
//         {
//             errors.Add("Name is required.");
//         }
//         else if (group.Name.Length > 100)
//         {
//             errors.Add("Name must be less than 100 characters.");
//         }

//         if (group.Description != null && group.Description.Length > 500)
//         {
//             errors.Add("Description must be less than 500 characters.");
//         }

//         return errors;
//     }
// }

