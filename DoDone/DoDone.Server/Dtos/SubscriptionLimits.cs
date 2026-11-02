/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Enums;

namespace DoDone.Server.Dtos;

public class FeatureLimit
{
    public int Max { get; set; }
    public int CurrentTotal { get; set; }
    public int CurrentActive { get; set; }
    public bool CanAdd { get; set; }
}

public class SubscriptionLimitsResponse
{
    public SubscriptionTier SubscriptionTier { get; set; }
    public FeatureLimit TeamMembersLimit { get; set; } = new();
    public FeatureLimit TaskItemsLimit { get; set; } = new();
    public FeatureLimit AllowanceIntervalsLimit { get; set; } = new();
    public bool Bonuses { get; set; }
    public bool GradeConfiguration { get; set; }
    public bool Multiselect { get; set; }
    public bool PrivateTasks { get; set; }
    public bool ProposedTasks { get; set; }
    public bool TaskComments { get; set; }
    public bool ImageAvatars { get; set; }
    // TODO: fix feature requirements
    // public bool TaskGroups { get; set; }
    // public bool AdvancedFilters { get; set; }
    // public bool CelebrationEffects { get; set; }
}

public class ValidateSubscriptionActionRequest
{
    public SubscriptionAction Action { get; set; }
} 

public class ValidateSubscriptionActionResponse 
{
    public bool IsAllowed { get; set; }
    public string? Reason { get; set; }
    public SubscriptionTier UpgradeRequired { get; set; }
    public SubscriptionTier CurrentTier { get; set; }
}
