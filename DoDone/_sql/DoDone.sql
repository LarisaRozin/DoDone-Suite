----use DoDone

----"test" hash: $2a$11$cgVGJcbnJBSwGKaZxgZuce0HItsZiNYrqsQL6LyzBdDHILV3ozX.e 

----select 'Team', *
----from dbo.Teams

--SELECT 'User', *
--  FROM [DoDone].[dbo].[AspNetUsers] 
--update AspNetUsers set Email = 'sam@test.com', NormalizedEmail = 'SAM@TEST.COM' where Email = 'larisarozinworks@gmail.com'
--  --update AspNetUsers set UserName = 'rita2', Email = 'rita2@test.com' where Id = 9

SELECT 'User', u.Id, u.TeamId, u.IsActive, u.IsAdmin, u.UserName, u.FirstName, u.LastName, u.Email, u.AvatarUri, count(tiAssignedTo.Id) assignedToCount
  FROM [DoDone].[dbo].[AspNetUsers] u
  left join TaskItems tiAssignedTo on tiAssignedTo.AssignedTo = u.Id 
where u.TeamId <> 1
group by u.Id, u.TeamId, u.IsActive, u.IsAdmin, u.UserName, u.FirstName, u.LastName, u.Email, u.AvatarUri
order by u.TeamId, u.IsActive, u.IsAdmin

--select * from TaskGroups where TeamId = 15
--select * from TaskKinds where GroupId in (24, 25)
--select * from TaskCategories where KindId in (33, 34, 35, 36)
--delete from TaskCategories where KindId in (33, 34, 35, 36)
--delete from TaskKinds where GroupId in (24, 25)
--delete from TaskGroups where TeamId = 15
--delete from TaskItems where AssignedTo = 38
--delete from Teams where Id = 15
--delete from AspNetUsers where Id = 38

--select count(Id) from TaskItems where CreatedBy = 2
--delete from AspNetUsers where UserName in ('bill')

--select 'TaskGroups', *
--from TaskGroups
------delete from TaskGroups

------update TaskGroups set UserId = 2

--select 'TaskKinds', *
--from TaskKinds
------delete from TaskKinds

--select 'TaskCategories', *
--from TaskCategories

--select 'TaskItems', Id, Name, Description, Details
--from TaskItems t
--	--join Grades g on t.GradeId = g.Id
--where TeamId = 3 and IsArchived = 0 and IsActive = 1 --and Credits is not null
--and t.Id = 17
----order by AssignedTo


--select ti.Name, upn.* 
--from TaskItems ti
--	join UserTaskItemPins upn on ti.Id = upn.taskItemId
----where Name = 'Notifications test'
--order by UserId, TaskItemId


--delete from UserTaskItemPins
--select *
--from TaskComments





--select sum(g.GradePoints * t.Credits) totalWeightedPoints, sum(t.Credits) totalCredits, sum(g.GradePoints * t.Credits) / sum(t.Credits) Gpa  
--from TaskItems t
--	join Grades g on t.GradeId = g.Id
--where TeamId = 3 and IsArchived = 0 and IsActive = 1 and Credits is not null and GradeId is not null
--	and GradedAt >= DATEFROMPARTS(2025, 8, 1) and GradedAt <= DATEFROMPARTS(2025, 8, 31)

----update TaskItems set AssignedTo = null, AssignedBy = null, AssignedAt = null 
--select * from Grades
----update Grades set ReducePercent = 68 where Id = 10
----update Grades set ReducePercent = 86 where Id = 11




------ Check for open transactions
----SELECT * FROM sys.dm_tran_active_transactions;

------ Get detailed transaction info with session IDs
----SELECT 
----    t.transaction_id,
----    t.name,
----    t.transaction_begin_time,
----    t.transaction_type,
----    t.transaction_state,
----    s.session_id,
----    s.login_name,
----    s.host_name,
----    s.program_name,
----    s.status,
----	s.*
----FROM sys.dm_tran_active_transactions t
----LEFT JOIN sys.dm_tran_session_transactions st ON t.transaction_id = st.transaction_id
----LEFT JOIN sys.dm_exec_sessions s ON st.session_id = s.session_id
----WHERE t.transaction_state != 0;

