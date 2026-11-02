/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Server.Dtos;

public class RequestBase
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}

// public class CreateRequestBase : RequestBase
// {
//     public long CreatedBy { get; set; }
// }

// public class UpdateRequestBase : RequestBase
// {
//     public long UpdatedBy { get; set; }
// }

// public class ExistingItemRequestBase
// {
//     public long Id { get; set; }
//     public long CreatedBy { get; set; }
//     public DateTime CreatedAt { get; set; }
//     public long? UpdatedBy { get; set; }
//     public DateTime? UpdatedAt { get; set; }
// }

