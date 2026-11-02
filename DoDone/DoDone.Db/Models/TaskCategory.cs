/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Abstractions;

namespace DoDone.Db.Models;

public class TaskCategory : IDetailedEntity
{
    public long Id { get; set; }
    public long KindId { get; set; }
    public required string Name { get; set; } = null!;
    public string? Description { get; set; } = default!;
    public bool IsActive { get; set; } = true;
    public long CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public TaskKind Kind { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public User UpdatedByUser { get; set; } = null!;
    public List<TaskItem> TaskItems { get; set; } = new();
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}