----KILL 318;
----KILL 321;
----KILL 323;
----KILL 325;
----KILL 328;
----KILL 331;

---- If you have an open transaction, commit it
----COMMIT;

---- Then retry your update
----UPDATE TaskItems SET AssignedTo = 2;




------ Check current values
----SELECT Id, Name, AssignedTo, UpdatedAt, UpdatedBy FROM TaskItems WHERE Id IN (1,2,3,4,5);

------ Try a direct update to confirm DB connectivity
----UPDATE TaskItems SET AssignedTo = 2 WHERE Id = 1;
----SELECT Id, Name, AssignedTo FROM TaskItems WHERE Id = 1;


----select * from dbo.Grades



--select * from AllowanceHistories

--select * 
--from DeviceRegistrations

--select * from Teams
--select * from AspNetUsers
--select * from TaskItems where TeamId = 3
--select 'all', count(*) from TaskItems where TeamId = 3 and IsArchived = 0
--select 'mine', count(*) from TaskItems where TeamId = 3 and AssignedTo = 2 and IsArchived = 0
--select 'team', count(*) from TaskItems where TeamId = 3 and AssignedTo is not null and AssignedTo <> 2 and IsArchived = 0
--select 'unassigned', count(*) from TaskItems where TeamId = 3 and AssignedTo is null and IsArchived = 0

--select count(*) from TaskItems where TeamId = 3 and CreatedBy = 2 and IsArchived = 0

--select Id, Name, IsActive, IsArchived, IsPinned, PercentComplete
--from TaskItems 
--where TeamId = 3 and CreatedBy = 2 --and IsArchived = 0
--order by CreatedAt desc, UpdatedAt desc


--SELECT Id, TeamId, UserName, Email, AvatarUri
--FROM AspNetUsers 
----WHERE SecurityStamp IS NULL;

--select IsActive, * 
--from AspNetUsers

----update TaskItems set IsActive = 1 where Id in (75, 74)

--select u.Id
--	--, u.TeamId, u.FirstName, u.LastName, u.IsActive
--	, count(ah.UserId) ahCount
----	, count(dr.Id) drCount, count(tg.Id) tgCount, count(tiCreated.Id) tiCreatedCount 
--from AspNetUsers u
--	left join AllowanceHistories ah on ah.UserId = u.Id
--	--left join DeviceRegistrations dr on dr.UserId = u.Id
--	--left join TaskGroups tg on tg.UserId = u.Id
--	--left join TaskItems tiCreated on tiCreated.CreatedBy = u.Id
--group by u.Id  --, u.TeamId, u.FirstName, u.LastName, u.IsActive

--select *
--from AllowanceHistories ah
--where ah.UserId = 3

--select dr.UserId, dr.Timezone, dr.*
--from DeviceRegistrations dr

---- Needs review filter
--select ti.Id, ti.Name, ti.IsActive, ti.PercentComplete, ti.Credits, ti.GradeId, ti.IsArchived, ti.IsPrivate, ti.AssignedTo, ti.AssignedBy
--from TaskItems ti
--where TeamId = 3 and (CreatedBy = 2 or AssignedTo = 2 or IsPrivate = 0)
--	and ti.PercentComplete = 100 and ti.Credits is not null and ti.GradeId is null
--	and ti.IsArchived = 0



--select ti.Id, ti.Name, count(c.Id) CommentsCount
--from TaskItems ti
--	left join UserTaskItemPins utip on utip.TaskItemId = ti.Id
--	left join AspNetUsers u on utip.UserId = u.Id 
--	left join TaskComments c on ti.Id = c.TaskItemId
--where ti.PercentComplete <> 100 and ti.IsActive = 1 and ti.IsArchived = 0
--group by ti.Id, ti.Name

--select ti.Id, ti.Name, count(c.Id) CommentsCount
--from TaskItems ti
--	left join UserTaskItemPins utip on utip.TaskItemId = ti.Id
--	left join AspNetUsers u on utip.UserId = u.Id 
--	left join TaskComments c on ti.Id = c.TaskItemId
--where ti.PercentComplete = 100 and ti.IsActive = 1 and ti.IsArchived = 0
--group by ti.Id, ti.Name

