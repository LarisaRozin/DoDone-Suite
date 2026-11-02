/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Shared.Abstractions;

/// <summary>
/// Base contract for response DTOs
/// </summary>
public interface IResponseDto
{
    long Id { get; set; }
    string Name { get; set; }
    string? Description { get; set; }
    bool IsActive { get; set; }
    long CreatedBy { get; set; }
    DateTimeOffset CreatedAt { get; set; }
    long? UpdatedBy { get; set; }
    DateTimeOffset? UpdatedAt { get; set; }
}

/// <summary>
/// Contract for detailed response DTOs that include navigation properties
/// </summary>
public interface IDetailedResponseDto : IResponseDto
{
}

/// <summary>
/// Base contract for create request DTOs
/// </summary>
public interface ICreateRequestDto
{
    string Name { get; set; }
    string? Description { get; set; }
}

/// <summary>
/// Base contract for update request DTOs
/// </summary>
public interface IUpdateRequestDto : ICreateRequestDto
{
    long Id { get; set; }
    bool IsActive { get; set; }
}
