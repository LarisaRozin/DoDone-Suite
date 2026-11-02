-- Query to check the actual data created by our load test script
-- Run this to see what IDs were actually generated

-- Check Teams created
SELECT 'LoadTest Teams' as "DataType", "Id", "Name", "CreatedAt"
FROM "Teams" 
WHERE "Name" LIKE '%LoadTest%'
ORDER BY "Id"
LIMIT 10;

select "TeamId", "UserName", * 
from "AspNetUsers"
where "FirstName" not like '%Test%' and "FirstName" not like 'ltreg%' and "FirstName" not like 'FirstName%'
order by "TeamId", "UserName"


select *
from "TaskItems"
where "Id" = 111502

select count(*)
from "Teams" t
where t."Name" like 'LoadTest%'  --2022

select * 
from "Teams" t 
--where t."Id" = 8860
where t."Name" like 'LoadTest%'
order by t."Id"   -- 251-271 and 8276-10276
limit 20 

select u."TeamId" , count (u."Id") usersCount
from "Teams" t
join "AspNetUsers" u on u."TeamId" = t."Id" 
group by u."TeamId" 

select u."TeamId" , count (u."Id") usersCount
from "Teams" t
join "AspNetUsers" u on u."TeamId" = t."Id" 
where u."IsAdmin" = false
group by u."TeamId" 

select u."Email", *
from "AspNetUsers" u
where u."LastName" != 'LoadTest'

--update "AspNetUsers" set "Email" = 'me@dodone.com' where "Id" = 6

select count(*)  --10210
from "AspNetUsers" anu 
where anu."TeamId" = 8860
	--anu."LastName" = 'LoadTest'

select anu."UserName", anu."PasswordHash", anu."UpdatedAt", anu."UpdatedBy", *
from "AspNetUsers" anu 
where 
	--anu."Email" = 'loadtest.user24850@dodone.com'
	anu."LastName" = 'LoadTest'
limit 1000


select u."IsActive", u."IsAdmin", u."Email", u."UserName", *
from "AspNetUsers" u 
where 
--u."Email" like '%gmail.com'
--u."Email" = 'k6loadtest2@example.com' -- 615 (team 271)
--u."UserName" = 'master' -- 'loadtest_user_3045'  --'loadtest_user_9975'
u."TeamId" = 7 -- 32834

--update "AspNetUsers" set "Email" = 'ella3@dodone.com', "NormalizedEmail" = 'ELLA3@DODONE.COM' where "Id" = 53954;

--update "TaskItems" ti set "GradeId" = null, "GradedAt" = null, "GradedBy" = null where "GradeId" is not null and ti."GradedBy" is null

select ti."Id", ti."Name", ti."AssignedTo" , ti."IsPrivate" , ti."IsArchived", ti."Credits", ti."GradeId" --, ti."GradedAt", ti."GradedBy"  
	, ti."TeamAllowanceIntervalId", ti."IsApprovedForAllowance"  --, ti."AllowanceApprovalStatusAt", ti."AllowanceApprovalStatusBy"
	--, ti."CreatedAt", ti."CreatedBy", ti."UpdatedAt", ti."UpdatedBy" 
from "TaskItems" ti
where ti."TeamId" = 9705
--ti."CreatedBy" = 4370 or 
--ti."AssignedTo" = 7872
--where ti."CreatedBy" = 7570 or ti."AssignedTo" = 7570
--where ti."CreatedBy" = 7400 or ti."AssignedTo" = 7400

select * 
from "AllowanceHistories" ah 
where ah."UserId" = 6151 --and ah."TeamAllowanceIntervalId" = 14741
	--ah."Id" = 7520
order by ah."TeamAllowanceIntervalId" 

select *
from "AllowanceHistoryTaskItems" ahti 
where ahti."AllowanceHistoryId" = 4335


select ah."Id", ah."UserId", ah."TeamAllowanceIntervalId", ah."CalculatedStartAt", ah."CalculatedEndAt", ah."ApprovedAt", ah."CreatedAt", ah."UpdatedAt"  
from "AllowanceHistories" ah 
where --ah."UserId" = 6962 --and 
	ah."TeamAllowanceIntervalId" = 16103  and ah."UserId" = 6715
order by ah."TeamAllowanceIntervalId" 
--7874 -> 7872 

--delete from "AllowanceHistories" where "Id" = 4335

select ah."UserId", ah."TeamAllowanceIntervalId", ah."CalculatedStartAt", ah."CalculatedEndAt", count(ah."Id")
from "AllowanceHistories" ah
group by ah."UserId", ah."TeamAllowanceIntervalId", ah."CalculatedStartAt", ah."CalculatedEndAt"  
having count(ah."Id") > 1

