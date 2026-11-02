/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Microsoft.EntityFrameworkCore;
using DoDone.Db.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using DoDone.Shared.Enums;
using DoDone.Shared;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;

public class DoDoneDbContext : IdentityDbContext<User, IdentityRole<long>, long>, IDataProtectionKeyContext
{
    public DbSet<TaskGroup> TaskGroups { get; set; } = null!;
    public DbSet<TaskKind> TaskKinds { get; set; } = null!;
    public DbSet<TaskCategory> TaskCategories { get; set; } = null!;
    public DbSet<TaskItem> TaskItems { get; set; } = null!;
    public DbSet<Team> Teams { get; set; } = null!;
    public DbSet<TeamAllowanceInterval> TeamAllowanceIntervals { get; set; } = null!;
    public DbSet<TeamAllowanceIntervalGradingPeriod> TeamAllowanceIntervalGradingPeriods { get; set; } = null!;
    public DbSet<Grade> Grades { get; set; } = null!;
    public DbSet<AllowanceIntervalGradeConfig> AllowanceIntervalGradeConfigs { get; set; } = null!;
    public DbSet<AllowanceHistory> AllowanceHistories { get; set; } = null!;
    public DbSet<AllowanceHistoryTaskItems> AllowanceHistoryTaskItems { get; set; } = null!;
    public DbSet<UserDevices> DeviceRegistrations { get; set; } = null!;
    public DbSet<UserTaskItemPin> UserTaskItemPins { get; set; } = null!;
    public DbSet<UserNotificationPreference> UserNotificationPreferences { get; set; } = null!;
    public DbSet<TaskComment> TaskComments { get; set; } = null!;
    public DbSet<UserNotification> UserNotifications { get; set; } = null!;
    public DbSet<PurchaseHistory> PurchaseHistories { get; set; } = null!;
    public DbSet<FailedWebhookNotification> FailedWebhookNotifications { get; set; } = null!;
    
    // Data Protection keys storage
    public DbSet<DataProtectionKey> DataProtectionKeys { get; set; } = null!;

