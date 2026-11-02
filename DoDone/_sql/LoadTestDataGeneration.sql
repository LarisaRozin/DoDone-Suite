-- Load Test Data Generation Script for DoDone (PostgreSQL)
-- This script creates realistic test data to support load testing
-- Run this script in your DoDone PostgreSQL database

-- Clean up existing test data (optional - comment out if you want to keep existing data)
-- DELETE FROM "TaskComments" WHERE "TaskItemId" IN (SELECT "Id" FROM "TaskItems" WHERE "CreatedBy" IN (SELECT "Id" FROM "AspNetUsers" WHERE "Email" LIKE '%loadtest%'));
-- DELETE FROM "UserTaskItemPins" WHERE "TaskItemId" IN (SELECT "Id" FROM "TaskItems" WHERE "CreatedBy" IN (SELECT "Id" FROM "AspNetUsers" WHERE "Email" LIKE '%loadtest%'));
-- DELETE FROM "TaskItems" WHERE "CreatedBy" IN (SELECT "Id" FROM "AspNetUsers" WHERE "Email" LIKE '%loadtest%');
-- DELETE FROM "AspNetUsers" WHERE "Email" LIKE '%loadtest%';
-- DELETE FROM "Teams" WHERE "Name" LIKE '%LoadTest%';

DO $$
DECLARE
    team_counter INTEGER := 22;
    user_counter INTEGER := 105;
    task_counter INTEGER := 1;
	interval_counter INTEGER := 1;
    total_tasks INTEGER := 50000;
    current_team_id INTEGER;
    team_user_counter INTEGER;
    random_user_id INTEGER;
    random_team_id INTEGER;
    assigned_to INTEGER;
    random_interval_id INTEGER;
    random_grade_id INTEGER;
    taxonomy_user_id INTEGER;
    group_id INTEGER;
    interval_team_id INTEGER;
    month_counter INTEGER;
    start_date DATE;
    end_date DATE;
    interval_name VARCHAR(100);
    base_date TIMESTAMP;
    start_at TIMESTAMP;
    due_at TIMESTAMP;
    end_at TIMESTAMP;
    graded_at TIMESTAMP;
    group_names TEXT[] := ARRAY['Chores', 'Homework', 'Sports', 'Music', 'Projects'];
    group_name TEXT;
    i INTEGER;
BEGIN
    RAISE NOTICE 'Starting load test data generation...';

    -- Generate Test Teams
    RAISE NOTICE 'Creating test teams...';
    WHILE team_counter <= 2022 LOOP
        INSERT INTO "Teams" ("Name", "Description", "CreatedAt")
        VALUES (
            'LoadTest Team ' || team_counter::TEXT,
            'Test team ' || team_counter::TEXT || ' for load testing purposes',
            NOW()
        );
        team_counter := team_counter + 1;
    END LOOP;

