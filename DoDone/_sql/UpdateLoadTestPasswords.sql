-- SQL script to copy password hash from k6loadtest2@example.com to all load test users
-- This will set all load test users to have the same password: "LoadTest123!"

-- First, let's check the current state
SELECT 
    'Before Update' as Status,
    COUNT(*) as TotalLoadTestUsers,
    SUM(CASE WHEN "PasswordHash" IS NULL THEN 1 ELSE 0 END) as UsersWithNullPassword,
    SUM(CASE WHEN "PasswordHash" IS NOT NULL THEN 1 ELSE 0 END) as UsersWithPassword
FROM "AspNetUsers" 
WHERE "Email" LIKE '%loadtest%';

-- Get the password hash from the reference user
DO $$
DECLARE
    reference_password_hash TEXT;
    updated_count INTEGER;
BEGIN
    -- Get the password hash from k6loadtest2@example.com
    SELECT "PasswordHash" INTO reference_password_hash
    FROM "AspNetUsers" 
    WHERE "Email" = 'k6loadtest2@example.com'
    AND "PasswordHash" IS NOT NULL;
    
    -- Check if we found the reference user
    IF reference_password_hash IS NULL THEN
        RAISE EXCEPTION 'Could not find password hash for k6loadtest2@example.com. Make sure this user exists and has a password set.';
    END IF;
    
    RAISE NOTICE 'Found reference password hash: %', LEFT(reference_password_hash, 50) || '...';
    
    -- Update all load test users with NULL password hash
    UPDATE "AspNetUsers" 
    SET "PasswordHash" = reference_password_hash
    WHERE "Email" LIKE '%loadtest%' 
    AND "PasswordHash" IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % load test users with the reference password hash', updated_count;
    
END $$;

-- Verify the update
SELECT 
    'After Update' as Status,
    COUNT(*) as TotalLoadTestUsers,
    SUM(CASE WHEN "PasswordHash" IS NULL THEN 1 ELSE 0 END) as UsersWithNullPassword,
    SUM(CASE WHEN "PasswordHash" IS NOT NULL THEN 1 ELSE 0 END) as UsersWithPassword
FROM "AspNetUsers" 
WHERE "Email" LIKE '%loadtest%';

-- Show some sample users to verify
SELECT 
    "Email",
    "FirstName",
    "LastName",
    "TeamId",
    "IsAdmin",
    CASE 
        WHEN "PasswordHash" IS NULL THEN 'NULL'
        ELSE 'SET (' || LENGTH("PasswordHash") || ' chars)'
    END as PasswordStatus
FROM "AspNetUsers" 
WHERE "Email" LIKE '%loadtest%'
ORDER BY "TeamId", "Email"
LIMIT 10;

RAISE NOTICE 'Password update completed! All load test users now have the same password as k6loadtest2@example.com';
RAISE NOTICE 'You can now use password "LoadTest123!" for all load test users';