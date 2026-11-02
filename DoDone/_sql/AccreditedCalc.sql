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
select 'Bonuses', ti."Id", ti."Name", assinedTo."UserName" AssignedTo
	--, ti.Credits, g.LetterGrade
	, ti."PercentComplete", ti."CompletedAt"
	, ti."MaxBonus", ti."ApprovedBonus", ti."IsBonusRejected", ti."BonusStatusComment", ti."BonusClaimedAt", ti."BonusStatusBy", ti."BonusStatusAt"
	, ti."GradedAt", gradedBy."UserName" GradedBy
from "TaskItems" ti
--	join "Grades" g on ti."GradeId" = g."Id"
	join "AspNetUsers" assinedTo on ti."AssignedTo" = assinedTo."Id"
	join "AspNetUsers" gradedBy on ti."GradedBy" = gradedBy."Id"
where ti."TeamId" = 3 --and ti."AssignedTo" = 2
	--and (ti."CreatedBy" = 2 or "AssignedTo" = 2 or "IsPrivate" = 0)
	--and ti."Credits" is not null and ti."Credits" > 0 and ti."GradeId" is not null and 
	--and ti."AssignedTo" is not null
	and ti."MaxBonus" is not null and trim(ti."MaxBonus") <> ''
	--and (ti."PercentComplete" < 100 or (ti."CompletedAt" is not null and ti."CompletedAt" >= '2025-09-01 04:00:00.0000000' and ti."CompletedAt" <= '2025-10-01 03:59:59.9999990'))
	--and ti."GradedAt" is not null and ti."GradedAt" >= '2025-09-10 04:00:00.0000000 +00:00' and ti."GradedAt" <= '2025-09-17 03:59:59.0000000 +00:00'
	and ti."IsArchived" = false
order by ti."BonusStatusBy" desc, ti."BonusClaimedAt" desc, ti."AssignedTo", ti."MaxBonus", ti."Name" 





select * from "Teams"
select u."IsActive", u."IsAdmin", u."Email", u."UserName", *
from "AspNetUsers" u
where 
--u."TeamId" = 9705 and u."IsAdmin" = true
	u."Id" in (7872, 7874)  --loadtest_user_7357, loadtest_user_7359

select ah."Id", ah."TeamId", ah."UserId", ah."TeamAllowanceIntervalId" IntervalId, tai."Name" IntervalName, ah."CalculatedStartAt", ah."CalculatedEndAt", ah."CalculatedAmount", ah."TotalCredits", ah."Gpa"  
from "AllowanceHistories" ah 
	join "TeamAllowanceIntervals" tai on ah."TeamAllowanceIntervalId" = tai."Id" 
where ah."UserId" = 7872
------------------------Allowance Histories and Accredited Items

select 'Team Settings', "Id", "Name", "AllowanceIntervalType" IntervalType, "AllowanceIntervalValue" Interval, "AllowanceDayOfWeek" DoW, "MinCreditsForAllowance", "MaxAllowanceAmount", "IsBusiness"
from "Teams" 
where "Id" = 3

select ti."Id", ti."Name", ti."AssignedTo", ti."IsApprovedForAllowance" 
	, ti."IsActive", ti."Credits", ti."GradeId" 
	, ti."IsArchived", ti."IsPrivate", ti."GradedAt", ti."GradedBy"
from "TaskItems" ti
where ti."TeamAllowanceIntervalId" = 18873 and ti."AssignedTo" = 7872

-- --Accredited
select 'Accredited', ti."Id", ti."Name", assinedTo."UserName" AssignedTo
	, ti."IsActive", ti."PercentComplete", ti."Credits", g."LetterGrade"
	, ti."IsArchived", ti."IsPrivate", ti."CompletedAt", ti."GradedAt", gradedBy."UserName" GradedBy
from "TaskItems" ti
	join "Grades" g on ti."GradeId" = g."Id"
	join "AspNetUsers" assinedTo on ti."AssignedTo" = assinedTo."Id"
	join "AspNetUsers" gradedBy on ti."GradedBy" = gradedBy."Id"
where ti."TeamId" = 3 -- and ti."AssignedTo" = 7872
	--and ti."TeamAllowanceIntervalId" = 18874
	and ti."Credits" is not null and ti."Credits" > 0 and ti."GradeId" is not null and ti."AssignedTo" is not null
	and ti."GradedAt" is not null and ti."GradedAt" >= '2025-10-1 4:00:00.000 +0000' and ti."GradedAt" <= '2026-1-1 4:59:59.000 +0000'
	and ti."IsArchived" = false and ti."IsPrivate" = false
order by ti."AssignedTo", ti."GradedAt", ti."Name" 

select 'Accredited Totals', sum(ti."Credits") TotalCredits, sum(g."GradePoints") TotalGradePoints, sum(g."GradePoints" * ti."Credits") TotalWeightedGradePoints
	, sum(g."GradePoints" * ti."Credits")/sum(ti."Credits") GPA
from "TaskItems" ti
	join "Grades" g on ti."GradeId" = g."Id"
	join "AspNetUsers" assinedTo on ti."AssignedTo" = assinedTo."Id"
	join "AspNetUsers" gradedBy on ti."GradedBy" = gradedBy."Id"
where ti."TeamId" = 3 --and ti."AssignedTo" = 2
	--and (ti."CreatedBy" = 2 or "AssignedTo" = 2 or "IsPrivate" = 0)
	and ti."Credits" is not null and ti."Credits" > 0 and ti."GradeId" is not null and ti."AssignedTo" is not null
	--and (ti."PercentComplete" < 100 or (ti."CompletedAt" is not null and ti."CompletedAt" >= '2025-09-01 04:00:00.0000000' and ti."CompletedAt" <= '2025-10-01 03:59:59.9999990'))
	and ti."GradedAt" is not null --and ti."GradedAt" >= '2025-09-10 04:00:00.0000000 +00:00' and ti."GradedAt" <= '2025-09-17 03:59:59.0000000 +00:00'
	and ti."IsArchived" = false
group by ti."TeamId"


select 'ah', ah."Id", ah."TeamId", ah."UserId", u."UserName", ah."AllowanceIntervalType" IntervalType
	, (case when ah."AllowanceIntervalType" = 0 then 'Monthly' when ah."AllowanceIntervalType" = 1 then 'Weekly' when ah."AllowanceIntervalType" = 2 then 'Quarterly' else 'Unnknown' end) IntervalTypeVal
	, ah."AllowanceIntervalValue" interval, ah."StartDayOfWeek" DoW
	, ah."CalculatedStartAt", ah."CalculatedEndAt", ah."ActualStartAt", ah."TotalCredits", ah."Gpa", ah."CalculatedAmount", ah."ApprovedAmount", ah."ApprovedAt", ah."ApprovedBy", ah."Comment"
	, ah."ClaimedAt"
from "AllowanceHistories" ah
	join "AspNetUsers" u on ah."UserId" = u."Id"
--where u."Id" = 2
order by ah."TeamId", ah."UserId", ah."CalculatedStartAt" desc, ah."CalculatedEndAt" desc, ah."ActualStartAt"





