with dupUserIntervals as (
	select ah."UserId", ah."TeamAllowanceIntervalId"
	from "AllowanceHistories" ah
	group by ah."UserId", ah."TeamAllowanceIntervalId", ah."CalculatedStartAt", ah."CalculatedEndAt"  
	having count(ah."Id") > 1
),
dupIntervalIds as (
	select ah."Id"
	from "AllowanceHistories" ah, dupUserIntervals
	where ah."UserId" = dupUserIntervals."UserId" and ah."TeamAllowanceIntervalId" = dupUserIntervals."TeamAllowanceIntervalId" 
)
delete from "AllowanceHistories" where "Id" in (select "Id" from dupIntervalIds)
--select * from dupIntervalIds 

-- shows error but worked anyway:
WITH duplicates AS (
    SELECT "Id",
           ROW_NUMBER() OVER (
               PARTITION BY "UserId", "TeamAllowanceIntervalId" 
               ORDER BY "CreatedAt" DESC
           ) as rn
    FROM "AllowanceHistories"
)
DELETE FROM "AllowanceHistories" 
WHERE "Id" IN (
    SELECT "Id" 
    FROM duplicates 
    WHERE rn > 1
);

-- Set your username here
--WITH vars AS (
--    SELECT 'val' AS userName
--),
--user_info AS (
--    SELECT u."Id" AS userId, u."TeamId" AS teamId, u."IsAdmin" AS isAdmin
--    FROM "Users" u, vars
--    WHERE u."UserName" = vars.userName
--)




select count(*)
from "AspNetUsers" u
where u."UpdatedAt" > NOW() - (INTERVAL '5 minutes')
where u."Email" = 'k6loadtest2@example.com'

select ti."AssignedTo", count(ti."Id") taskCount
from "AspNetUsers" u 
join "TaskItems" ti on ti."AssignedTo" = u."Id" 
group by ti."AssignedTo" 

select *
from "TaskItems" ti 
where ti."AssignedTo" is not null and ti."AssignedAt" is null
ti."AssignedBy" is null



update "TaskItems" set "AssignedAt" = now() 
where "AssignedTo" is not null and "AssignedAt" is null

-- Check Users created  
SELECT 'LoadTest Users' as "DataType", "Id", "UserName", "Email", "TeamId", "IsAdmin"
FROM "AspNetUsers" 
WHERE "Email" LIKE '%loadtest%'
ORDER BY "Id"
LIMIT 10;

-- Check TeamAllowanceIntervals created
SELECT 'LoadTest Intervals' as "DataType", tai."Id", tai."Name", tai."TeamId", tai."MaxAllowanceAmount", tai."CreatedBy"
FROM "TeamAllowanceIntervals" tai
JOIN "Teams" t ON tai."TeamId" = t."Id"
WHERE t."Name" LIKE '%LoadTest%'
ORDER BY tai."Id"
LIMIT 10;

-- Check TaskItems created
SELECT 'LoadTest TaskItems' as "DataType", ti."Id", ti."Name", ti."TeamId", ti."TeamAllowanceIntervalId", ti."AssignedTo", ti."CreatedBy"
	, ti."AssignedBy", ti."GradeId", ti."Credits", ti."IsPrivate", ti."IsArchived"   
FROM "TaskItems" ti
JOIN "AspNetUsers" u ON ti."CreatedBy" = u."Id"
left join "TeamAllowanceIntervals" ai on ti."TeamAllowanceIntervalId" = ai."Id" 
WHERE u."Email" LIKE '%loadtest%'  -- and ti."TeamAllowanceIntervalId" is null
	and ti."Id" = 111502
ORDER BY ti."Id"
LIMIT 10;

select "AssignedTo", "GradeId", "Credits", "GradedAt", "IsApprovedForAllowance", "IsPrivate", "IsArchived", "IsActive"
--select count(*)
from "TaskItems" 
where "GradeId" is not null and "Credits" is not null and "IsApprovedForAllowance" is not null and "IsApprovedForAllowance" = true
	and "IsPrivate" is false  --59938
limit 1000;

select count(*) from "Teams"
select * from "AllowanceHistories" ah 

select *
from "TaskItems"
where "GradeId" is not null and "AssignedTo" is null

select u."UserName", *
from "AspNetUsers" u
order by u."Id" 
limit 10

select "AssignedTo", count(*)
from "TaskItems" 
where "GradeId" is not null and "Credits" is not null and "IsApprovedForAllowance" is not null and "IsApprovedForAllowance" = true
	and "IsPrivate" is false  --59938
group by "AssignedTo" 



select "AssignedTo", count(*)
from "TaskItems" ti 
where 
group by "AssignedTo" 