    public DoDoneDbContext(DbContextOptions<DoDoneDbContext> options)
        : base(options)
    { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // --- TaskGroup ---
        modelBuilder.Entity<TaskGroup>(entity =>
        {
            entity.HasKey(g => g.Id);
            entity.Property(g => g.Id).ValueGeneratedOnAdd();
            entity.Property(g => g.Name).IsRequired().HasMaxLength(100);
            entity.Property(g => g.Description).HasMaxLength(500);
            entity.HasMany(g => g.Kinds).WithOne(k => k.Group).HasForeignKey(k => k.GroupId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(g => g.User).WithMany(u => u.TaskGroups).HasForeignKey(g => g.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(g => g.Team).WithMany(u => u.TaskGroups).HasForeignKey(g => g.TeamId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(g => g.CreatedByUser).WithMany().HasForeignKey(g => g.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(g => g.UpdatedByUser).WithMany().HasForeignKey(g => g.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
            entity.Property(i => i.RowVersion).IsRowVersion().ValueGeneratedOnAddOrUpdate().HasDefaultValueSql("'\\x00000000'::bytea");
        });
        modelBuilder.Entity<TaskGroup>().HasIndex(g => new { g.UserId, g.TeamId, g.Name }).IsUnique();

        // --- TaskKind ---
        modelBuilder.Entity<TaskKind>(entity =>
        {
            entity.HasKey(k => k.Id);
            entity.Property(k => k.Id).ValueGeneratedOnAdd();
            entity.Property(k => k.Name).IsRequired().HasMaxLength(100);
            entity.Property(k => k.Description).HasMaxLength(500);
            entity.HasOne(k => k.Group).WithMany(g => g.Kinds).HasForeignKey(k => k.GroupId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(k => k.CreatedByUser).WithMany().HasForeignKey(k => k.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(k => k.UpdatedByUser).WithMany().HasForeignKey(k => k.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(k => k.Categories).WithOne(c => c.Kind).HasForeignKey(c => c.KindId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(i => i.RowVersion).IsRowVersion().ValueGeneratedOnAddOrUpdate().HasDefaultValueSql("'\\x00000000'::bytea");
        });
        modelBuilder.Entity<TaskKind>().HasIndex(k => new { k.GroupId, k.Name }).IsUnique();

        // --- TaskCategory ---
        modelBuilder.Entity<TaskCategory>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).ValueGeneratedOnAdd();
            entity.Property(c => c.Name).IsRequired().HasMaxLength(100);
            entity.Property(c => c.Description).HasMaxLength(500);
            entity.HasOne(c => c.Kind).WithMany(k => k.Categories).HasForeignKey(c => c.KindId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(c => c.CreatedByUser).WithMany().HasForeignKey(c => c.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(c => c.UpdatedByUser).WithMany().HasForeignKey(c => c.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(c => c.TaskItems).WithOne(i => i.Category).HasForeignKey(i => i.CategoryId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(i => i.RowVersion).IsRowVersion().ValueGeneratedOnAddOrUpdate().HasDefaultValueSql("'\\x00000000'::bytea");
        });
        modelBuilder.Entity<TaskCategory>().HasIndex(c => new { c.KindId, c.Name }).IsUnique();

        // --- TaskItem ---
        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.Id).ValueGeneratedOnAdd();
            entity.Property(i => i.Name).IsRequired().HasMaxLength(200);
            entity.Property(i => i.Description).HasMaxLength(1000);
            entity.Property(i => i.IsActive).HasDefaultValue(true);
            entity.Property(i => i.PercentComplete).HasDefaultValue((byte)0);
            entity.Property(i => i.IsPrivate).HasDefaultValue(false);
            entity.Property(i => i.Priority)
                .HasDefaultValue(TaskItemPriority.Medium)
                .HasSentinel(TaskItemPriority.None);
            // entity.Property(i => i.Grade).HasDefaultValue(13); // Default to "Ungraded"
            entity.Property(i => i.MaxBonus).HasMaxLength(100);
            entity.Property(i => i.ApprovedBonus).HasMaxLength(100);
            entity.Property(i => i.BonusStatusComment).HasMaxLength(1000);
            entity.Property(i => i.Details).HasMaxLength(8000);
            entity.HasOne(i => i.Group).WithMany(g => g.TaskItems).HasForeignKey(i => i.GroupId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.Kind).WithMany(k => k.TaskItems).HasForeignKey(i => i.KindId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.Category).WithMany(c => c.TaskItems).HasForeignKey(i => i.CategoryId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.Grade).WithMany(g => g.TaskItems).HasForeignKey(i => i.GradeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.AssignedToUser).WithMany(u => u.AssignedToTasks).HasForeignKey(i => i.AssignedTo).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.AssignedByUser).WithMany(u => u.AssignedByTasks).HasForeignKey(i => i.AssignedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.CreatedByUser).WithMany(u => u.CreatedByTasks).HasForeignKey(i => i.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.UpdatedByUser).WithMany(u => u.UpdatedByTasks).HasForeignKey(i => i.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.ArchivedByUser).WithMany(u => u.ArchivedByTasks).HasForeignKey(i => i.ArchivedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.ActiveByUser).WithMany(u => u.ActiveByTasks).HasForeignKey(i => i.ActiveBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.CompletedByUser).WithMany(u => u.CompletedByTasks).HasForeignKey(i => i.CompletedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.GradedByUser).WithMany(u => u.GradedByTasks).HasForeignKey(i => i.GradedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.BonusStatusByUser).WithMany(u => u.BonusStatusByTasks).HasForeignKey(i => i.BonusStatusBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.AllowanceApprovalStatusByUser).WithMany(u => u.AllowanceApprovalStatusByTasks).HasForeignKey(i => i.AllowanceApprovalStatusBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.Team).WithMany(t => t.TaskItems).HasForeignKey(i => i.TeamId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(i => i.TeamAllowanceInterval).WithMany(t => t.TaskItems).HasForeignKey(i => i.TeamAllowanceIntervalId).OnDelete(DeleteBehavior.SetNull);
            entity.HasMany(i => i.AllowanceHistoryTaskItems).WithOne(a => a.TaskItem).HasForeignKey(a => a.TaskItemId).OnDelete(DeleteBehavior.Cascade);    
            entity.HasMany(i => i.Comments).WithOne(c => c.TaskItem).HasForeignKey(c => c.TaskItemId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(i => i.UserPins).WithOne(p => p.TaskItem).HasForeignKey(p => p.TaskItemId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(i => i.Notifications).WithOne(n => n.TaskItem).HasForeignKey(n => n.TaskItemId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(i => i.RowVersion).IsRowVersion().ValueGeneratedOnAddOrUpdate().HasDefaultValueSql("'\\x00000000'::bytea");
        });
        modelBuilder.Entity<TaskItem>().HasIndex(i => i.Name);
        
        // Performance indexes for common query patterns
        modelBuilder.Entity<TaskItem>()
            .HasIndex(i => new { i.TeamAllowanceIntervalId, i.GradedAt })
            .HasDatabaseName("IX_TaskItems_TeamAllowanceIntervalId_GradedAt_Accredited")
            .HasFilter("\"IsApprovedForAllowance\" = true AND \"IsArchived\" = false AND \"IsPrivate\" = false AND \"GradeId\" IS NOT NULL");
        
        modelBuilder.Entity<TaskItem>()
            .HasIndex(i => new { i.AssignedTo, i.IsActive })
            .HasDatabaseName("IX_TaskItems_AssignedTo_IsActive");
        
        modelBuilder.Entity<TaskItem>()
            .HasIndex(i => new { i.CreatedBy, i.IsPrivate })
            .HasDatabaseName("IX_TaskItems_CreatedBy_IsPrivate");
        
        modelBuilder.Entity<TaskItem>()
            .HasIndex(i => new { i.DueAt, i.PercentComplete })
            .HasDatabaseName("IX_TaskItems_DueAt_PercentComplete_Active")
            .HasFilter("\"DueAt\" IS NOT NULL AND \"IsActive\" = true");
        
        modelBuilder.Entity<TaskItem>()
            .HasIndex(i => i.StartAt)
            .HasDatabaseName("IX_TaskItems_StartAt_Active")
            .HasFilter("\"StartAt\" IS NOT NULL AND \"IsActive\" = true");
        
        modelBuilder.Entity<TaskItem>()
            .HasIndex(i => i.EndAt)
            .HasDatabaseName("IX_TaskItems_EndAt_Active")
            .HasFilter("\"EndAt\" IS NOT NULL AND \"IsActive\" = true");
        
        modelBuilder.Entity<TaskItem>()
            .HasIndex(i => new { i.TeamId, i.IsActive })
            .HasDatabaseName("IX_TaskItems_TeamId_IsActive");
        
        modelBuilder.Entity<TaskItem>()
            .HasIndex(i => new { i.MaxBonus, i.BonusStatusAt })
            .HasDatabaseName("IX_TaskItems_MaxBonus_BonusStatusAt")
            .HasFilter("\"MaxBonus\" IS NOT NULL");

        // --- User ---
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("AspNetUsers");
            entity.Property(u => u.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(u => u.LastName).IsRequired().HasMaxLength(100);
            entity.Property(u => u.MiddleName).HasMaxLength(100);
            entity.Property(u => u.Salutation).HasMaxLength(50);
            entity.HasMany(u => u.AssignedToTasks).WithOne(i => i.AssignedToUser).HasForeignKey(i => i.AssignedTo).OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(u => u.AssignedByTasks).WithOne(i => i.AssignedByUser).HasForeignKey(i => i.AssignedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(u => u.CreatedByTasks).WithOne(i => i.CreatedByUser).HasForeignKey(i => i.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(u => u.UpdatedByTasks).WithOne(i => i.UpdatedByUser).HasForeignKey(i => i.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(u => u.ActiveByTasks).WithOne(i => i.ActiveByUser).HasForeignKey(i => i.ActiveBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(u => u.CompletedByTasks).WithOne(i => i.CompletedByUser).HasForeignKey(i => i.CompletedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(u => u.GradedByTasks).WithOne(i => i.GradedByUser).HasForeignKey(i => i.GradedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(u => u.ArchivedByTasks).WithOne(i => i.ArchivedByUser).HasForeignKey(i => i.ArchivedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(u => u.UserAllowanceHistories).WithOne(a => a.User).HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(u => u.ApprovedByAllowanceHistories).WithOne(a => a.ApprovedByUser).HasForeignKey(a => a.ApprovedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(u => u.Team).WithMany(t => t.Members).HasForeignKey(u => u.TeamId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(u => u.CreatedByUser).WithMany().HasForeignKey(u => u.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(u => u.UpdatedByUser).WithMany().HasForeignKey(u => u.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(u => u.DeviceRegistrations).WithOne(d => d.User).HasForeignKey(d => d.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(u => u.IsAdmin).HasDefaultValue(false);
            entity.Property(u => u.RowVersion).IsRowVersion().ValueGeneratedOnAddOrUpdate().HasDefaultValueSql("'\\x00000000'::bytea");
        });

        // Add unique constraints for User
        modelBuilder.Entity<User>().HasIndex(u => u.UserName).IsUnique();
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

        // --- UserTaskItemPin ---
        modelBuilder.Entity<UserTaskItemPin>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(i => i.Id).ValueGeneratedOnAdd();
            entity.Property(p => p.PinnedAt).IsRequired();
            entity.HasOne(p => p.User).WithMany(u => u.TaskItemPins).HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(p => p.TaskItem).WithMany(t => t.UserPins).HasForeignKey(p => p.TaskItemId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<UserTaskItemPin>().HasIndex(propertyNames => new { propertyNames.UserId, propertyNames.TaskItemId }).IsUnique();

        // --- TaskComments ---
        modelBuilder.Entity<TaskComment>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).ValueGeneratedOnAdd();
            entity.Property(c => c.Content).IsRequired().HasMaxLength(1000);
            entity.Property(c => c.CreatedAt).IsRequired();
            entity.Property(c => c.UpdatedAt).IsRequired(false);
            entity.HasOne(c => c.TaskItem).WithMany(t => t.Comments).HasForeignKey(c => c.TaskItemId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(c => c.CreatedByUser).WithMany().HasForeignKey(c => c.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(c => c.UpdatedByUser).WithMany().HasForeignKey(c => c.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
        });

        // --- Team ---
        modelBuilder.Entity<Team>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Id).ValueGeneratedOnAdd();   
            entity.Property(t => t.Name).IsRequired().HasMaxLength(100);
            entity.Property(t => t.Description).HasMaxLength(500);
            entity.Property(t => t.IsBusiness).HasDefaultValue(false);
            entity.Property(i => i.RowVersion).IsRowVersion().ValueGeneratedOnAddOrUpdate().HasDefaultValueSql("'\\x00000000'::bytea");
            entity.HasOne(t => t.UpdatedByUser).WithMany().HasForeignKey(t => t.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(t => t.TaskGroups).WithOne(g => g.Team).HasForeignKey(g => g.TeamId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(t => t.TaskItems).WithOne(i => i.Team).HasForeignKey(i => i.TeamId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(a => a.AllowanceHistories).WithOne(h => h.Team).HasForeignKey(h => h.TeamId).OnDelete(DeleteBehavior.Restrict);
        });

        // Subscription webhook performance indexes
        modelBuilder.Entity<Team>()
            .HasIndex(t => t.PurchaseToken)
            .HasDatabaseName("IX_Teams_PurchaseToken")
            .HasFilter("\"PurchaseToken\" IS NOT NULL");

        modelBuilder.Entity<Team>()
            .HasIndex(t => new { t.ProductId, t.SubscriptionPlatform })
            .HasDatabaseName("IX_Teams_ProductId_Platform")
            .HasFilter("(\"SubscriptionPlatform\" = 'android' OR \"SubscriptionPlatform\" = 'ios')");

        modelBuilder.Entity<Team>()
            .HasIndex(t => t.OriginalTransactionId)
            .HasDatabaseName("IX_Teams_OriginalTransactionId")
            .HasFilter("\"OriginalTransactionId\" IS NOT NULL");

        // --- TeamAllowanceIntervals ---
        modelBuilder.Entity<TeamAllowanceInterval>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.Id).ValueGeneratedOnAdd();
            entity.Property(i => i.Name).HasMaxLength(100);
            entity.Property(i => i.Description).HasMaxLength(500);
            entity.Property(i => i.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(i => i.ResetGradesOnIntervalEnd).IsRequired().HasDefaultValue(true);
            entity.Property(i => i.MaxAllowanceAmount).IsRequired().HasPrecision(18, 2);
            entity.Property(i => i.MinCreditsForAllowance).IsRequired();
            entity.Property(i => i.IntervalType).IsRequired();
            entity.Property(i => i.IntervalValue).IsRequired();
            entity.Property(i => i.StartDayOfWeek).IsRequired(false);
            entity.Property(i => i.StartMonthOfYear).IsRequired(false);
            entity.Property(c => c.CreatedAt).IsRequired();
            entity.HasOne(i => i.Team).WithMany(t => t.AllowanceIntervals).HasForeignKey(i => i.TeamId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.CreatedByUser).WithMany().HasForeignKey(i => i.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.UpdatedByUser).WithMany().HasForeignKey(i => i.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(i => i.GradingPeriods).WithOne(s => s.TeamAllowanceInterval).HasForeignKey(s => s.TeamAllowanceIntervalId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(i => i.RowVersion).IsRowVersion().ValueGeneratedOnAddOrUpdate().HasDefaultValueSql("'\\x00000000'::bytea");
        });

        // modelBuilder.Entity<TeamAllowanceInterval>().HasIndex(i => new { i.TeamId, i.IntervalType, i.IntervalValue, i.StartDayOfWeek }).IsUnique();
        

        // --- Grade ---
        modelBuilder.Entity<Grade>(entity =>
        {
            entity.HasKey(g => g.Id);
            entity.Property(g => g.Id).ValueGeneratedOnAdd();
            entity.Property(g => g.LetterGrade).IsRequired().HasMaxLength(2);
            entity.Property(g => g.PercentGradeMin).IsRequired();
            entity.Property(g => g.PercentGradeMax).IsRequired();
            entity.Property(g => g.GradePoints).IsRequired().HasPrecision(2, 1);
            entity.Property(g => g.ReducePercent).IsRequired();
            entity.HasMany(g => g.TaskItems).WithOne(i => i.Grade).HasForeignKey(i => i.GradeId).OnDelete(DeleteBehavior.Restrict);
        });

        // --- AllowanceIntervalGradeConfig ---
        modelBuilder.Entity<AllowanceIntervalGradeConfig>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).ValueGeneratedOnAdd();
            entity.Property(c => c.AllowanceReducePercent).IsRequired();
            entity.Property(c => c.CreatedAt).IsRequired();
            entity.Property(c => c.UpdatedAt).IsRequired(false);
            entity.Property(c => c.RowVersion).IsRowVersion().ValueGeneratedOnAddOrUpdate().HasDefaultValueSql("'\\x00000000'::bytea");
            
            // Configure relationships
            entity.HasOne(c => c.AllowanceInterval).WithMany(i => i.GradeConfigs).HasForeignKey(c => c.TeamAllowanceIntervalId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(c => c.CreatedByUser).WithMany().HasForeignKey(c => c.CreatedBy).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(c => c.UpdatedByUser).WithMany().HasForeignKey(c => c.UpdatedBy).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<AllowanceIntervalGradeConfig>().HasIndex(c => new { c.TeamAllowanceIntervalId, c.GradeId }).IsUnique();

        modelBuilder.Entity<AllowanceHistory>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Id).ValueGeneratedOnAdd();
            entity.Property(a => a.CalculatedAmount).IsRequired().HasPrecision(18, 2);
            entity.Property(a => a.ApprovedAmount).HasPrecision(18, 2);
            entity.Property(a => a.CalculatedStartAt).IsRequired();
            entity.Property(a => a.ActualStartAt).IsRequired();
            entity.Property(a => a.CreatedAt).IsRequired();
            entity.Property(a => a.CalculatedEndAt).IsRequired();
            entity.Property(a => a.TotalCredits).IsRequired();
            entity.Property(a => a.Gpa).IsRequired().HasPrecision(3, 2);
            entity.Property(c => c.Comment).HasMaxLength(1000);
            entity.Property(a => a.RowVersion).IsRowVersion().ValueGeneratedOnAddOrUpdate().HasDefaultValueSql("'\\x00000000'::bytea");
            entity.HasOne(x => x.AllowanceInterval).WithMany(x => x.AllowanceHistories).HasForeignKey(x => x.TeamAllowanceIntervalId).OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(a => a.AllowanceHistoryTaskItems).WithOne(t => t.AllowanceHistory).HasForeignKey(t => t.AllowanceHistoryId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(a => a.Notifications).WithOne(n => n.AllowanceHistory).HasForeignKey(n => n.AllowanceHistoryId).OnDelete(DeleteBehavior.Cascade);
            // entity.HasOne(a => a.ApprovedByUser).WithMany(u => u.ApprovedByAllowanceHistories).HasForeignKey(a => a.ApprovedBy).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AllowanceHistory>().HasIndex(a => new { a.UserId, a.TeamAllowanceIntervalId, a.CalculatedStartAt, a.CalculatedEndAt }).IsUnique();

        modelBuilder.Entity<AllowanceHistoryTaskItems>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Id).ValueGeneratedOnAdd();
            entity.HasOne(i => i.Grade).WithMany(g => g.AllowanceHistoryTaskItems).HasForeignKey(i => i.GradeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.AssignedToUser).WithMany(u => u.AssignedToAllowanceHistoryTasks).HasForeignKey(i => i.AssignedTo).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.AssignedByUser).WithMany(u => u.AssignedByAllowanceHistoryTasks).HasForeignKey(i => i.AssignedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.GradedByUser).WithMany(u => u.GradedByAllowanceHistoryTasks).HasForeignKey(i => i.GradedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.CompletedByUser).WithMany(u => u.CompletedByAllowanceHistoryTasks).HasForeignKey(i => i.CompletedBy).OnDelete(DeleteBehavior.Restrict);
            // entity.HasOne(t => t.AllowanceHistory).WithMany(a => a.AllowanceHistoryTaskItems).HasForeignKey(t => t.AllowanceHistoryId).OnDelete(DeleteBehavior.Cascade);
            // entity.HasOne(t => t.TaskItem).WithMany().HasForeignKey(t => t.TaskItemId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AllowanceHistoryTaskItems>().HasIndex(t => new { t.AllowanceHistoryId, t.TaskItemId }).IsUnique();

        modelBuilder.Entity<UserDevices>(entity =>
        {
            entity.HasKey(d => d.Id);
            entity.Property(d => d.Id).ValueGeneratedOnAdd();
            entity.Property(d => d.FcmToken).IsRequired().HasMaxLength(200);
            entity.Property(d => d.Platform).IsRequired().HasMaxLength(50);
            entity.Property(d => d.Timezone).IsRequired().HasMaxLength(100);
            entity.Property(d => d.IsActive).HasDefaultValue(true);
            entity.Property(d => d.LastSeenAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(d => d.User).WithMany(u => u.DeviceRegistrations).HasForeignKey(d => d.UserId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<UserDevices>().HasIndex(d => new { d.UserId, d.DeviceId }).IsUnique();

        // --- UserNotificationPreference ---
        modelBuilder.Entity<UserNotificationPreference>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.Property(n => n.Id).ValueGeneratedOnAdd();
            entity.Property(n => n.NotificationType).IsRequired();
            entity.Property(n => n.Channel).IsRequired();
            entity.Property(n => n.IsEnabled).HasDefaultValue(true);
            entity.Property(n => n.CreatedAt).IsRequired();
            entity.HasOne(n => n.User).WithMany(u => u.NotificationPreferences).HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<UserNotificationPreference>().HasIndex(n => new { n.UserId, n.NotificationType, n.Channel }).IsUnique();

        // --- UserNotifications ---
        modelBuilder.Entity<UserNotification>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.Property(n => n.Id).ValueGeneratedOnAdd();
            entity.Property(n => n.NotificationType).IsRequired();
            // entity.Property(n => n.Channel).IsRequired();
            entity.Property(n => n.Title).IsRequired().HasMaxLength(200);
            entity.Property(n => n.Body).IsRequired().HasMaxLength(2000);
            entity.Property(n => n.Data).IsRequired().HasMaxLength(1000);
            entity.Property(n => n.CreatedAt).IsRequired();
            entity.HasOne(n => n.User).WithMany(u => u.Notifications).HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(n => n.TaskItem).WithMany(t => t.Notifications).HasForeignKey(n => n.TaskItemId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(n => n.AllowanceHistory).WithMany(a => a.Notifications).HasForeignKey(n => n.AllowanceHistoryId).OnDelete(DeleteBehavior.NoAction);
        });

        // Seed Data
        SeedData(modelBuilder);
    }

    private void SeedData(ModelBuilder modelBuilder)
    {
        var seedDate = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero);

        modelBuilder.Entity<Grade>().HasData(
            new Grade { Id = 1, LetterGrade = "A+", PercentGradeMin = 97, PercentGradeMax = 100, GradePoints = 4, ReducePercent = 0 },
            new Grade { Id = 2, LetterGrade = "A", PercentGradeMin = 93, PercentGradeMax = 96, GradePoints = 4, ReducePercent = 0 },
            new Grade { Id = 3, LetterGrade = "A-", PercentGradeMin = 90, PercentGradeMax = 92, GradePoints = 3.7M, ReducePercent = 0 },
            new Grade { Id = 4, LetterGrade = "B+", PercentGradeMin = 87, PercentGradeMax = 89, GradePoints = 3.3M, ReducePercent = 0 },
            new Grade { Id = 5, LetterGrade = "B", PercentGradeMin = 83, PercentGradeMax = 86, GradePoints = 3, ReducePercent = 5 },
            new Grade { Id = 6, LetterGrade = "B-", PercentGradeMin = 80, PercentGradeMax = 82, GradePoints = 2.7M, ReducePercent = 7 },
            new Grade { Id = 7, LetterGrade = "C+", PercentGradeMin = 77, PercentGradeMax = 79, GradePoints = 2.3M, ReducePercent = 10 },
            new Grade { Id = 8, LetterGrade = "C", PercentGradeMin = 73, PercentGradeMax = 76, GradePoints = 2, ReducePercent = 25 },
            new Grade { Id = 9, LetterGrade = "C-", PercentGradeMin = 70, PercentGradeMax = 72, GradePoints = 1.7M, ReducePercent = 40 },
            new Grade { Id = 10, LetterGrade = "D+", PercentGradeMin = 67, PercentGradeMax = 69, GradePoints = 1.3M, ReducePercent = 68 },
            new Grade { Id = 11, LetterGrade = "D", PercentGradeMin = 65, PercentGradeMax = 66, GradePoints = 1, ReducePercent = 86 },
            new Grade { Id = 12, LetterGrade = "F", PercentGradeMin = 0, PercentGradeMax = 64, GradePoints = 0, ReducePercent = 100 }
            // new Grade { Id = 13, LetterGrade = "_", PercentGradeMin = 0, PercentGradeMax = 0, GradePoint = 0, ReducePercent = 100 }
        );

        // Test Data Seeding
        // Seed Teams
        modelBuilder.Entity<Team>().HasData(
            new Team { Id = 1, Name = "Default Team", Description = "Default team for testing", IsBusiness = false },
            new Team { Id = 2, Name = "Development Team", Description = "Software development team", IsBusiness = true }
        );


        // Seed Users (Admin user for seeding purposes)
        modelBuilder.Entity<User>().HasData(
            new User 
            { 
                Id = 1, 
                UserName = "admin@dodone.com",
                NormalizedUserName = "ADMIN@DODONE.COM",
                Email = "admin@dodone.com",
                NormalizedEmail = "ADMIN@DODONE.COM",
                EmailConfirmed = true,
                PasswordHash = "AQAAAAEAACcQAAAAEJ8u9kXfSklHmPE4U1z4kJ8DKB5e2MYdJfz9h7QZQ4Kq8w5I6HJG9v8X2F7N5a3O4P",
                SecurityStamp = "AAAAAAAAAAAAAAAAAAAAAAAAAA",
                ConcurrencyStamp = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                TeamId = 1,
                FirstName = "System",
                LastName = "Administrator",
                IsAdmin = true,
                IsActive = true,
                CreatedAt = seedDate
            }
        );

        modelBuilder.Entity<User>().HasData(
            new User 
            { 
                Id = 100000, 
                UserName = "deleted",
                NormalizedUserName = "DELETED",
                Email = "deleted@dodone.com",
                NormalizedEmail = "DELETED@DODONE.COM",
                EmailConfirmed = true,
                PasswordHash = "AQAAAAEAACcQAAAAEJ8u9kXfSklHmPE4U1z4kJ8DKB5e2MYdJfz9h7QZQ4Kq8w5I6HJG9v8X2F7N5a3O4P",
                SecurityStamp = "AAAAAAAAAAAAAAAAAAAAAAAAAA",
                ConcurrencyStamp = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                TeamId = 1,
                FirstName = "Deleted",
                LastName = "User",
                IsAdmin = false,
                IsActive = false,
                CreatedAt = seedDate
            }
        );

        // Seed TaskGroups
        modelBuilder.Entity<TaskGroup>().HasData(
            new TaskGroup 
            { 
                Id = 1, 
                UserId = 1, 
                Name = "Personal Tasks", 
                Description = "Personal productivity and daily tasks",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },
            new TaskGroup 
            { 
                Id = 2, 
                UserId = 1, 
                Name = "Work Projects", 
                Description = "Professional work and project tasks",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },
            new TaskGroup 
            { 
                Id = 3, 
                UserId = 1, 
                Name = "Learning & Development", 
                Description = "Education, skills, and personal development",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            }
        );

        // Seed TaskKinds
        modelBuilder.Entity<TaskKind>().HasData(
            // Personal Tasks Group
            new TaskKind 
            { 
                Id = 1, 
                GroupId = 1, 
                Name = "Daily Routines", 
                Description = "Daily habits and routine activities",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },
            new TaskKind 
            { 
                Id = 2, 
                GroupId = 1, 
                Name = "Household", 
                Description = "Home maintenance and household chores",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },
            new TaskKind 
            { 
                Id = 3, 
                GroupId = 1, 
                Name = "Health & Fitness", 
                Description = "Physical health and fitness activities",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },

            // Work Projects Group
            new TaskKind 
            { 
                Id = 4, 
                GroupId = 2, 
                Name = "Software Development", 
                Description = "Programming and software development tasks",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },
            new TaskKind 
            { 
                Id = 5, 
                GroupId = 2, 
                Name = "Project Management", 
                Description = "Planning, organizing, and managing projects",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },
            new TaskKind 
            { 
                Id = 6, 
                GroupId = 2, 
                Name = "Meetings & Communication", 
                Description = "Team meetings and communication tasks",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },

            // Learning & Development Group
            new TaskKind 
            { 
                Id = 7, 
                GroupId = 3, 
                Name = "Technical Skills", 
                Description = "Learning new technologies and technical skills",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },
            new TaskKind 
            { 
                Id = 8, 
                GroupId = 3, 
                Name = "Certifications", 
                Description = "Professional certifications and qualifications",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            }
        );

        // Seed TaskCategories
        modelBuilder.Entity<TaskCategory>().HasData(
            // Daily Routines Categories
            new TaskCategory 
            { 
                Id = 1, 
                KindId = 1, 
                Name = "Morning Routine", 
                Description = "Morning activities and habits",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },
            new TaskCategory 
            { 
                Id = 2, 
                KindId = 1, 
                Name = "Evening Routine", 
                Description = "Evening wind-down activities",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },

            // Household Categories
            new TaskCategory 
            { 
                Id = 3, 
                KindId = 2, 
                Name = "Cleaning", 
                Description = "House cleaning and organization",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },
            new TaskCategory 
            { 
                Id = 4, 
                KindId = 2, 
                Name = "Maintenance", 
                Description = "Home repairs and maintenance",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },

            // Health & Fitness Categories
            new TaskCategory 
            { 
                Id = 5, 
                KindId = 3, 
                Name = "Exercise", 
                Description = "Physical exercise and workouts",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },
            new TaskCategory 
            { 
                Id = 6, 
                KindId = 3, 
                Name = "Nutrition", 
                Description = "Diet and nutrition planning",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },

            // Software Development Categories
            new TaskCategory 
            { 
                Id = 7, 
                KindId = 4, 
                Name = "Frontend Development", 
                Description = "User interface and frontend tasks",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },
            new TaskCategory 
            { 
                Id = 8, 
                KindId = 4, 
                Name = "Backend Development", 
                Description = "Server-side and API development",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },
            new TaskCategory 
            { 
                Id = 9, 
                KindId = 4, 
                Name = "Testing & QA", 
                Description = "Testing and quality assurance",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },

            // Project Management Categories
            new TaskCategory 
            { 
                Id = 10, 
                KindId = 5, 
                Name = "Planning", 
                Description = "Project planning and scheduling",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },
            new TaskCategory 
            { 
                Id = 11, 
                KindId = 5, 
                Name = "Documentation", 
                Description = "Project documentation and reporting",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },

            // Meetings & Communication Categories
            new TaskCategory 
            { 
                Id = 12, 
                KindId = 6, 
                Name = "Team Meetings", 
                Description = "Regular team and project meetings",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },
            new TaskCategory 
            { 
                Id = 13, 
                KindId = 6, 
                Name = "Client Communication", 
                Description = "Client calls and correspondence",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },

            // Technical Skills Categories
            new TaskCategory 
            { 
                Id = 14, 
                KindId = 7, 
                Name = "Programming Languages", 
                Description = "Learning new programming languages",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },
            new TaskCategory 
            { 
                Id = 15, 
                KindId = 7, 
                Name = "Frameworks & Tools", 
                Description = "Learning new frameworks and development tools",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },

            // Certifications Categories
            new TaskCategory 
            { 
                Id = 16, 
                KindId = 8, 
                Name = "Microsoft Certifications", 
                Description = "Microsoft technology certifications",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            },
            new TaskCategory 
            { 
                Id = 17, 
                KindId = 8, 
                Name = "Cloud Certifications", 
                Description = "Cloud platform certifications",
                IsActive = true,
                CreatedBy = 1,
                CreatedAt = seedDate
            }
        );

        // --- PurchaseHistory ---
        modelBuilder.Entity<PurchaseHistory>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Id).ValueGeneratedOnAdd();
            entity.Property(p => p.Platform).IsRequired().HasMaxLength(20);
            entity.Property(p => p.ProductId).IsRequired().HasMaxLength(100);
            entity.Property(p => p.PurchaseToken).HasMaxLength(1000);
            entity.Property(p => p.TransactionId).HasMaxLength(100);
            entity.Property(p => p.OriginalTransactionId).HasMaxLength(100);
            entity.Property(p => p.ReceiptData).HasColumnType("text");  // TEXT type for unlimited size - Apple sends entire transaction history
            entity.Property(p => p.IsActive).HasDefaultValue(true);
            entity.Property(p => p.IsCancelled).HasDefaultValue(false);
            entity.Property(p => p.IsVerified).HasDefaultValue(false);
            entity.HasOne(p => p.Team).WithMany(t => t.PurchaseHistories).HasForeignKey(p => p.TeamId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(p => p.RowVersion).IsRowVersion().ValueGeneratedOnAddOrUpdate().HasDefaultValueSql("'\\x00000000'::bytea");
        });
        modelBuilder.Entity<PurchaseHistory>().HasIndex(p => p.PurchaseToken);
        modelBuilder.Entity<PurchaseHistory>().HasIndex(p => p.TransactionId);
        modelBuilder.Entity<PurchaseHistory>().HasIndex(p => p.OriginalTransactionId).IsUnique()
            .HasFilter("\"OriginalTransactionId\" IS NOT NULL");
        modelBuilder.Entity<PurchaseHistory>().HasIndex(p => new { p.TeamId, p.PurchaseDate });

        // --- FailedWebhookNotification ---
        modelBuilder.Entity<FailedWebhookNotification>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.Property(n => n.Id).ValueGeneratedOnAdd();
            entity.Property(n => n.Platform).IsRequired().HasMaxLength(20);
            entity.Property(n => n.Payload).IsRequired();
            entity.Property(n => n.PurchaseToken).HasMaxLength(1000);
            entity.Property(n => n.ProductId).HasMaxLength(100);
            entity.Property(n => n.FailureReason).HasMaxLength(500);
            entity.Property(n => n.RetryCount).HasDefaultValue(0);
            entity.Property(n => n.MaxRetries).HasDefaultValue(10);
            entity.Property(n => n.IsProcessed).HasDefaultValue(false);
            entity.Property(n => n.IsAbandoned).HasDefaultValue(false);
        });
        modelBuilder.Entity<FailedWebhookNotification>().HasIndex(n => n.PurchaseToken);
        modelBuilder.Entity<FailedWebhookNotification>().HasIndex(n => new { n.IsProcessed, n.IsAbandoned, n.NextRetryAt });
    }
}