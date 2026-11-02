/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Db.Repositories;
using DoDone.Shared;
using DoDone.Shared.Abstractions;
using DoDone.Shared.Enums;

namespace DoDone.Server.Services;

public interface ISampleDataService
{
    Task CreateSampleTaskForNewUserAsync(User user, Team team, long? intervalId, long? groupId = null, long? kindId = null, long? categoryId = null);
    Task<List<TaskGroup>> CreateDefaultTaskGroupsAsync(User user, bool isBusiness);
    Task<List<TeamAllowanceInterval>> CreateDefaultAllowanceIntervalsAsync(long teamId, bool isBusiness);
}

public class SampleDataService : ISampleDataService
{
    private readonly ITaskGroupRepository _taskGroups;
    private readonly ITaskKindRepository _taskKinds;
    private readonly ITaskCategoryRepository _taskCategories;
    private readonly ITaskItemRepository _taskItems;
    private readonly ITaskCommentRepository _taskComments;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ITeamRepository _teamRepository;
    private readonly ILogger<SampleDataService> _logger;

    public SampleDataService(
        ITaskGroupRepository taskGroups,
        ITaskKindRepository taskKinds,
        ITaskCategoryRepository taskCategories,
        ITaskItemRepository taskItems,
        ITaskCommentRepository taskComments,
        IDateTimeProvider dateTimeProvider,
        ITeamRepository teamRepository,
        ILogger<SampleDataService> logger)
    {
        _taskGroups = taskGroups;
        _taskKinds = taskKinds;
        _taskCategories = taskCategories;
        _taskItems = taskItems;
        _taskComments = taskComments;
        _dateTimeProvider = dateTimeProvider;
        _teamRepository = teamRepository;
        _logger = logger;
    }

    /// <summary>
    /// Creates a sample task for a new user. If taskGroup, taskKind, and taskCategory are provided,
    /// uses those. Otherwise, creates default ones based on team type (business vs family).
    /// </summary>
    public async Task CreateSampleTaskForNewUserAsync(User user, Team team, long? intervalId, long? groupId, long? kindId = null, long? categoryId = null)
    {
        var utcNow = _dateTimeProvider.UtcNow;

        const int SYSTEM_ADMIN_USER_ID = 1;
        var sampleTask = new TaskItem
        {
            Name = $"Welcome, {user.FirstName}!",
            Description = $"{user.FirstName}'s first DoDone task",
            TeamAllowanceIntervalId = intervalId > 0 ? intervalId : null,
            Priority = TaskItemPriority.Medium,
            Details = GetTaskDetails(user.IsAdmin, team.IsBusiness),
            DueAt = utcNow.AddYears(10),
            StartAt = utcNow,
            EndAt = utcNow.AddDays(7),
            TeamId = team.Id,
            GroupId = groupId,
            KindId = kindId,
            CategoryId = categoryId,
            IsActive = true,
            ActiveAt = utcNow,
            ActiveBy = user.Id,
            IsArchived = false,
            IsPrivate = false,
            PercentComplete = 90,
            Credits = 1,
            GradeId = 1,
            GradedBy = user.Id,
            GradedAt = utcNow,
            MaxBonus = "Have Fun!",
            AssignedTo = user.Id,
            AssignedBy = user.Id,
            AssignedAt = utcNow,
            CreatedBy = SYSTEM_ADMIN_USER_ID,
            CreatedAt = utcNow,
            IsApprovedForAllowance = true,
            AllowanceApprovalStatusBy = SYSTEM_ADMIN_USER_ID,
            AllowanceApprovalStatusAt = utcNow,
            AllowanceApprovalStatusComment = "Welcome task is system approved. The rest is up to you!",
        };

        await _taskItems.CreateAsync(sampleTask);
        await _taskItems.SaveChangesAsync();

        await _taskItems.PinAsync(sampleTask.Id, user.Id, true);
        await _taskItems.SaveChangesAsync();

        // Create sample comments
        var welcomeMessage = "Welcome to your first DoDone task!  It's easy. It's fun. It's almost done."; 

        var sampleComment = new TaskComment
        {
            TaskItemId = sampleTask.Id,
            Content = welcomeMessage,
            CreatedBy = 1,
            CreatedAt = utcNow
        };
        await _taskComments.AddAsync(sampleComment);

        var sampleComment2 = new TaskComment
        {
            TaskItemId = sampleTask.Id,
            Content = "Great job so far! Keep up the good work!",
            CreatedBy = 1,
            CreatedAt = utcNow
        };
        await _taskComments.AddAsync(sampleComment2);
    }

