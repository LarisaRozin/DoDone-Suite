/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Abstractions;

namespace DoDone.Db.Models;

public class TaskKind : IDetailedEntity
{
    public long Id { get; set; }
    public long GroupId { get; set; }
    public required string Name { get; set; } = null!;
    public string? Description { get; set; } = default!;
    public bool IsActive { get; set; } = true;
    public long CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public TaskGroup Group { get; set; } = null!;
    public List<TaskCategory> Categories { get; set; } = new();
    public List<TaskItem> TaskItems { get; set; } = new();
    public User CreatedByUser { get; set; } = null!;
    public User UpdatedByUser { get; set; } = null!;
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}
