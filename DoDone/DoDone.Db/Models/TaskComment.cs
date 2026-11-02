/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Abstractions;

namespace DoDone.Db.Models;

public class TaskComment 
{
    public long Id { get; set; }
    public long TaskItemId { get; set; }
    public required string Content { get; set; } = null!;
    public long CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public TaskItem TaskItem { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public User? UpdatedByUser { get; set; } = null!;
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}
