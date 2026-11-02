--declare @userName nvarchar(256) = 'val'
--declare @userId int = (select Id from AspNetUsers where UserName = @userName)
--declare @teamId int = (select TeamId from AspNetUsers where UserName = @userName)
--declare @isAdmin bit = (select IsAdmin from AspNetUsers where UserName = @userName)
--
update "AspNetUsers" set "Email" = 'larisarozinworks@gmail.com', "NormalizedEmail" = 'LARISAROZINWORKS@GMAIL.COM' where "Id" = 7
------update AspNetUsers set Email = 'ella@dodone.com', NormalizedEmail = 'ELLA@DODONE.COM' where Email = 'larisarozinworks@gmail.com'
--
--SELECT 'User', u.Id, u.TeamId, u.IsActive, u.IsAdmin, u.UserName, u.FirstName, u.LastName, u.Email, u.AvatarUri
--  FROM [DoDone].[dbo].[AspNetUsers] u
--where u.Id = @userId

select * 
from "DeviceRegistrations" dr
where 
--where dr."UserId" = @userId
----delete from DeviceRegistrations where Id = 51

select 'Team', t."Id", t."Name", t."IsBusiness", t."CreatedAt", t."UpdatedBy", t."UpdatedAt", t."SubscriptionTier", t."TrialEndsAt", t."SubscriptionPlatform", t."ProductId", t."SubscriptionExpiresAt", t."OriginalTransactionId", t."PurchaseToken", t."ReceiptData"  
from "Teams" t 
--where t."Name" not like 'LoadTest%' and t."Name" not like 'ltreg%'
--where t."Id" = @teamId
order by t."Id"  desc
limit 100;

select u."Id" , u."TeamId", u."UserName", u."Email" , u."FirstName" , u."LastName" , u."IsAdmin" , u."IsActive" , u."CreatedBy" , u."CreatedAt" , u."UpdatedBy" , u."UpdatedAt"
	, u."EmailConfirmed", dr.* 
from "AspNetUsers" u
	join "DeviceRegistrations" dr on u."Id" = dr."UserId" 
--where u."UserName" = 'max'
--	u."TeamId" in (select "TeamId" from "Teams" t where t."Name" not like 'LoadTest%' and t."Name" not like 'ltreg%')
--	and u."FirstName" not like 'TestUser%' and u."FirstName" not like 'ltreg%' and u."FirstName" not like 'FirstName%'
--	and u."IsAdmin" 
order by u."Id" , dr."Id" 


select distinct t."Id" tId, t."CreatedAt" tCreated
	, u."Id", u."UserName", u."Email" , u."FirstName", u."CreatedAt"  
	--, u."IsFirstTeamAdmin", u."IsAdmin" , u."IsActive"
	--, dr."Platform"
	, t."SubscriptionTier" 
	, t."SubscriptionExpiresAt"
	, t."TrialEndsAt"    
	, u."TrialWelcomeSentAt", u."Trial1DayWarningSentAt", u."Trial3DayWarningSentAt", u."TrialExpiredWarningSentAt"   

	from "AspNetUsers" u
	join "Teams" t on u."TeamId" = t."Id"
	join "DeviceRegistrations" dr on u."Id" = dr."UserId" 
where u."IsActive" = true and u."IsAdmin" = true  -- and t."SubscriptionTier" = 0 
	and u."FirstName" not like 'TestUser%' and u."FirstName" not like 'ltreg%' and u."FirstName" not like 'FirstName%'
order by t."SubscriptionTier", u."Id" --, dr."Id" 
limit 100;

select *
from "AspNetUsers" u
where u."Email" like '%gmail.com'



update "Teams" set "SubscriptionExpiresAt" = '2027-01-03 06:41:16.128 -0500' where "Id" = 7

select u."Id", u."UserName", u."Email", u."IsAdmin", u."IsActive", u."FirstName", u."LastName", u."CreatedAt", u."UpdatedAt" 
from "AspNetUsers" u
order by u."Id" 
--where u."UserName" in ('master', 'super');
limit 100

select *
from "TaskItems" ti 
where ti."TeamId" = 32835

select * from "Teams" t where t."Id" in (7, 32835);

update "Teams" set "SubscriptionExpiresAt" = '2027-01-03 06:41:16.128 -0500' where "Id" = 7

select * from "DeviceRegistrations" dr where dr."UserId" in (6, 53955)

--
--
--update "AspNetUsers" set "TrialWelcomeSentAt" = now(), "Trial1DayWarningSentAt" = now(), "Trial3DayWarningSentAt" = now(), "TrialExpiredWarningSentAt" = now()
--where "FirstName" like 'TestUser%' or "FirstName" like 'ltreg%' or "FirstName" like 'FirstName%'

