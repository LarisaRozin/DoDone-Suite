-- Performance Indexes for DoDone Database
-- Run this script in pgAdmin or psql as the postgres user or database owner

-- Drop old single-column indexes that will be replaced with composite indexes
DROP INDEX IF EXISTS "IX_TaskItems_AssignedTo";
DROP INDEX IF EXISTS "IX_TaskItems_CreatedBy";
DROP INDEX IF EXISTS "IX_TaskItems_TeamAllowanceIntervalId";
DROP INDEX IF EXISTS "IX_TaskItems_TeamId";

-- Create new performance indexes

-- Critical for GetAllowanceStatsAsync - filters accredited tasks by interval and date
CREATE INDEX IF NOT EXISTS "IX_TaskItems_TeamAllowanceIntervalId_GradedAt_Accredited"
ON "TaskItems" ("TeamAllowanceIntervalId", "GradedAt")
WHERE "IsApprovedForAllowance" = true 
  AND "IsArchived" = false 
  AND "IsPrivate" = false 
  AND "GradeId" IS NOT NULL;

-- For assigned tasks queries
CREATE INDEX IF NOT EXISTS "IX_TaskItems_AssignedTo_IsActive"
ON "TaskItems" ("AssignedTo", "IsActive");

-- For private tasks queries
CREATE INDEX IF NOT EXISTS "IX_TaskItems_CreatedBy_IsPrivate"
ON "TaskItems" ("CreatedBy", "IsPrivate");

-- For due date notification queries
CREATE INDEX IF NOT EXISTS "IX_TaskItems_DueAt_PercentComplete_Active"
ON "TaskItems" ("DueAt", "PercentComplete")
WHERE "DueAt" IS NOT NULL AND "IsActive" = true;

-- For start date queries
CREATE INDEX IF NOT EXISTS "IX_TaskItems_StartAt_Active"
ON "TaskItems" ("StartAt")
WHERE "StartAt" IS NOT NULL AND "IsActive" = true;

-- For end date queries
CREATE INDEX IF NOT EXISTS "IX_TaskItems_EndAt_Active"
ON "TaskItems" ("EndAt")
WHERE "EndAt" IS NOT NULL AND "IsActive" = true;

-- For team-based queries
CREATE INDEX IF NOT EXISTS "IX_TaskItems_TeamId_IsActive"
ON "TaskItems" ("TeamId", "IsActive");

-- For bonus status queries
CREATE INDEX IF NOT EXISTS "IX_TaskItems_MaxBonus_BonusStatusAt"
ON "TaskItems" ("MaxBonus", "BonusStatusAt")
WHERE "MaxBonus" IS NOT NULL;

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'TaskItems'
  AND indexname LIKE 'IX_TaskItems_%'
ORDER BY indexname;
