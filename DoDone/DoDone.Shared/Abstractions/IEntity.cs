/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Shared.Abstractions;

/// <summary>
/// Base interface for all domain model entities
/// </summary>
public interface IDoDoneModel
{
    long Id { get; set; }
    string Name { get; set; }
    string? Description { get; set; }
    bool IsActive { get; set; }
    DateTimeOffset CreatedAt { get; set; }
    long CreatedBy { get; set; }
    DateTimeOffset? UpdatedAt { get; set; }
    long? UpdatedBy { get; set; }
}

/// <summary>
/// Marker interface for entities that can be managed by generic services
/// </summary>
public interface IEntity : IDoDoneModel
{
}

/// <summary>
/// Marker interface for entities that support detailed queries with navigation properties
/// </summary>
public interface IDetailedEntity : IEntity
{
}

/// <summary>
/// Marker interface for entities that belong to a team
/// </summary>
public interface ITeamEntity : IEntity
{
    long? TeamId { get; set; }
}

/// <summary>
/// Marker interface for entities that belong to a user
/// </summary>
public interface IUserEntity : IEntity
{
    long UserId { get; set; }
}

/// <summary>
/// Marker interface for entities that can be assigned to users
/// </summary>
public interface IAssignableEntity : IEntity
{
    long? AssignedTo { get; set; }
    long? AssignedBy { get; set; }
    DateTimeOffset? AssignedAt { get; set; }
}
