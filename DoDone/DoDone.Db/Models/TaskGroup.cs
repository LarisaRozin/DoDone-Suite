/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Abstractions;

namespace DoDone.Db.Models;

public class TaskGroup : IUserEntity, IDetailedEntity
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long? TeamId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; } = default!;
    public bool IsActive { get; set; } = true;
    public long CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public List<TaskKind> Kinds { get; set; } = new();
    public List<TaskItem> TaskItems { get; set; } = new();
    public User User { get; set; } = null!;
    public Team? Team { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public User? UpdatedByUser { get; set; } = null!;
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}