    public async Task<List<TaskGroup>> CreateDefaultTaskGroupsAsync(User user, bool isBusiness)
    {
        var genericGroup = new TaskGroup
        {
            Name = "Miscellaneous Tasks",
            Description = "Miscellaneous tasks",
            UserId = user.Id,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskGroups.CreateAsync(genericGroup);
        await _taskGroups.SaveChangesAsync();


        var groups = new List<TaskGroup>();
        if (isBusiness)
        {
            groups = await CreateBusinessTaskGroupsAsync(user);
        }
        else
        {
            groups = await CreateFamilyTaskGroupsAsync(user);
        }

        groups.Insert(0, genericGroup);

        return groups;
    }

    public async Task<List<TaskGroup>> CreateFamilyTaskGroupsAsync(User user)
    {
        var shoppingGroup = new TaskGroup
        {
            Name = "Shopping",
            Description = "Grocery and household shopping lists",
            UserId = user.Id,
            TeamId = user.TeamId,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskGroups.CreateAsync(shoppingGroup);

        var householdGroup = new TaskGroup
        {
            Name = "Household",
            Description = "Household chores and tasks",
            UserId = user.Id,
            TeamId = user.TeamId,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskGroups.CreateAsync(householdGroup);

        var schoolWorkGroup = new TaskGroup
        {
            Name = "School Work",
            Description = "Academic assignments and study tasks",
            UserId = user.Id,
            TeamId = user.TeamId,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskGroups.CreateAsync(schoolWorkGroup);
        await _taskGroups.SaveChangesAsync();

        var cleanYourRoomKind = new TaskKind
        {
            Name = "Clean Your Room",
            Description = "Keep your room clean",
            GroupId = householdGroup.Id,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskKinds.CreateAsync(cleanYourRoomKind);

        var doLaundryKind = new TaskKind
        {
            Name = "Do the Laundry",
            Description = "Wash and fold laundry",
            GroupId = householdGroup.Id,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskKinds.CreateAsync(doLaundryKind);

        // Math kind for School Work
        var mathKind = new TaskKind
        {
            Name = "Math",
            Description = "Mathematics assignments and homework",
            GroupId = schoolWorkGroup.Id,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskKinds.CreateAsync(mathKind);

        // English kind for School Work
        var englishKind = new TaskKind
        {
            Name = "English",
            Description = "English language arts and literature",
            GroupId = schoolWorkGroup.Id,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskKinds.CreateAsync(englishKind);

        // Science kind for School Work
        var scienceKind = new TaskKind
        {
            Name = "Science",
            Description = "Science projects and experiments",
            GroupId = schoolWorkGroup.Id,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskKinds.CreateAsync(scienceKind);

        // Groceries kind for Shopping
        var groceriesKind = new TaskKind
        {
            Name = "Groceries",
            Description = "Weekly grocery shopping",
            GroupId = shoppingGroup.Id,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskKinds.CreateAsync(groceriesKind);
        await _taskKinds.SaveChangesAsync();

        // Homework category for Math
        var homeworkCategory = new TaskCategory
        {
            Name = "Homework",
            Description = "Daily homework assignments",
            KindId = mathKind.Id,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskCategories.CreateAsync(homeworkCategory);

        // Food category for Groceries
        var foodCategory = new TaskCategory
        {
            Name = "Food",
            Description = "Food and beverage items",
            KindId = groceriesKind.Id,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskCategories.CreateAsync(foodCategory);
        await _taskCategories.SaveChangesAsync();

        var groups = new List<TaskGroup>
        {
            shoppingGroup,
            schoolWorkGroup
        };

        return groups;
    }

    public async Task<List<TaskGroup>> CreateBusinessTaskGroupsAsync(User user)
    {
        var salesGroup = new TaskGroup
        {
            Name = "Sales & Marketing",
            Description = "Customer outreach and revenue generation activities",
            UserId = user.Id,
            TeamId = user.TeamId,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskGroups.CreateAsync(salesGroup);

        var operationsGroup = new TaskGroup
        {
            Name = "Operations",
            Description = "Daily business operations and administrative tasks",
            UserId = user.Id,
            TeamId = user.TeamId,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskGroups.CreateAsync(operationsGroup);
        await _taskGroups.SaveChangesAsync();

        var leadGenKind = new TaskKind
        {
            Name = "Lead Generation",
            Description = "Activities to identify and attract potential customers",
            GroupId = salesGroup.Id,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskKinds.CreateAsync(leadGenKind);

        var hrKind = new TaskKind
        {
            Name = "Human Resources",
            Description = "Employee management and administrative tasks",
            GroupId = operationsGroup.Id,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskKinds.CreateAsync(hrKind);
        await _taskKinds.SaveChangesAsync();

        var coldOutreachCategory = new TaskCategory
        {
            Name = "Cold Outreach",
            Description = "Direct contact with potential customers",
            KindId = leadGenKind.Id,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskCategories.CreateAsync(coldOutreachCategory);

        var recruitmentCategory = new TaskCategory
        {
            Name = "Recruitment",
            Description = "Hiring and onboarding new employees",
            KindId = hrKind.Id,
            CreatedBy = user.Id,
            CreatedAt = _dateTimeProvider.UtcNow
        };
        await _taskCategories.CreateAsync(recruitmentCategory);
        await _taskCategories.SaveChangesAsync();

        var groups = new List<TaskGroup>
        {
            salesGroup,
            operationsGroup
        };
        return groups;
    }

    private static string GetTaskDetails(bool isAdmin, bool isBusiness)
    {
        var userTypeLowerCase = isBusiness ? "team" : "family";
        var userTypeUpperCase = isBusiness ? "Team" : "Family";
        var rewardWordLowerCase = isBusiness ? "incentive" : "allowance";
        var rewardWordUpperCase = isBusiness ? "Incentive" : "Allowance";
        var addMemberLine = isAdmin ? "<li>Add <a href=\"dodone://teammemberedit/new\">family members</a>.</li>" : string.Empty;
        var manageTasksLine = isAdmin
            ? $"<li>Your <a href=\"dodone://mainapp\">home</a> screen provides tools to review and manage your own and your {userTypeLowerCase}'s tasks, and to add <a href=\"dodone://taskedit\">new tasks</a>.</li>"
            : $"<li>Your <a href=\"dodone://mainapp\">home</a> screen provides tools to review and manage your tasks, and to add <a href=\"dodone://taskedit\">new tasks</a>.</li>";
        var filtersLine = isAdmin
            ? $"<li>Use <a href=\"dodone://mainapp/expanddashboard\">filters</a>&nbsp;to see your {userTypeLowerCase}'s or your own workload and performance narrowed by the filter criteria at a glance. You can filter by {userTypeLowerCase} members or {rewardWordLowerCase} intervals or any of the task properties. Filters all work together. Archived and completed tasks are filtered out by default. Use 'Clear Filters' option to remove all filters or 'Reset Filters' option to get back to default. </li>"
            : $"<li>Use <a href=\"dodone://mainapp/expanddashboard\">filters</a>&nbsp;to see your workload and performance narrowed by the filter criteria at a glance. You can filter by intervals or any of the task properties. Filters all work together. Archived and completed tasks are filtered out by default. Use 'Clear Filters' option to remove all filters or 'Reset Filters' option to get back to default. </li>";
        var allowanceIntervalsAdminLine = isBusiness
            ? $"<li>Want to reward your team members weekly for routine chores & maintenance, monthly or quarterly for complex tasks progress and add yearly bonus for good work? That's what <b>Incentive Intervals</b> are for: they let you define reward frequencies, amounts and minimum workload (credits) for the reward. You can create as many intervals as you need in your <a href=\"dodone://teampreferences\">{userTypeLowerCase} preferences</a> </li>"
            : $"<li>Want to reward your kids weekly for routine chores, monthly for reading assignments and quarterly for grade reports? That's what <b>Allowance Intervals</b> are for: they let you define reward frequencies, amounts and minimum workload (credits) for the reward. You can create as many intervals as you need in your <a href=\"dodone://teampreferences\">{userTypeLowerCase} preferences</a> </li>";
        var allowanceIntervalsNonAdminLine = isBusiness
            ? $"<li>Want to know when your next incentive reward is coming up? That's what <b>Incentive Intervals</b> are for: they show you how often you will get your reward and how much you will get and the minimum workload (credits) you need to undertake to get it. You can review intervals defined for your team in your <a href=\"dodone://teampreferences\">{userTypeLowerCase} preferences</a> </li>"
            : $"<li>Want to know when your next allowance reward is coming up? That's what <b>Allowance Intervals</b> are for: they show you how often you will get your allowance and how much you will get and the minimum workload (credits) you need to undertake to get it. You can review intervals defined for your family in your <a href=\"dodone://teampreferences\">{userTypeLowerCase} preferences</a> </li>";
        var allowanceIntervalLine = isAdmin
            ? allowanceIntervalsAdminLine
            : allowanceIntervalsNonAdminLine;
        var claimAndApproveButtonsLine = isAdmin
            ? $"<li>{rewardWordUpperCase} <b>Approval</b> buttons will show up for you on the <a href=\"dodone://mainapp/allowances\">{rewardWordUpperCase} Popup</a> a couple of days prior to the end of current {rewardWordLowerCase} interval.</li>"
            : $"<li>{rewardWordUpperCase} <b>Claim</b> button will show up for you on the <a href=\"dodone://mainapp/allowances\">{rewardWordUpperCase} Popup</a> a couple of days prior to the end of current {rewardWordLowerCase} interval.</li>";
        var allowanceNeedReviewLine = isAdmin
            ? $"<li>Tasks \"<b>Need Review</b>\" when they have <b>credits</b> assigned to them and are completed but haven't been <b>graded</b> yet.</li>"
            : string.Empty;
        var bonusNeedReviewLine = isAdmin
            ? $"<li>Bonuses \"<b>Need Review</b>\" when a task has been <b>completed</b> but bonus hasn't been <b>approved</b> yet</li>"
            : string.Empty;
        var defaultGroups = isBusiness
            ? "Sales & Marketing, Operations, Human Resources"
            : "Shopping, Household, School Work";
        var taskGroupsLine = isAdmin
            ? $"<li>Groups, Kinds and Categories help in organizing and filtering your tasks. We have created some default ones for you: {defaultGroups}.... You can keep our defaults or <a href=\"dodone://taskgroups\">change them as you like</a>.</li>"
            : $"<li>Groups, Kinds and Categories help in organizing and filtering your tasks. We have created some default ones for you: {defaultGroups}.... You can <a href=\"dodone://taskgroups\">create your own</a>.</li>";
        var taskGroupsFilteringLine = isAdmin
            ? $"<li>Once you assign them to tasks, you can <a href=\"dodone://mainapp/expanddashboard\">filter</a> tasks to specific Groups, Kinds and Categories to see how you or your {userTypeLowerCase} is doing in those specific areas.</li>"
            : $"<li>Once you assign them to tasks, you can <a href=\"dodone://mainapp/expanddashboard\">filter</a> tasks to specific Groups, Kinds and Categories to see how you are doing in those specific areas.</li>";
        

        var bonus1 = "$100";
        var bonus2 = isBusiness ? "New Laptop" : "A Puppy";
        var bonus3 = isBusiness ? "Week Off" : "Trip to Disney Land";
        return @$"<div>
	<div>
		<h3 style=""text-align: center;"">
			<span style=""color: rgb(230, 81, 0); text-decoration-line: initial; text-decoration-color: rgb(230, 81, 0); font-family: Fredoka-Regular, Fredoka, cursive;"">You and Your {userTypeUpperCase}</span>
		</h3>
	</div>
	<span style=""font-family: Fredoka-Regular, Fredoka, cursive;"">
		<font color=""#1565c0"">
			<ul>
				<li>Review your <a href=""dodone://teammemberedit"">profile settings</a> and add your <a href=""dodone://teammemberedit"">avatar</a>.</li>
                {addMemberLine}
				<li>Review your <a href=""dodone://team"">{userTypeLowerCase}</a> and your {userTypeLowerCase}'s <a href=""dodone://teampreferences"">preferences and {rewardWordLowerCase} settings</a>.</li>
				<li>Review your <a href=""dodone://notificationsettings"">notification preferences</a>.</li>
			</ul>
		</font>
	</span>
	<div>
		<h3 style=""text-align: center;"">
			<span style=""color: rgb(230, 81, 0); text-decoration-line: initial; text-decoration-color: rgb(230, 81, 0); font-family: Fredoka-Regular, Fredoka, cursive;"">DoDone Tasks</span>
		</h3>
	</div>
	<span style=""font-family: Fredoka-Regular, Fredoka, cursive;"">
		<font color=""#1565c0"">
			<ul>
                {manageTasksLine}
                {filtersLine}
				<li><b>DoDone tasks</b> are versatile and flexible. Only task name is required - all the other task properties are optional - use them or not, as you see fit.</li>
				<li>Long-hold first task to enter <b>multi-select</b>&nbsp;mode to perform same action on multiple tasks.</li>
				<li><b>Private</b> tasks are just yours. You can assign credits to them to indicate task complexity and you can grade yourself, but they are visible only to you and are not included in {rewardWordLowerCase} calculations.</li>
			</ul>
		</font>
	</span>
	<div>
		<h3 style=""text-align: center;"">
			<span style=""color: rgb(230, 81, 0); text-decoration-line: initial; text-decoration-color: rgb(230, 81, 0); font-family: Fredoka-Regular, Fredoka, cursive;"">{rewardWordUpperCase}s</span>
		</h3>
	</div>
	<span style=""font-family: Fredoka-Regular, Fredoka, cursive;"">
		<font color=""#1565c0"">
			<ul>
                {allowanceIntervalLine}
				<li><b>GPA</b> and <b>{rewardWordLowerCase}s</b> will recalculate as soon <b>credits</b> are assigned to a task.</li>
                {claimAndApproveButtonsLine}
                {allowanceNeedReviewLine}
			</ul>
		</font>
	</span>
	<div>
		<h3 style=""text-align: center;"">
			<span style=""color: rgb(230, 81, 0); text-decoration-line: initial; text-decoration-color: rgb(230, 81, 0); font-family: Fredoka-Regular, Fredoka, cursive;"">Bonuses</span>
		</h3>
	</div>
	<span style=""font-family: Fredoka-Regular, Fredoka, cursive;"">
		<font color=""#1565c0"">
			<ul>
				<li>Bonus can be added to any task for further incentive.</li>
				<li>Bonuses are not necessarily monetary amounts - they could be anything you want, e.g.: <b>""{bonus1}""</b>, <b>""{bonus2}""</b>, or <b>""{bonus3}""</b>.</li>
				<li>Bonuses can be <b>approved</b> or <b>rejected</b> as soon as a task is <b>completed</b>.</li>
				<li><a href=""dodone://mainapp/bonuses"">Bonuses Popup</a> will let you filter tasks by bonus status.</li>
                {bonusNeedReviewLine}
			</ul>
		</font>
	</span>
	<div>
		<h3 style=""text-align: center;"">
			<span style=""color: rgb(230, 81, 0); text-decoration-line: initial; text-decoration-color: rgb(230, 81, 0); font-family: Fredoka-Regular, Fredoka, cursive;"">Groups, Kinds &amp; Categories</span>
		</h3>
	</div>
	<span style=""font-family: Fredoka-Regular, Fredoka, cursive;"">
		<font color=""#1565c0"">
			<ul>
                {taskGroupsLine}
                {taskGroupsFilteringLine}
			</ul>
		</font>
	</span>
	<div>
		<h3 style=""text-align: center;"">
			<span style=""color: rgb(230, 81, 0); text-decoration-line: initial; text-decoration-color: rgb(230, 81, 0); font-family: Fredoka-Regular, Fredoka, cursive;"">Last but not least</span>
		</h3>
	</div>
	<span style=""font-family: Fredoka-Regular, Fredoka, cursive;"">
		<font color=""#1565c0"">
			<ul>
				<li>Consider archiving tasks like this one instead of deleting them so you can filter them out but still look at them later and bring them back if needed.</li>
				<li>Click and scroll around.</li>
				<li><b>Have fun!!!</b></li>
			</ul>
		</font>
        </br></br></br></br>
	</span>
</div>";
    }

    public async Task<List<TeamAllowanceInterval>> CreateDefaultAllowanceIntervalsAsync(long teamId, bool isBusiness)
    {
        var defaultIntervals = new List<TeamAllowanceInterval>();

        if (isBusiness)
        {
            defaultIntervals = new List<TeamAllowanceInterval>
            {
                new TeamAllowanceInterval
                {
                    TeamId = teamId,
                    Name = "Weekly Maintenance",
                    MaxAllowanceAmount = 50.00m,
                    MinCreditsForAllowance = 4,
                    IntervalType = AllowanceIntervalType.Weekly,
                    IntervalValue = 1,
                    StartDayOfWeek = DayOfWeek.Sunday,
                    CreatedBy = Defaults.SystemUserId,
                    CreatedAt = _dateTimeProvider.UtcNow,
                },
                new TeamAllowanceInterval
                {
                    TeamId = teamId,
                    Name = "Monthly Tasks Review",
                    MaxAllowanceAmount = 100.00m,
                    MinCreditsForAllowance = 10,
                    IntervalType = AllowanceIntervalType.Monthly,
                    IntervalValue = 1,
                    StartDayOfWeek = DayOfWeek.Sunday,
                    CreatedBy = Defaults.SystemUserId,
                    CreatedAt = _dateTimeProvider.UtcNow,
                },
                new TeamAllowanceInterval
                {
                    TeamId = teamId,
                    Name = "Yearly Bonus",
                    MaxAllowanceAmount = 500.00m,
                    MinCreditsForAllowance = 12,
                    IntervalType = AllowanceIntervalType.Monthly,
                    IntervalValue = 12,
                    StartDayOfWeek = DayOfWeek.Sunday,
                    StartMonthOfYear = 1,
                    CreatedBy = Defaults.SystemUserId,
                    CreatedAt = _dateTimeProvider.UtcNow,
                },
            };
        }
        else
        {
            defaultIntervals = new List<TeamAllowanceInterval>
            {
                new TeamAllowanceInterval
                {
                    TeamId = teamId,
                    Name = "Routine Weekly Chores",
                    MaxAllowanceAmount = 16.0m,
                    MinCreditsForAllowance = 2,
                    IntervalType = AllowanceIntervalType.Weekly,
                    IntervalValue = 1,
                    StartDayOfWeek = DayOfWeek.Sunday,
                    CreatedBy = Defaults.SystemUserId,
                    CreatedAt = _dateTimeProvider.UtcNow,
                },
                new TeamAllowanceInterval
                {
                    TeamId = teamId,
                    Name = "Monthly Reading",
                    MaxAllowanceAmount = 24.0m,
                    MinCreditsForAllowance = 4,
                    IntervalType = AllowanceIntervalType.Monthly,
                    IntervalValue = 1,
                    StartDayOfWeek = DayOfWeek.Sunday,
                    CreatedBy = Defaults.SystemUserId,
                    CreatedAt = _dateTimeProvider.UtcNow,
                },
                new TeamAllowanceInterval
                {
                    TeamId = teamId,
                    Name = "School",
                    MaxAllowanceAmount = 140.0m,
                    MinCreditsForAllowance = 12,
                    IntervalType = AllowanceIntervalType.SchoolYear,
                    IntervalValue = 1,
                    StartDayOfWeek = DayOfWeek.Sunday,
                    CreatedBy = Defaults.SystemUserId,
                    CreatedAt = _dateTimeProvider.UtcNow,
                    GradingPeriods = new List<TeamAllowanceIntervalGradingPeriod>
                    {
                        new TeamAllowanceIntervalGradingPeriod
                        {
                            Name = "Fall Semester Q1",
                            StartMonth = MonthOfYear.August,
                            StartDay = 11,
                            EndMonth = MonthOfYear.October,
                            EndDay = 10,
                            IsSchoolBreak = false,
                        },
                        new TeamAllowanceIntervalGradingPeriod
                        {
                            Name = "Fall Semester Q2",
                            StartMonth = MonthOfYear.October,
                            StartDay = 11,
                            EndMonth = MonthOfYear.December,
                            EndDay = 19,
                            IsSchoolBreak = false,
                        },
                        new TeamAllowanceIntervalGradingPeriod
                        {
                            Name = "Winter Break",
                            StartMonth = MonthOfYear.December,
                            StartDay = 20,
                            EndMonth = MonthOfYear.January,
                            EndDay = 5,
                            IsSchoolBreak = true,
                        },
                        new TeamAllowanceIntervalGradingPeriod
                        {
                            Name = "Spring Semester Q1",
                            StartMonth = MonthOfYear.January,
                            StartDay = 6,
                            EndMonth = MonthOfYear.March,
                            EndDay = 13,
                            IsSchoolBreak = false,
                        },
                        new TeamAllowanceIntervalGradingPeriod
                        {
                            Name = "Spring Break",
                            StartMonth = MonthOfYear.March,
                            StartDay = 14,
                            EndMonth = MonthOfYear.March,
                            EndDay = 22,
                            IsSchoolBreak = true,
                        },
                        new TeamAllowanceIntervalGradingPeriod
                        {
                            Name = "Spring Semester Q2",
                            StartMonth = MonthOfYear.March,
                            StartDay = 23,
                            EndMonth = MonthOfYear.May,
                            EndDay = 28,
                            IsSchoolBreak = false,
                        },
                        new TeamAllowanceIntervalGradingPeriod
                        {
                            Name = "Summer Break",
                            StartMonth = MonthOfYear.May,
                            StartDay = 29,
                            EndMonth = MonthOfYear.August,
                            EndDay = 10,
                            IsSchoolBreak = true,
                        },
                    },
                },
            };
        }

        foreach (var interval in defaultIntervals)
        {
            try
            {
                await _teamRepository.CreateAllowanceIntervalAsync(interval);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating default allowance interval {IntervalName}: {ErrorMessage}", interval.Name, ex.Message);
            }
        }
        return defaultIntervals;
    }
}