----     Generate Test Users (5 users per team = 100 users total)
    RAISE NOTICE 'Creating test users...';
    FOR current_team_id IN SELECT "Id" FROM "Teams" WHERE "Name" LIKE '%LoadTest%' LOOP
        team_user_counter := 1;
        WHILE team_user_counter <= 5 LOOP
            INSERT INTO "AspNetUsers" (
                "UserName", "NormalizedUserName", "Email", "NormalizedEmail", "EmailConfirmed", "PhoneNumberConfirmed",
				"TwoFactorEnabled", "LockoutEnabled", "AccessFailedCount",
                "FirstName", "LastName", "TeamId", "IsActive", "IsAdmin", 
                "CreatedAt", "SecurityStamp", "ConcurrencyStamp"
            )
            VALUES (
                'loadtest_user_' || user_counter::TEXT,
                UPPER('loadtest_user_' || user_counter::TEXT),
                'loadtest.user2' || user_counter::TEXT || '@dodone.com',
                UPPER('loadtest.user2' || user_counter::TEXT || '@dodone.com'),
                false,
				false,
				false,
				false,
				0,
                'TestUser' || user_counter::TEXT,
                'LoadTest',
                current_team_id,
                true,
                CASE WHEN team_user_counter = 1 THEN true ELSE false END, -- First user in each team is admin
                NOW(),
                gen_random_uuid()::TEXT,
                gen_random_uuid()::TEXT
            );
            
            user_counter := user_counter + 1;
            team_user_counter := team_user_counter + 1;
        END LOOP;
    END LOOP;

    -- Generate Team Allowance Intervals
    RAISE NOTICE 'Creating allowance intervals...';
    FOR interval_team_id IN SELECT "Id" FROM "Teams" WHERE "Name" LIKE '%LoadTest%' LOOP
        -- Create 12 intervals
        interval_counter := 1;
        WHILE interval_counter <= 12 LOOP
            interval_name :=  'loadtest_interval_' || interval_counter::TEXT;
            
            INSERT INTO "TeamAllowanceIntervals" (
                "TeamId", "Name", "MaxAllowanceAmount", "MinCreditsForAllowance",
                "IntervalType", "IntervalValue", "IsActive", "ResetGradesOnIntervalEnd", "StartDayOfWeek",
                "CreatedBy", "CreatedAt"
            )
            VALUES (
                interval_team_id, 
                TRIM(interval_name), 
                1000 + FLOOR(RANDOM() * 4000)::INTEGER, -- $10-50 allowance
                10, -- Minimum credits needed
                1, -- Monthly interval type
                1, -- Interval value of 1 month
                true,
                true,
				CEILING(RANDOM() * 7),
                (SELECT "Id" FROM "AspNetUsers" WHERE "TeamId" = interval_team_id AND "IsAdmin" = true LIMIT 1),
                NOW()
            );
            
            interval_counter := interval_counter + 1;
        END LOOP;
    END LOOP;

    -- Generate TaskGroups, TaskKinds, and TaskCategories
    RAISE NOTICE 'Creating task taxonomy...';
    FOR taxonomy_user_id IN 
        SELECT "Id" FROM "AspNetUsers" 
        WHERE "Email" LIKE '%loadtest%' AND "IsAdmin" = true -- Only admin users
    LOOP
        -- Create groups using array iteration
        FOR i IN 1..array_length(group_names, 1) LOOP
            group_name := group_names[i];
            
            INSERT INTO "TaskGroups" ("Name", "UserId", "CreatedAt", "CreatedBy", "IsActive")
            VALUES (group_name, taxonomy_user_id, NOW(), taxonomy_user_id, true)
            RETURNING "Id" INTO group_id;
            
            -- Create kinds for each group
            IF group_name = 'Chores' THEN
                INSERT INTO "TaskKinds" ("Name", "GroupId", "CreatedAt", "CreatedBy", "IsActive") 
                VALUES ('Daily Chores', group_id, NOW(), taxonomy_user_id, true);
                INSERT INTO "TaskKinds" ("Name", "GroupId", "CreatedAt", "CreatedBy", "IsActive") 
                VALUES ('Weekly Chores', group_id, NOW(), taxonomy_user_id, true);
            ELSIF group_name = 'Homework' THEN
                INSERT INTO "TaskKinds" ("Name", "GroupId", "CreatedAt", "CreatedBy", "IsActive") 
                VALUES ('Math', group_id, NOW(), taxonomy_user_id, true);
                INSERT INTO "TaskKinds" ("Name", "GroupId", "CreatedAt", "CreatedBy", "IsActive") 
                VALUES ('Science', group_id, NOW(), taxonomy_user_id, true);
                INSERT INTO "TaskKinds" ("Name", "GroupId", "CreatedAt", "CreatedBy", "IsActive") 
                VALUES ('English', group_id, NOW(), taxonomy_user_id, true);
            ELSE
                INSERT INTO "TaskKinds" ("Name", "GroupId", "CreatedAt", "CreatedBy", "IsActive") 
                VALUES (group_name || ' Tasks', group_id, NOW(), taxonomy_user_id, true);
            END IF;
        END LOOP;
    END LOOP;

    -- Generate massive amount of TaskItems (50,000 tasks)
    RAISE NOTICE 'Creating task items... This may take a few minutes...';
    task_counter := 1;
    WHILE task_counter <= total_tasks LOOP
        -- Get random user and team
        SELECT "Id", "TeamId" INTO random_user_id, random_team_id
        FROM "AspNetUsers" 
        WHERE "Email" LIKE '%loadtest%'
        ORDER BY RANDOM()
        LIMIT 1;
        
        -- Get random assignee from same team
        SELECT "Id" INTO assigned_to
        FROM "AspNetUsers" 
        WHERE "Email" LIKE '%loadtest%' AND "TeamId" = random_team_id
        ORDER BY RANDOM()
        LIMIT 1;
        
        -- Get random interval for the team
        SELECT "Id" INTO random_interval_id
        FROM "TeamAllowanceIntervals" 
        WHERE "TeamId" = random_team_id
        ORDER BY RANDOM()
        LIMIT 1;
        
        -- Get random grade (60% of tasks have grades)
        random_grade_id := NULL;
        IF RANDOM() > 0.4 THEN
            SELECT "Id" INTO random_grade_id FROM "Grades" ORDER BY RANDOM() LIMIT 1;
        END IF;
        
        -- Generate random dates
        base_date := NOW() - (RANDOM() * INTERVAL '180 days'); -- Last 6 months
        start_at := CASE WHEN RANDOM() > 0.3 THEN base_date + (RANDOM() * INTERVAL '48 hours') ELSE NULL END;
        due_at := CASE WHEN RANDOM() > 0.2 THEN base_date + (RANDOM() * INTERVAL '30 days') + INTERVAL '1 day' ELSE NULL END;
        end_at := CASE WHEN RANDOM() > 0.4 THEN base_date + (RANDOM() * INTERVAL '45 days') + INTERVAL '1 day' ELSE NULL END;
        graded_at := CASE WHEN random_grade_id IS NOT NULL THEN base_date + (RANDOM() * INTERVAL '10 days') ELSE NULL END;
        
        INSERT INTO "TaskItems" (
            "Name", "Description", "AssignedTo", "CreatedBy", "TeamId", "TeamAllowanceIntervalId",
            "StartAt", "DueAt", "EndAt", "GradedAt", "GradeId",
            "IsActive", "IsPrivate", "IsArchived", "IsApprovedForAllowance",
            "PercentComplete", "MaxBonus", "Credits",
            "CreatedAt", "UpdatedAt", "IsBonusRejected"
        )
        VALUES (
            'Load Test Task #' || task_counter::TEXT,
            'This is a test task created for load testing purposes. Task number ' || task_counter::TEXT,
            assigned_to, random_user_id, random_team_id, random_interval_id,
            start_at, due_at, end_at, graded_at, random_grade_id,
            CASE WHEN RANDOM() > 0.1 THEN true ELSE false END, -- 90% active
            false, -- 20% private
            false, -- 5% archived
            true, -- 70% approved
            FLOOR(RANDOM() * 101)::INTEGER, -- 0-100%
            CASE WHEN RANDOM() > 0.7 THEN 'Bonus1' ELSE NULL END, -- 30% have bonus
            CEILING(RANDOM() * 5), 
            base_date, base_date, false
        );
        
        -- Show progress every 5000 tasks
        IF task_counter % 5000 = 0 THEN
            RAISE NOTICE 'Created % tasks...', task_counter;
        END IF;
        
        task_counter := task_counter + 1;
    END LOOP;

    RAISE NOTICE 'Load test data generation completed!';
    RAISE NOTICE 'Generated:';
    RAISE NOTICE '- 20 Teams';
    RAISE NOTICE '- 100 Users (5 per team)';
    RAISE NOTICE '- 240 Allowance Intervals (12 months per team)';
    RAISE NOTICE '- % Task Items', total_tasks;
    RAISE NOTICE 'You can now run your k6 load tests!';
END $$;

select count(*) from "AspNetUsers"
select count(*) from "TaskItems"


-- Show some statistics
SELECT 
    'Tasks by Status' as "Category",
    SUM(CASE WHEN "IsActive" = true THEN 1 ELSE 0 END) as "Active",
    SUM(CASE WHEN "IsArchived" = true THEN 1 ELSE 0 END) as "Archived",
    SUM(CASE WHEN "PercentComplete" = 100 THEN 1 ELSE 0 END) as "Completed",
    SUM(CASE WHEN "IsPrivate" = true THEN 1 ELSE 0 END) as "Private",
    SUM(CASE WHEN "IsApprovedForAllowance" = true THEN 1 ELSE 0 END) as "ApprovedForAllowance",
    SUM(CASE WHEN "MaxBonus" IS NOT NULL THEN 1 ELSE 0 END) as "WithBonus",
    COUNT(*) as "Total"
FROM "TaskItems" 
WHERE "CreatedBy" IN (SELECT "Id" FROM "AspNetUsers" WHERE "Email" LIKE '%loadtest%');