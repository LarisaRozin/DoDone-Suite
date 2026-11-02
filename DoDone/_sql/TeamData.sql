declare @userName nvarchar(256) = 'inter'
declare @userId int = (select Id from AspNetUsers where UserName = @userName)
declare @teamId int = (select TeamId from AspNetUsers where UserName = @userName)
declare @isAdmin bit = (select IsAdmin from AspNetUsers where UserName = @userName)

declare @testIntervalId int = (select Id from TeamAllowanceIntervals where TeamId = @teamId and Name = 'Monthly ')

--select * from AspNetUsers
--update AspNetUsers set Email = 'master@dodone.com', NormalizedEmail = 'MASTER@DODONE.COM' where Email = 'larisarozin@gmail.com'
--update AspNetUsers set Email = 'ella@dodone.com', NormalizedEmail = 'ELLA@DODONE.COM' where Email = 'larisarozinworks@gmail.com'
--SELECT 'User', u.Id, u.TeamId, u.IsActive, u.IsAdmin, u.UserName, u.FirstName, u.LastName, u.Email, u.CreatedBy
--	--, u.AvatarUri
--  FROM [DoDone].[dbo].[AspNetUsers] u
--where u.TeamId = @teamId

--select 'devices', * 
--from DeviceRegistrations dr
--where dr.UserId in (select id from AspNetUsers where TeamId = @teamId)
--order by dr.UserId

--delete from DeviceRegistrations where id = 48

--select 'Team', * from Teams t where t.Id = @teamId

--select 'Group', * from TaskGroups g where g.UserId = @userId 
--select 'Kind', * from TaskKinds k where k.GroupId in (select Id from TaskGroups g where g.UserId = @userId)
--select 'Cat', * from TaskCategories c where c.KindId in (select Id from TaskKinds where GroupId in (select Id from TaskGroups where UserId = @userId))
--select 'Pin', * from UserTaskItemPins utip where utip.TaskItemId in (select Id from TaskItems where AssignedTo = @userId or CreatedBy = @userId)
--select 'Comment', * from TaskComments tc where tc.TaskItemId in (select Id from TaskItems where AssignedTo = @userId or CreatedBy = @userId)

--select 'Intervals', Id, TeamId, Name, IntervalType Type, IntervalValue Value, StartDayOfWeek sDOW, MaxAllowanceAmount MaxAmount
--	, MinCreditsForAllowance MinCreds, ResetGradesOnIntervalEnd, CreatedBy, CreatedAt, UpdatedBy, UpdatedAt
--from TeamAllowanceIntervals ai 
--where ai.TeamId = @teamId
--	--and ai.Id = @testIntervalId
----order by ai.IntervalType
----update TeamAllowanceIntervals set IntervalValue = 1 where Id = 30

--select 'GradeConfig', *
--from AllowanceIntervalGradeConfigs gc
--where gc.TeamAllowanceIntervalId in (select id from TeamAllowanceIntervals where TeamId = @teamId)



--select 'Hist', ah.UserId, u.UserName, ah.Id, ai.Name Interval, TotalCredits Credits, Gpa, CalculatedAmount Amount, AllowanceIntervalType Type
--	, AllowanceIntervalValue Value, ai.StartDayOfWeek sDOW
--	, case when ah.CalculatedEndAt > GETUTCDATE() then 'Current' else 'Ended' end
--	, CalculatedStartAt StartAt, CalculatedEndAt EndAt, ActualStartAt
--	, ah.ClaimedAt, ah.ApprovedAt, ah.ApprovedBy, ah.ApprovedAmount, ah.Comment
--	, ah.CreatedAt, ah.CreatedBy, ah.UpdatedAt, ah.UpdatedBy, ah.GradesResetAt
--from AllowanceHistories ah 
--	left join TeamAllowanceIntervals ai on ah.TeamAllowanceIntervalId = ai.Id
--	left join AspNetUsers u on ah.UserId = u.Id
--where ah.TeamId = @teamId
--	and ai.Id = @testIntervalId
--order by ah.UserId, ai.IntervalType, ah.CalculatedEndAt desc

--(No column name)	UserId	UserName	Id	Interval	Credits	Gpa	Amount	Type	Value	sDOW	StartAt	EndAt	ClaimedAt	ApprovedAt	ApprovedBy	ApprovedAmount	Comment	CreatedAt	CreatedBy	UpdatedAt	UpdatedBy	GradesResetAt
--Hist	93	inter	941	Changeling 	4	3.70	9.00	1	1	1	2025-10-26 04:00:00.0000000 +00:00	2025-11-02 03:59:59.0000000 +00:00	NULL	NULL	NULL	NULL	NULL	2025-10-31 18:45:51.8780637 +00:00	93	2025-10-31 19:13:41.5805607 +00:00	93	NULL


update TaskItems set BonusClaimedAt = null  
--, BonusStatusAt = null, BonusStatusBy = null, 
where TeamId = @teamId


select 'Tasks', t.Id, t.[Name], assignedTo.UserName assignedTo
	--, ai.Name Interval, t.IsArchived, t.IsPrivate, IsApprovedForAllowance, Credits, GradeId  
	, t.BonusClaimedAt, t.IsBonusRejected, t.BonusStatusAt, t.BonusStatusBy, t.BonusStatusComment
	, t.UpdatedAt, t.UpdatedBy
from TaskItems t 
	join TeamAllowanceIntervals ai on t.TeamAllowanceIntervalId = ai.Id
	left join AspNetUsers assignedTo on t.AssignedTo = assignedTo.Id
where t.TeamId = @teamId
	--and t.Credits is not null and t.GradeId is not null
	--and ai.Id = @testIntervalId
order by t.AssignedTo, t.TeamAllowanceIntervalId
--AssignedTo = @userId or t.CreatedBy = @userId

--select 'HistItems', * 
--from AllowanceHistoryTaskItems ahts 
--where ahts.AllowanceHistoryId in (select Id from AllowanceHistories where TeamId = @teamId) 
--		--and TeamAllowanceIntervalId = @changelingId) 
--order by ahts.AllowanceHistoryId

--select 'UserNotifications', * 
--from UserNotifications n 
--where n.UserId in (select id from AspNetUsers where TeamId = @teamId)
--order by n.UserId, n.SentAt desc
----delete from UserNotifications
----delete from AllowanceHistories

































