-- Get ranges for k6 testing
SELECT 
    'Data Ranges for k6' as "Summary",
    (SELECT MIN("Id") FROM "Teams" WHERE "Name" LIKE '%LoadTest%') as "MinTeamId",
    (SELECT MAX("Id") FROM "Teams" WHERE "Name" LIKE '%LoadTest%') as "MaxTeamId",
    (SELECT MIN("Id") FROM "AspNetUsers" WHERE "Email" LIKE '%loadtest%') as "MinUserId", 
    (SELECT MAX("Id") FROM "AspNetUsers" WHERE "Email" LIKE '%loadtest%') as "MaxUserId",
    (SELECT MIN(tai."Id") FROM "TeamAllowanceIntervals" tai JOIN "Teams" t ON tai."TeamId" = t."Id" WHERE t."Name" LIKE '%LoadTest%') as "MinIntervalId",
    (SELECT MAX(tai."Id") FROM "TeamAllowanceIntervals" tai JOIN "Teams" t ON tai."TeamId" = t."Id" WHERE t."Name" LIKE '%LoadTest%') as "MaxIntervalId";

-- Check for data consistency issues
SELECT 
    'Data Issues' as "CheckType",
    COUNT(*) as "TaskItemsWithMissingIntervals"
FROM "TaskItems" ti
LEFT JOIN "TeamAllowanceIntervals" tai ON ti."TeamAllowanceIntervalId" = tai."Id"
WHERE ti."CreatedBy" IN (SELECT "Id" FROM "AspNetUsers" WHERE "Email" LIKE '%loadtest%')
AND tai."Id" IS NULL;

-- Show team/interval mapping for debugging
SELECT 
    'Team-Interval Mapping' as "DataType",
    t."Id" as "TeamId", 
    t."Name" as "TeamName",
    tai."Id" as "IntervalId",
    tai."Name" as "IntervalName"
FROM "Teams" t
LEFT JOIN "TeamAllowanceIntervals" tai ON t."Id" = tai."TeamId"
WHERE t."Name" LIKE '%LoadTest%'
ORDER BY t."Id", tai."Id"
LIMIT 20;




select * 
from "AspNetUsers" u
where u."Email" like '%gmail.com%'
--
--update "AspNetUsers" set "Email" = 'rita1@dodone.com', "NormalizedEmail" = 'RITA1@DODONE.COM'
--where "Id" = 53950
--where u."UserName" = 'master' -- Id: 6, TeamId: 7

select *
from "TeamAllowanceIntervals" ai
where ai."TeamId" = 7

--update "TaskItems" ti set "TeamAllowanceIntervalId" = null where ti."TeamAllowanceIntervalId" = 93408
--delete from "TeamAllowanceIntervals" where "Id" = 93408
--delete from "AllowanceHistories" where "TeamAllowanceIntervalId" = 93408

--select s."Id", s."TeamAllowanceIntervalId" IntervaId, s."Name", s."StartMonth", s."StartDay", s."EndMonth", s."EndDay" 

select *
from "TeamAllowanceIntervalGradingPeriods" s

select s."Id", s."TeamAllowanceIntervalId", s."Name", s."StartMonth", s."StartDay", s."EndMonth", s."EndDay", s."IsSchoolBreak"  
from "TeamAllowanceIntervalGradingPeriods" s
order by s."StartMonth", s."StartDay", s."EndMonth", s."EndDay"; 
--order by s."StartMonth" desc, s."StartDay" desc 

select h."CalculatedStartAt", h."CalculatedEndAt", h."TotalCredits", h."Gpa", h."CalculatedAmount", h."CreatedBy" , h."CreatedAt" , h."UpdatedBy" , h."UpdatedAt"  
from "AllowanceHistories" h
where h."TeamId" = 7 and h."TeamAllowanceIntervalId" = 93411


/*
Id|TeamAllowanceIntervalId|Name              |StartMonth|StartDay|EndMonth|EndDay|IsSchoolBreak|
--+-----------------------+------------------+----------+--------+--------+------+-------------+
 8|                  93409|Spring Semester Q1|         1|       6|       3|    16|false        |
 9|                  93409|School Break      |         3|      17|       3|    22|true         |
10|                  93409|Spring Semester Q2|         3|      23|       5|    28|false        |
11|                  93409|School Break      |         5|      29|       8|    10|true         |
12|                  93409|Fall Semester Q1  |         8|      11|      10|    10|false        |
13|                  93409|Fall Semester Q2  |        10|      11|      12|    19|false        |
14|                  93409|School Break      |        12|      20|       1|     5|true         |

CalculatedStartAt            |CalculatedEndAt              |TotalCredits|Gpa |CalculatedAmount|
-----------------------------+-----------------------------+------------+----+----------------+
2025-10-11 00:00:00.000 -0400|2025-12-19 23:59:59.000 -0500|           3|3.00|          162.00|

 */



select ti."Id", ti."Name"
	, ti."IsArchived", ti."IsActive", ti."IsPrivate", ti."IsApprovedForAllowance"
	, ti."TeamAllowanceIntervalId"
	--, ti."CreatedBy", ti."AssignedTo"
	, ti."Credits", ti."GradeId"
	, ti."PercentComplete" 
from "TaskItems" ti
where ti."TeamId" = 7
	and ti."Credits" is not null






