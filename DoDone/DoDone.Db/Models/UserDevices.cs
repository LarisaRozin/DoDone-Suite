/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Db.Models;

public class UserDevices
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string DeviceId { get; set; } = null!;
    public string FcmToken { get; set; } = null!;
    public string Platform { get; set; } = null!;  // e.g., "android", "ios"
    public string Timezone { get; set; } = null!;  // IANA timezone, e.g.: "America/New_York"
    public bool IsActive { get; set; } = true;
    public DateTimeOffset LastSeenAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public User User { get; set; } = null!;
}