--select * 
--from TaskComments



------------------------Bonuses
--select 'Bonuses', ti.Id, ti.Name, assinedTo.UserName AssignedTo
--	--, ti.Credits, g.LetterGrade
--	, ti.PercentComplete, ti.CompletedAt
--	, ti.MaxBonus, ti.ApprovedBonus, ti.IsBonusRejected, ti.BonusStatusComment, ti.BonusClaimedAt, ti.BonusStatusBy, ti.BonusStatusAt
--	, ti.GradedAt, gradedBy.UserName GradedBy
--from TaskItems ti
----	join Grades g on ti.GradeId = g.Id
--	join AspNetUsers assinedTo on ti.AssignedTo = assinedTo.Id
--	join AspNetUsers gradedBy on ti.GradedBy = gradedBy.Id
--where ti.TeamId = 3 --and ti.AssignedTo = 2
--	--and (ti.CreatedBy = 2 or AssignedTo = 2 or IsPrivate = 0)
--	--and ti.Credits is not null and ti.Credits > 0 and ti.GradeId is not null and 
--	--and ti.AssignedTo is not null
--	and ti.MaxBonus is not null and trim(ti.MaxBonus) <> ''
--	--and (ti.PercentComplete < 100 or (ti.CompletedAt is not null and ti.CompletedAt >= '2025-09-01 04:00:00.0000000' and ti.CompletedAt <= '2025-10-01 03:59:59.9999990'))
--	--and ti.GradedAt is not null and ti.GradedAt >= '2025-09-10 04:00:00.0000000 +00:00' and ti.GradedAt <= '2025-09-17 03:59:59.0000000 +00:00'
--	and ti.IsArchived = 0
--order by ti.BonusStatusBy desc, ti.BonusClaimedAt desc, ti.AssignedTo, ti.MaxBonus, ti.Name 



------------------------Allowance Histories and Accredited Items

--select 'Team Settings', Id, Name, AllowanceIntervalType IntervalType, AllowanceIntervalValue Interval, AllowanceDayOfWeek DoW, MinCreditsForAllowance, MaxAllowanceAmount, IsBusiness
--from Teams 
--where Id = 3


-- --Accredited
--select 'Accredited', ti.Id, ti.Name, assinedTo.UserName AssignedTo
--	, ti.IsActive, ti.PercentComplete, ti.Credits, g.LetterGrade
--	, ti.IsArchived, ti.IsPrivate, ti.CompletedAt, ti.GradedAt, gradedBy.UserName GradedBy
--from TaskItems ti
--	join Grades g on ti.GradeId = g.Id
--	join AspNetUsers assinedTo on ti.AssignedTo = assinedTo.Id
--	join AspNetUsers gradedBy on ti.GradedBy = gradedBy.Id
--where ti.TeamId = 3 --and ti.AssignedTo = 2
--	--and (ti.CreatedBy = 2 or AssignedTo = 2 or IsPrivate = 0)
--	and ti.Credits is not null and ti.Credits > 0 and ti.GradeId is not null and ti.AssignedTo is not null
--	--and (ti.PercentComplete < 100 or (ti.CompletedAt is not null and ti.CompletedAt >= '2025-09-01 04:00:00.0000000' and ti.CompletedAt <= '2025-10-01 03:59:59.9999990'))
--	and ti.GradedAt is not null and ti.GradedAt >= '2025-09-10 04:00:00.0000000 +00:00' and ti.GradedAt <= '2025-09-17 03:59:59.0000000 +00:00'
--	and ti.IsArchived = 0
--order by ti.AssignedTo, ti.GradedAt, ti.Name 