--update "AspNetUsers" set "TrialWelcomeSentAt" = null where "Id" = 53955
update "Teams" set "CreatedAt" = '2025-12-30 10:41:16.128 -0500', "TrialEndsAt" = '2026-01-03 06:41:16.128 -0500' where "Id" = 32835;  --was: 2025-10-01 00:00:00.000 -0400 (super's team really created)
update "Teams" set "TrialEndsAt" = '2026-01-05 06:41:16.128 -0500' where "Id" = 32835;  --was: 2025-10-01 00:00:00.000 -0400 (super's team really created)

update "AspNetUsers" set "TrialExpiredWarningSentAt" = null where "Id" = 53955;
--set "TrialWelcomeSentAt" = null, "Trial1DayWarningSentAt" = null, "Trial3DayWarningSentAt" = null, 
update "AspNetUsers" set "TrialWelcomeSentAt" = '2025-11-10 10:41:16.128 -0500' where "Id" = 53955
update "AspNetUsers" set "TrialWelcomeSentAt" = '2025-11-07 10:41:16.128 -0500' where "Id" = 53955
--, "Trial1DayWarningSent" = true, "Trial3DayWarningSent" = true, "TrialExpiredWarningSent" = true
--where "FirstName" like 'TestUser%' or "FirstName" like 'ltreg%' or "FirstName" like 'FirstName%'



select u."UserName", u."Email", dr.*
from "DeviceRegistrations" dr
	join "AspNetUsers" u on dr."UserId" = u."Id" 
where dr."UserId" = 53955

--update "Teams" set "SubscriptionTier" = 1 where "Id" in (7, 10277, 32833, 32834)

update "AspNetUsers" set "Email" = 'super1@dodone.com', "NormalizedEmail" = 'SUPER1@DODONE.COM' where "Id" = 53955
--select u."Id", u."TeamId", u."UserName", u."Email" , u."FirstName", u."IsFirstTeamAdmin", u."IsAdmin" , u."IsActive", u."CreatedAt"  
--from "AspNetUsers" u
--where u."TeamId" = 271
--
--select *
--from "TaskGroups" g
--where g."UserId" = 615 or g."TeamId" = 271;
--
--delete from "TaskItems" 
--where "ArchivedBy" = 615

--select * 
--from "TaskItems" t
--where t."GroupId" in (436, 540, 541, 542, 543, 544);

--select *
--from "AllowanceHistories" g
--where g."UserId" = 615 or g."TeamId" = 271;
--
----delete from "TaskItems" where "Id" = 100011
--
--select * 
--from "TeamAllowanceIntervals" ai
--where ai."TeamId" = 271;
--
--delete from "AllowanceHistories" where "TeamAllowanceIntervalId" in (
--	select "Id" 
--	from "TeamAllowanceIntervals" ai
--	where ai."TeamId" = 271
--)
----"TeamId" = 271 or "UserId" = 615
--commit;
--delete from "TeamAllowanceIntervals"
--where "TeamId" = 271

--
--select 'Group', * from TaskGroups g where g.UserId = @userId 
--select 'Kind', * from TaskKinds k where k.GroupId in (select Id from TaskGroups g where g.UserId = @userId)
--select 'Cat', * from TaskCategories c where c.KindId in (select Id from TaskKinds where GroupId in (select Id from TaskGroups where UserId = @userId))
--select 'Pin', * from UserTaskItemPins utip where utip.TaskItemId in (select Id from TaskItems where AssignedTo = @userId or CreatedBy = @userId)
--select 'Comment', * from TaskComments tc where tc.TaskItemId in (select Id from TaskItems where AssignedTo = @userId or CreatedBy = @userId)
--
--select 'Intervals', Name, * 
--from TeamAllowanceIntervals ai 
--where ai.TeamId = @teamId
--
--select 'GradeConfig', *
--from AllowanceIntervalGradeConfigs
--
--select 'Tasks', t.Id, t.[Name], t.IsArchived, t.IsPrivate, IsApprovedForAllowance, ai.Name Interval, AssignedTo, Credits, GradeId  --,  t.* 
--from TaskItems t 
--	left join TeamAllowanceIntervals ai on t.TeamAllowanceIntervalId = ai.Id
--where AssignedTo = @userId or t.CreatedBy = @userId
--
--select 'Hist', ah.Id, ai.Name Interval, TotalCredits, Gpa, CalculatedAmount, AllowanceIntervalType, AllowanceIntervalValue, CalculatedStartAt, ActualStartAt, CalculatedEndAt
--from AllowanceHistories ah 
--	left join TeamAllowanceIntervals ai on ah.TeamAllowanceIntervalId = ai.Id
--where ah.UserId = @userId
----delete from TaskItems where Id in (190, 191)
----delete from UserNotifications where Id = 20
----delete from AllowanceHistories where UserId = 93
--select 'HistItems', * 
--from AllowanceHistoryTaskItems ahts 
--where ahts.AllowanceHistoryId in (select Id from AllowanceHistories where UserId = @userId) 
--
--select * 
--from UserNotificationPreferences unp
--where unp.UserId = @userId
--
------delete from UserNotificationPreferences
--
--
--select 'UserNotifications', * from UserNotifications n where n.UserId = @userId
----delete from UserNotifications
----delete from AllowanceHistories
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
























