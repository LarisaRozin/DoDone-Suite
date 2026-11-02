/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Abstractions;

namespace DoDone.Server.Dtos;

/// <summary>
/// Base response DTO that implements the standard response interface
/// </summary>
public abstract class BaseResponseDto : ExistingItemBase, IResponseDto
{
    public long Id { get; set; }
}

/// <summary>
/// Base detailed response DTO that includes user navigation properties
/// </summary>
public abstract class BaseDetailedResponseDto : BaseResponseDto, IDetailedResponseDto
{
    public required UserResponse CreatedByUser { get; set; }
    public UserResponse? UpdatedByUser { get; set; }
}

/// <summary>
/// Base create request DTO
/// </summary>
public abstract class BaseCreateRequestDto : ICreateRequestDto
{
    public required string Name { get; set; }
    public string? Description { get; set; }
}

/// <summary>
/// Base update request DTO
/// </summary>
public abstract class BaseUpdateRequestDto : BaseCreateRequestDto, IUpdateRequestDto
{
    public long Id { get; set; }
    public bool IsActive { get; set; } = true;
}