--select 'Accredited Totals', sum(ti.Credits) TotalCredits, sum(g.GradePoints) TotalGradePoints, sum(g.GradePoints * ti.Credits) TotalWeightedGradePoints
--	, sum(g.GradePoints * ti.Credits)/sum(ti.Credits) GPA
--from TaskItems ti
--	join Grades g on ti.GradeId = g.Id
--	join AspNetUsers assinedTo on ti.AssignedTo = assinedTo.Id
--	join AspNetUsers gradedBy on ti.GradedBy = gradedBy.Id
--where ti.TeamId = 3 --and ti.AssignedTo = 2
--	--and (ti.CreatedBy = 2 or AssignedTo = 2 or IsPrivate = 0)
--	and ti.Credits is not null and ti.Credits > 0 and ti.GradeId is not null and ti.AssignedTo is not null
--	--and (ti.PercentComplete < 100 or (ti.CompletedAt is not null and ti.CompletedAt >= '2025-09-01 04:00:00.0000000' and ti.CompletedAt <= '2025-10-01 03:59:59.9999990'))
--	and ti.GradedAt is not null and ti.GradedAt >= '2025-09-10 04:00:00.0000000 +00:00' and ti.GradedAt <= '2025-09-17 03:59:59.0000000 +00:00'
--	and ti.IsArchived = 0
--group by ti.TeamId


--select 'ah', ah.Id, ah.TeamId, ah.UserId, u.UserName, ah.AllowanceIntervalType IntervalType
--	, (case when ah.AllowanceIntervalType = 0 then 'Monthly' when ah.AllowanceIntervalType = 1 then 'Weekly' when ah.AllowanceIntervalType = 2 then 'Quarterly' else 'Unnknown' end) IntervalTypeVal
--	, ah.AllowanceIntervalValue Interval, ah.AllowanceDayOfWeek DoW
--	, ah.CalculatedStartAt, ah.CalculatedEndAt, ah.ActualStartAt, ah.TotalCredits, ah.Gpa, ah.CalculatedAmount, ah.ApprovedAmount, ah.ApprovedAt, ah.ApprovedBy, ah.Comment
--	, ah.ClaimedAt
--from AllowanceHistories ah
--	join AspNetUsers u on ah.UserId = u.Id
----where u.Id = 2
--order by ah.TeamId, ah.UserId, ah.CalculatedStartAt desc, ah.CalculatedEndAt desc, ah.ActualStartAt
----delete from AllowanceHistories 

----insert into AllowanceHistories(TeamId, UserId, StartAt, EndAt, Gpa, CalculatedAmount, TotalCredits, CreatedAt)
----values (3, 2, '2025-08-01 04:00:00.0000000 +00:00', '2025-09-01 03:59:59.9999990 +00:00', 2.86, 47.00, 32, GETUTCDATE())

----update AllowanceHistories set ApprovedAmount = null, ApprovedAt = null, ApprovedBy = null, Comment = null where Id = 844
----select * from AllowanceHistoryTaskItems
--select 'ah.tis', ti.AssignedTo, u.UserName, ti.Id, ti.Name, ti.Credits, g.LetterGrade, ahts.Id, ahts.AllowanceHistoryId, ahts.GradedAt, ahts.GradedBy
--	, ahts.CreatedAt, ahts.UpdatedAt
--from AllowanceHistoryTaskItems ahts
--	join TaskItems ti on ahts.TaskItemId = ti.Id
--	join AspNetUsers u on ti.AssignedTo = u.Id
--	join Grades g on ahts.GradeId = g.Id
----where u.Id = 2
--order by u.UserName, ti.GradedAt, ti.Name
----delete from AllowanceHistoryTaskItems

--select 'ah.tis totals', sum(ti.Credits) TotalCredits, sum(g.GradePoints) TotalGradePoints, sum(g.GradePoints * ti.Credits) TotalWeightedGradePoints
--	, sum(g.GradePoints * ti.Credits)/sum(ti.Credits) GPA
--from AllowanceHistoryTaskItems ahts
--	join AllowanceHistories ah on ah.Id = ahts.AllowanceHistoryId
--	join TaskItems ti on ahts.TaskItemId = ti.Id
--	join AspNetUsers u on ti.AssignedTo = u.Id
--	join Grades g on ahts.GradeId = g.Id
----where u.Id = 2
--group by ah.TeamId


select * 
from UserNotificationPreferences
--delete from UserNotificationPreferences

select ti.Priority, *
from TaskItems ti
where 
	--ti.TeamId is null 
	ti.Details is not null

	select * from AllowanceHistories

select * from Grades
